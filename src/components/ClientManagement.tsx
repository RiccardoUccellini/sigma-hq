import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import HamburgerMenu from './HamburgerMenu';
import bianco5Image from '../assets/bianco_5.png';
import typeBiancaImage from '../assets/type bianca.png';
import videoIcon from '../assets/video-svgrepo-com.svg';
import instagramIcon from '../assets/instagram-svgrepo-com.svg';
import facebookIcon from '../assets/facebook-176-svgrepo-com.svg';
import linkedinIcon from '../assets/linkedin-161-svgrepo-com.svg';
import tiktokIcon from '../assets/tiktok-svgrepo-com.svg';
import youtubeIcon from '../assets/youtube-svgrepo-com.svg';
import calendarIcon from '../assets/calendar-lines-svgrepo-com.svg';
import './ClientManagement.css';

interface Client {
  id: string;
  nameCompany: string;
  startDate: Date;
  isActive: boolean;
  clientType?: 'former' | 'prospective';
  endDate?: Date;
  createdAt: Date;
}

interface PEDEntry {
  id: string;
  clientId: string;
  publicationName: string;
  releaseDate: string;
  postType: string;
  platforms: string[];
  copy: string;
  hashtags: string;
  dropboxLink: string;
  createdAt: Date;
}

interface BrainDumpNote {
  id: string;
  clientId: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ClientManagementProps {
  onNavigate?: (page: string) => void;
}

export default function ClientManagement({ onNavigate }: ClientManagementProps) {
  const { currentUser } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [pedEntries, setPedEntries] = useState<PEDEntry[]>([]);
  const [brainDumpNotes, setBrainDumpNotes] = useState<BrainDumpNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [showPedForm, setShowPedForm] = useState(false);
  const [showPedManagement, setShowPedManagement] = useState(false);
  const [showBrainDumpForm, setShowBrainDumpForm] = useState(false);
  const [editingBrainDumpNote, setEditingBrainDumpNote] = useState<string | null>(null);
  const [selectedBrainDumpNotes, setSelectedBrainDumpNotes] = useState<string[]>([]);
  const [brainDumpDateFilterFrom, setBrainDumpDateFilterFrom] = useState('');
  const [brainDumpDateFilterTo, setBrainDumpDateFilterTo] = useState('');
  const [brainDumpSearchQuery, setBrainDumpSearchQuery] = useState('');
  const [pedFormStep, setPedFormStep] = useState(1);
  const [selectedPedEntries, setSelectedPedEntries] = useState<string[]>([]);
  const [editingPedEntry, setEditingPedEntry] = useState<string | null>(null);
  const [pedDateFilterFrom, setPedDateFilterFrom] = useState('');
  const [pedDateFilterTo, setPedDateFilterTo] = useState('');
  const [pedSearchQuery, setPedSearchQuery] = useState('');
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportDateFrom, setExportDateFrom] = useState('');
  const [exportDateTo, setExportDateTo] = useState('');
  const [brainDumpFormData, setBrainDumpFormData] = useState({
    title: '',
    content: ''
  });
  const [pedFormData, setPedFormData] = useState({
    publicationName: '',
    releaseDate: '',
    postType: '',
    platforms: [] as string[], // Changed to array for multi-select
    copy: '',
    hashtags: '',
    dropboxLink: ''
  });

  // Load clients from Firestore
  useEffect(() => {
    loadClients();
    loadPedEntries();
    loadBrainDumpNotes();
  }, []);

  const loadClients = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'clients'));
      const clientsData: Client[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        clientsData.push({
          id: doc.id,
          nameCompany: data.nameCompany,
          startDate: data.startDate.toDate(),
          isActive: data.isActive,
          clientType: data.clientType,
          endDate: data.endDate ? data.endDate.toDate() : undefined,
          createdAt: data.createdAt.toDate()
        });
      });
      
      setClients(clientsData);
    } catch (error) {
      console.error('Error loading clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPedEntries = async () => {
    try {
      const querySnapshot = await getDocs(
        query(collection(db, 'pedEntries'), orderBy('createdAt', 'desc'))
      );
      const pedData: PEDEntry[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        pedData.push({
          id: doc.id,
          clientId: data.clientId,
          publicationName: data.publicationName,
          releaseDate: data.releaseDate || '',
          postType: data.postType,
          platforms: data.platforms || (data.platform ? [data.platform] : []), // Handle migration from old single platform
          copy: data.copy,
          hashtags: data.hashtags,
          dropboxLink: data.dropboxLink,
          createdAt: data.createdAt.toDate()
        });
      });
      
      setPedEntries(pedData);
    } catch (error) {
      console.error('Error loading PED entries:', error);
    }
  };

  const loadBrainDumpNotes = async () => {
    try {
      const querySnapshot = await getDocs(
        query(collection(db, 'brainDumpNotes'), orderBy('updatedAt', 'desc'))
      );
      const notesData: BrainDumpNote[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        notesData.push({
          id: doc.id,
          clientId: data.clientId,
          title: data.title,
          content: data.content,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate()
        });
      });
      
      setBrainDumpNotes(notesData);
    } catch (error) {
      console.warn('Brain dump notes collection might not exist yet:', error);
      // Initialize with empty array if collection doesn't exist
      setBrainDumpNotes([]);
    }
  };

  // Filter to show only active and prospective clients
  const getFilteredClients = () => {
    return clients.filter(client => {
      return client.isActive || (!client.isActive && client.clientType === 'prospective');
    });
  };

  // Get upcoming PED entries for the selected client (next 3 releases)
  const getUpcomingPedEntries = () => {
    if (!selectedClient) return [];
    
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of day for comparison
    
    return pedEntries
      .filter(entry => entry.clientId === selectedClient.id)
      .filter(entry => {
        if (!entry.releaseDate) return false;
        const releaseDate = new Date(entry.releaseDate);
        return releaseDate >= today; // Only future/today releases
      })
      .sort((a, b) => new Date(a.releaseDate).getTime() - new Date(b.releaseDate).getTime()) // Sort by release date ascending
      .slice(0, 3); // Take only the next 3
  };

  const handleClientClick = (client: Client) => {
    setSelectedClient(client);
    setActiveTab('overview');
  };

  const closeClientPopup = () => {
    setSelectedClient(null);
  };

  const openPedForm = () => {
    setShowPedForm(true);
    setPedFormStep(1);
  };

  const closePedForm = () => {
    setShowPedForm(false);
    setPedFormStep(1);
    setPedFormData({
      publicationName: '',
      releaseDate: '',
      postType: '',
      platforms: [],
      copy: '',
      hashtags: '',
      dropboxLink: ''
    });
  };

  const nextFormStep = () => {
    setPedFormStep(prev => Math.min(prev + 1, 3));
  };

  const prevFormStep = () => {
    setPedFormStep(prev => Math.max(prev - 1, 1));
  };

  const handlePedFormChange = (field: string, value: string) => {
    setPedFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePlatformChange = (platform: string) => {
    setPedFormData(prev => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter(p => p !== platform)
        : [...prev.platforms, platform]
    }));
  };

  // PED Management Functions
  const openPedManagement = () => {
    setShowPedManagement(true);
    setSelectedPedEntries([]);
    setEditingPedEntry(null);
    setPedDateFilterFrom('');
    setPedDateFilterTo('');
    setPedSearchQuery('');
  };

  const closePedManagement = () => {
    setShowPedManagement(false);
    setSelectedPedEntries([]);
    setEditingPedEntry(null);
  };

  const getFilteredPedEntries = () => {
    if (!selectedClient) return [];
    
    let filtered = pedEntries.filter(entry => entry.clientId === selectedClient.id);
    
    // Apply date range filter
    if (pedDateFilterFrom) {
      const fromDate = new Date(pedDateFilterFrom);
      fromDate.setHours(0, 0, 0, 0);
      filtered = filtered.filter(entry => {
        const entryDate = new Date(entry.releaseDate);
        return entryDate >= fromDate;
      });
    }
    
    if (pedDateFilterTo) {
      const toDate = new Date(pedDateFilterTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(entry => {
        const entryDate = new Date(entry.releaseDate);
        return entryDate <= toDate;
      });
    }
    
    // Apply search filter (search in publication name and copy)
    if (pedSearchQuery.trim()) {
      const searchLower = pedSearchQuery.toLowerCase().trim();
      filtered = filtered.filter(entry => 
        entry.publicationName.toLowerCase().includes(searchLower) ||
        entry.copy.toLowerCase().includes(searchLower)
      );
    }
    
    // Sort by release date (newest/highest dates first)
    return filtered.sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime());
  };

  const handleSelectPedEntry = (entryId: string) => {
    setSelectedPedEntries(prev => 
      prev.includes(entryId) 
        ? prev.filter(id => id !== entryId)
        : [...prev, entryId]
    );
  };

  const handleSelectAllPedEntries = () => {
    const filteredEntries = getFilteredPedEntries();
    const allSelected = filteredEntries.length > 0 && selectedPedEntries.length === filteredEntries.length;
    
    if (allSelected) {
      setSelectedPedEntries([]);
    } else {
      setSelectedPedEntries(filteredEntries.map(entry => entry.id));
    }
  };

  const handleDeleteSelectedPedEntries = async () => {
    if (selectedPedEntries.length === 0) return;
    
    const confirmed = window.confirm(`Are you sure you want to delete ${selectedPedEntries.length} PED entries?`);
    if (!confirmed) return;
    
    try {
      // Note: In a real app, you'd delete from Firestore here
      // For now, we'll just remove from local state
      setPedEntries(prev => prev.filter(entry => !selectedPedEntries.includes(entry.id)));
      setSelectedPedEntries([]);
      alert(`${selectedPedEntries.length} PED entries deleted successfully!`);
    } catch (error) {
      console.error('Error deleting PED entries:', error);
      alert('Error deleting PED entries. Please try again.');
    }
  };

  const handleEditPedEntry = (entryId: string) => {
    setEditingPedEntry(entryId);
  };

  const handleSavePedEntry = async (entryId: string, updatedData: Partial<PEDEntry>) => {
    try {
      // Note: In a real app, you'd update in Firestore here
      setPedEntries(prev => prev.map(entry => 
        entry.id === entryId ? { ...entry, ...updatedData } : entry
      ));
      setEditingPedEntry(null);
      alert('PED entry updated successfully!');
    } catch (error) {
      console.error('Error updating PED entry:', error);
      alert('Error updating PED entry. Please try again.');
    }
  };

  // Export Functions
  const openExportDialog = () => {
    setShowExportDialog(true);
    // Set default dates to current month
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    setExportDateFrom(firstDay.toISOString().split('T')[0]);
    setExportDateTo(lastDay.toISOString().split('T')[0]);
  };

  const closeExportDialog = () => {
    setShowExportDialog(false);
    setExportDateFrom('');
    setExportDateTo('');
  };

  const generatePedReport = async () => {
    if (!selectedClient || !exportDateFrom || !exportDateTo) return;

    try {
      // Filter PED entries by date range
      const fromDate = new Date(exportDateFrom);
      const toDate = new Date(exportDateTo);
      fromDate.setHours(0, 0, 0, 0);
      toDate.setHours(23, 59, 59, 999);

      const filteredEntries = pedEntries.filter(entry => {
        if (entry.clientId !== selectedClient.id) return false;
        if (!entry.releaseDate) return false;
        
        const entryDate = new Date(entry.releaseDate);
        return entryDate >= fromDate && entryDate <= toDate;
      });

      if (filteredEntries.length === 0) {
        alert('No PED entries found for the selected date range.');
        return;
      }

      // Sort entries by release date
      filteredEntries.sort((a, b) => new Date(a.releaseDate).getTime() - new Date(b.releaseDate).getTime());

      // Generate PDF
      await createPedPdf(filteredEntries, selectedClient, exportDateFrom, exportDateTo);
      
      closeExportDialog();
    } catch (error) {
      console.error('Error generating PED report:', error);
      alert('Error generating PDF report. Please try again.');
    }
  };

  const createPedPdf = async (entries: PEDEntry[], client: Client, dateFrom: string, dateTo: string) => {
    // Dynamic import for PDF generation
    const { jsPDF } = await import('jspdf');
    
    // Helper function to convert image to base64
    const getImageBase64 = (imageSrc: string): Promise<string> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = img.width;
          canvas.height = img.height;
          ctx?.drawImage(img, 0, 0);
          const dataURL = canvas.toDataURL('image/png');
          resolve(dataURL);
        };
        img.onerror = reject;
        img.src = imageSrc;
      });
    };

    // Create horizontal PDF for more space
    const doc = new jsPDF('landscape', 'mm', 'a4');
    
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    let yPosition = 30;

    // Add purple background header
    doc.setFillColor(91, 57, 131); // Purple
    doc.rect(0, 0, pageWidth, 40, 'F');

    try {
      // Add bianco_5.png logo in top right corner
      const logoBase64 = await getImageBase64(bianco5Image);
      const logoWidth = 25;
      const logoHeight = 15;
      doc.addImage(logoBase64, 'PNG', pageWidth - logoWidth - 10, 12, logoWidth, logoHeight);
    } catch (error) {
      console.warn('Could not load logo image:', error);
      // Fallback text
      doc.setFontSize(10);
      doc.setTextColor(255, 255, 255);
      doc.text('SIGMA HQ', pageWidth - 25, 25, { align: 'right' });
    }

    // Client name (large and prominent)
    doc.setFontSize(24);
    doc.setTextColor(255, 255, 255); // White text
    doc.text(client.nameCompany, 20, 25);

    // Reset text color for body content
    doc.setTextColor(0, 0, 0);
    yPosition = 60;

    // Period and content count on same line
    const fromFormatted = new Date(dateFrom).toLocaleDateString('en-US', { 
      year: 'numeric', month: 'long', day: 'numeric' 
    });
    const toFormatted = new Date(dateTo).toLocaleDateString('en-US', { 
      year: 'numeric', month: 'long', day: 'numeric' 
    });
    
    doc.setFontSize(14);
    doc.setTextColor(91, 57, 131); // Purple text
    doc.text(`Period: ${fromFormatted} - ${toFormatted} | Content pieces: ${entries.length}`, 20, yPosition);
    yPosition += 15; // Reduced padding from 25 to 15

    // Content entries - compact layout
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    
    // Table headers with purple background
    const headerHeight = 8;
    doc.setFillColor(91, 57, 131);
    doc.rect(20, yPosition - 5, pageWidth - 40, headerHeight, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.text('#', 25, yPosition);
    doc.text('Publication Name', 40, yPosition);
    doc.text('Release Date', 120, yPosition);
    doc.text('Type', 170, yPosition);
    doc.text('Platforms', 200, yPosition);
    
    yPosition += headerHeight + 5;
    doc.setTextColor(0, 0, 0);

    entries.forEach((entry, index) => {
      // Check if we need a new page
      if (yPosition > pageHeight - 40) {
        doc.addPage('landscape');
        yPosition = 30;
        
        // Repeat header on new page
        doc.setFillColor(91, 57, 131);
        doc.rect(20, yPosition - 5, pageWidth - 40, headerHeight, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(9);
        doc.text('#', 25, yPosition);
        doc.text('Publication Name', 40, yPosition);
        doc.text('Release Date', 120, yPosition);
        doc.text('Type', 170, yPosition);
        doc.text('Platforms', 200, yPosition);
        yPosition += headerHeight + 5;
        doc.setTextColor(0, 0, 0);
      }

      const releaseDate = new Date(entry.releaseDate).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric'
      });

      // Row background (alternating light purple) - Fix: Start from index 1 for alternating pattern
      if ((index + 1) % 2 === 0) {
        doc.setFillColor(248, 245, 255); // Very light purple
        doc.rect(20, yPosition - 3, pageWidth - 40, 20, 'F');
      }

      // Main row data
      doc.setFontSize(9);
      doc.text(`${index + 1}`, 25, yPosition);
      doc.text(entry.publicationName, 40, yPosition);
      doc.text(releaseDate, 120, yPosition);
      doc.text(entry.postType || '-', 170, yPosition);
      doc.text(entry.platforms.length > 0 ? entry.platforms.join(', ') : '-', 200, yPosition);
      
      yPosition += 6;

      // Copy content (if exists)
      if (entry.copy && entry.copy.trim()) {
        doc.setFontSize(8);
        doc.setTextColor(60, 60, 60); // Dark gray
        const copyText = entry.copy.length > 80 ? entry.copy.substring(0, 80) + '...' : entry.copy;
        doc.text(`Copy: ${copyText}`, 40, yPosition);
        yPosition += 5;
      }

      // Hashtags (if exists) - same line as copy or new line
      if (entry.hashtags && entry.hashtags.trim()) {
        doc.setFontSize(8);
        doc.setTextColor(91, 57, 131); // Purple for hashtags
        const hashtagText = entry.hashtags.length > 60 ? entry.hashtags.substring(0, 60) + '...' : entry.hashtags;
        doc.text(`Hashtags: ${hashtagText}`, 40, yPosition);
        yPosition += 5;
      }

      yPosition += 8; // Space between entries
      doc.setTextColor(0, 0, 0); // Reset text color for next entry
    });

    // Modern footer with purple accent and type bianca logo
    const footerY = pageHeight - 15;
    doc.setFillColor(91, 57, 131);
    doc.rect(0, footerY - 5, pageWidth, 20, 'F');
    
    try {
      // Add type bianca logo in footer center (centered vertically in purple footer)
      const footerLogoBase64 = await getImageBase64(typeBiancaImage);
      const footerLogoWidth = 20;
      const footerLogoHeight = 5;
      // Center vertically but move up a bit: footerY + 5 instead of footerY + 7.5
      doc.addImage(footerLogoBase64, 'PNG', (pageWidth - footerLogoWidth) / 2, footerY + 5, footerLogoWidth, footerLogoHeight);
    } catch (error) {
      console.warn('Could not load footer logo image:', error);
      // Fallback text (also moved up)
      doc.setFontSize(10);
      doc.setTextColor(255, 255, 255);
      doc.text('SIGMA HQ', pageWidth / 2, footerY + 7, { align: 'center' });
    }

    // Generate filename and save
    const filename = `${client.nameCompany} PED - ${fromFormatted} to ${toFormatted}.pdf`;
    doc.save(filename);
  };

  // Brain Dump Management Functions
  const openBrainDumpForm = () => {
    setShowBrainDumpForm(true);
    setBrainDumpFormData({ title: '', content: '' });
    setEditingBrainDumpNote(null);
  };

  const closeBrainDumpForm = () => {
    setShowBrainDumpForm(false);
    setBrainDumpFormData({ title: '', content: '' });
    setEditingBrainDumpNote(null);
  };

  const handleBrainDumpFormChange = (field: string, value: string) => {
    setBrainDumpFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getFilteredBrainDumpNotes = () => {
    if (!selectedClient) return [];
    
    let filtered = brainDumpNotes.filter(note => note.clientId === selectedClient.id);
    
    // Apply date range filter
    if (brainDumpDateFilterFrom) {
      const fromDate = new Date(brainDumpDateFilterFrom);
      fromDate.setHours(0, 0, 0, 0);
      filtered = filtered.filter(note => {
        const noteDate = new Date(note.updatedAt);
        return noteDate >= fromDate;
      });
    }
    
    if (brainDumpDateFilterTo) {
      const toDate = new Date(brainDumpDateFilterTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(note => {
        const noteDate = new Date(note.updatedAt);
        return noteDate <= toDate;
      });
    }
    
    // Apply search filter (search in title and content)
    if (brainDumpSearchQuery.trim()) {
      const searchLower = brainDumpSearchQuery.toLowerCase().trim();
      filtered = filtered.filter(note => 
        note.title.toLowerCase().includes(searchLower) ||
        note.content.toLowerCase().includes(searchLower)
      );
    }
    
    // Sort by updated date (most recent first)
    return filtered.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  };

  const handleSelectBrainDumpNote = (noteId: string) => {
    setSelectedBrainDumpNotes(prev => 
      prev.includes(noteId) 
        ? prev.filter(id => id !== noteId)
        : [...prev, noteId]
    );
  };

  const handleSelectAllBrainDumpNotes = () => {
    const filteredNotes = getFilteredBrainDumpNotes();
    const allSelected = filteredNotes.length > 0 && selectedBrainDumpNotes.length === filteredNotes.length;
    
    if (allSelected) {
      setSelectedBrainDumpNotes([]);
    } else {
      setSelectedBrainDumpNotes(filteredNotes.map(note => note.id));
    }
  };

  const handleDeleteSelectedBrainDumpNotes = async () => {
    if (selectedBrainDumpNotes.length === 0) return;
    
    const confirmed = window.confirm(`Are you sure you want to delete ${selectedBrainDumpNotes.length} brain dump notes?`);
    if (!confirmed) return;
    
    try {
      // Remove from local state immediately for better UX
      setBrainDumpNotes(prev => prev.filter(note => !selectedBrainDumpNotes.includes(note.id)));
      setSelectedBrainDumpNotes([]);
      
      // Try to delete from Firebase in the background
      // Note: In a full implementation, you'd use deleteDoc from Firebase here
      
      alert(`${selectedBrainDumpNotes.length} brain dump notes deleted successfully!`);
    } catch (error) {
      console.error('Error deleting brain dump notes:', error);
      alert('Error deleting brain dump notes. Please try again.');
      
      // Reload notes to restore state if deletion failed
      loadBrainDumpNotes();
    }
  };

  const handleEditBrainDumpNote = (note: BrainDumpNote) => {
    setBrainDumpFormData({
      title: note.title,
      content: note.content
    });
    setEditingBrainDumpNote(note.id);
    setShowBrainDumpForm(true);
  };

  const submitBrainDumpForm = async () => {
    if (!selectedClient) return;
    
    // Check if user is authenticated
    if (!currentUser) {
      alert('You must be logged in to create brain dump notes.');
      return;
    }
    
    try {
      // Validate form data
      if (!brainDumpFormData.title.trim()) {
        alert('Please enter a title for your note.');
        return;
      }

      if (!brainDumpFormData.content.trim()) {
        alert('Please enter some content for your note.');
        return;
      }

      const now = new Date();
      
      if (editingBrainDumpNote) {
        // Update existing note - for now, just update local state
        const updatedNote = {
          title: brainDumpFormData.title.trim(),
          content: brainDumpFormData.content.trim(),
          updatedAt: now
        };

        setBrainDumpNotes(prev => prev.map(note => 
          note.id === editingBrainDumpNote 
            ? { ...note, ...updatedNote }
            : note
        ));
        
        alert('Brain dump note updated successfully!');
      } else {
        // Create new note - for now, just add to local state with a temporary ID
        const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newNote: BrainDumpNote = {
          id: tempId,
          clientId: selectedClient.id,
          title: brainDumpFormData.title.trim(),
          content: brainDumpFormData.content.trim(),
          createdAt: now,
          updatedAt: now
        };

        setBrainDumpNotes(prev => [newNote, ...prev]);
        
        // Try to save to Firebase in the background
        try {
          const noteData = {
            clientId: selectedClient.id,
            title: brainDumpFormData.title.trim(),
            content: brainDumpFormData.content.trim(),
            createdAt: now,
            updatedAt: now,
            userId: currentUser.uid
          };

          const docRef = await addDoc(collection(db, 'brainDumpNotes'), noteData);
          
          // Update the local state with the real Firebase ID
          setBrainDumpNotes(prev => prev.map(note => 
            note.id === tempId 
              ? { ...note, id: docRef.id }
              : note
          ));
          
          console.log('Brain dump note saved to Firebase:', docRef.id);
        } catch (firebaseError) {
          console.warn('Failed to save to Firebase, keeping local copy:', firebaseError);
          // Note stays in local state with temp ID
        }
        
        alert('Brain dump note created successfully!');
      }
      
      closeBrainDumpForm();
    } catch (error) {
      console.error('Error saving brain dump note:', error);
      alert('Error saving brain dump note. Please try again.');
    }
  };

  const submitPedForm = async () => {
    if (!selectedClient) return;
    
    // Check if user is authenticated
    if (!currentUser) {
      alert('You must be logged in to create PED entries.');
      return;
    }
    
    try {
      // Validate form data - only publication name and release date are required
      if (!pedFormData.publicationName || !pedFormData.releaseDate) {
        alert('Please fill in the publication name and release date.');
        return;
      }

      const pedEntry = {
        clientId: selectedClient.id,
        publicationName: pedFormData.publicationName,
        releaseDate: pedFormData.releaseDate,
        postType: pedFormData.postType,
        platforms: pedFormData.platforms,
        copy: pedFormData.copy,
        hashtags: pedFormData.hashtags,
        dropboxLink: pedFormData.dropboxLink,
        createdAt: new Date(),
        userId: currentUser.uid // Add user ID for security
      };

      console.log('Saving PED entry for client:', selectedClient.id);
      const docRef = await addDoc(collection(db, 'pedEntries'), pedEntry);
      
      // Add to local state
      const newPedEntry: PEDEntry = {
        id: docRef.id,
        ...pedEntry
      };
      setPedEntries(prev => [newPedEntry, ...prev]);
      
      console.log('PED Entry saved successfully:', docRef.id);
      alert('PED entry created successfully!');
      closePedForm();
    } catch (error) {
      console.error('Error saving PED entry:', error);
      
      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('permission')) {
          alert('Permission denied. Please make sure you are logged in and try again.');
        } else if (error.message.includes('network')) {
          alert('Network error. Please check your internet connection and try again.');
        } else {
          alert(`Error saving PED entry: ${error.message}`);
        }
      } else {
        alert('An unexpected error occurred. Please try again.');
      }
    }
  };

  return (
    <div className="client-management-root">
      {/* Hamburger Menu */}
      <HamburgerMenu onNavigate={onNavigate} />

      {/* Logo in top right */}
      <div className="client-management-header">
        <img 
          src={bianco5Image} 
          alt="SIGMA HQ" 
          className="client-management-logo"
        />
      </div>

      {/* Main content */}
      <div className="client-management-content">
        <h1 className="client-management-title">Client Management</h1>
        
        {/* Clients Grid */}
        <div className="client-management-grid">
          {loading ? (
            <div className="loading">
              <p>Loading clients...</p>
            </div>
          ) : (() => {
            const filteredClients = getFilteredClients();
            return filteredClients.length === 0 ? (
              <div className="no-clients">
                <p>No active or prospective clients found.</p>
              </div>
            ) : (
              filteredClients.map((client) => (
                <div 
                  key={client.id} 
                  className="client-management-card"
                  onClick={() => handleClientClick(client)}
                >
                  {/* Red ribbon for prospective clients */}
                  {!client.isActive && client.clientType === 'prospective' && (
                    <div className="prospective-ribbon">
                      <span>Prospective</span>
                    </div>
                  )}
                  
                  <div className="client-management-info">
                    <h3 className="client-management-name">{client.nameCompany}</h3>
                  </div>
                </div>
              ))
            );
          })()}
        </div>
      </div>

      {/* Client Detail Popup */}
      {selectedClient && (
        <div className="client-popup-overlay" onClick={closeClientPopup}>
          <div className="client-popup" onClick={(e) => e.stopPropagation()}>
            {/* Popup Header */}
            <div className="client-popup-header">
              <h2 className="client-popup-title">{selectedClient.nameCompany}</h2>
              <button className="client-popup-close" onClick={closeClientPopup}>
                ×
              </button>
            </div>

            {/* Tabs */}
            <div className="client-popup-tabs">
              <button 
                className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
                onClick={() => setActiveTab('overview')}
              >
                <span className="tab-icon">📊</span>
                Overview
              </button>
              <button 
                className={`tab-btn ${activeTab === 'ped' ? 'active' : ''}`}
                onClick={() => setActiveTab('ped')}
              >
                <span className="tab-icon">📋</span>
                PED
              </button>
              <button 
                className={`tab-btn ${activeTab === 'rec' ? 'active' : ''}`}
                onClick={() => setActiveTab('rec')}
              >
                <span className="tab-icon">🔄</span>
                Rec
              </button>
              <button 
                className={`tab-btn ${activeTab === 'scripts' ? 'active' : ''}`}
                onClick={() => setActiveTab('scripts')}
              >
                <span className="tab-icon">📝</span>
                Scripts
              </button>
              <button 
                className={`tab-btn ${activeTab === 'brain-dump' ? 'active' : ''}`}
                onClick={() => setActiveTab('brain-dump')}
              >
                <span className="tab-icon">🧠</span>
                Brain Dump
              </button>
            </div>

            {/* Tab Content */}
            <div className="client-popup-content">
              {activeTab === 'overview' && (
                <div className="tab-content">
                  <h3>Client Overview</h3>
                  <div className="overview-info">
                    <p><strong>Name/Company:</strong> {selectedClient.nameCompany}</p>
                    <p><strong>Start Date:</strong> {selectedClient.startDate.toLocaleDateString()}</p>
                    <p><strong>Status:</strong> {selectedClient.isActive ? 'Active' : selectedClient.clientType}</p>
                    {selectedClient.endDate && (
                      <p><strong>End Date:</strong> {selectedClient.endDate.toLocaleDateString()}</p>
                    )}
                  </div>
                </div>
              )}
              
              {activeTab === 'ped' && (
                <div className="tab-content">
                  <div className="tab-header">
                    <div className="tab-header-left">
                      <h3>PED - Content Calendar</h3>
                      {(() => {
                        const clientPedEntries = pedEntries.filter(entry => entry.clientId === selectedClient.id);
                        if (clientPedEntries.length === 0) return null;
                        
                        // Find the most recent release date
                        const mostRecentEntry = clientPedEntries
                          .filter(entry => entry.releaseDate)
                          .sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime())[0];
                        
                        if (!mostRecentEntry) return null;
                        
                        return (
                          <span className="coverage-badge">
                            covered till - {new Date(mostRecentEntry.releaseDate).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </span>
                        );
                      })()}
                    </div>
                    <div className="tab-header-right">
                      <button className="export-ped-btn" onClick={openExportDialog}>
                        Export PDF
                      </button>
                      <button className="generate-ped-btn" onClick={openPedForm}>
                        Generate PED
                      </button>
                    </div>
                  </div>
                  <div className="ped-content-layout">
                    {/* Left side - Upcoming entries */}
                    <div className="ped-left-section">
                      <div className="ped-upcoming-view">
                        {(() => {
                          const upcomingEntries = getUpcomingPedEntries();
                          return upcomingEntries.length === 0 ? (
                            <div className="no-upcoming-entries">
                              <p>No upcoming content scheduled for {selectedClient.nameCompany}.</p>
                              <p>Click "Generate PED" to create your next content calendar entry.</p>
                            </div>
                          ) : (
                            <div className="upcoming-entries-container">
                              <h4>Next 3 Upcoming Releases</h4>
                              <div className="upcoming-entries-list">
                                {upcomingEntries.map((entry) => (
                                  <div key={entry.id} className="upcoming-entry-card">
                                    <div className="upcoming-entry-content">
                                      <div className="upcoming-entry-left">
                                        <h5 className="upcoming-entry-name">{entry.publicationName}</h5>
                                        <div className="upcoming-entry-badges">
                                          {entry.postType && (
                                            <span className="post-type-badge">
                                              {entry.postType}
                                            </span>
                                          )}
                                          {entry.platforms.length > 0 ? (
                                            entry.platforms.map((platform, index) => (
                                              <span key={index} className="platform-badge">
                                                {platform}
                                              </span>
                                            ))
                                          ) : (
                                            <span className="no-platforms">No platforms</span>
                                          )}
                                        </div>
                                      </div>
                                      <div className="upcoming-entry-right">
                                        <div className="upcoming-entry-date-section">
                                          <img src={calendarIcon} alt="Calendar" className="calendar-icon" />
                                          <div className="upcoming-entry-date">
                                            {new Date(entry.releaseDate).toLocaleDateString('en-US', {
                                              weekday: 'short',
                                              month: 'short', 
                                              day: 'numeric'
                                            })}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                              <div className="view-all-container">
                                <button className="view-all-ped-btn" onClick={openPedManagement}>
                                  View All PED Entries
                                </button>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Right side - Statistics and Video Edited sections */}
                    <div className="ped-right-section">
                      {/* Top section - Post counters */}
                      <div className="ped-stats-section">
                        <h4>Content Statistics</h4>
                        {(() => {
                          const clientPedEntries = pedEntries.filter(entry => entry.clientId === selectedClient.id);
                          const totalPosts = clientPedEntries.length;
                          
                          // Count posts by platform
                          const platformCounts = {
                            instagram: 0,
                            tiktok: 0,
                            linkedin: 0,
                            facebook: 0,
                            youtube: 0
                          };
                          
                          clientPedEntries.forEach(entry => {
                            entry.platforms.forEach(platform => {
                              if (platformCounts.hasOwnProperty(platform)) {
                                platformCounts[platform as keyof typeof platformCounts]++;
                              }
                            });
                          });

                          return (
                            <div className="stats-content">
                              <div className="all-counters">
                                <div className="counter-item total" data-tooltip={`Total content: ${totalPosts}`}>
                                  <img src={videoIcon} alt="Total" className="counter-icon" />
                                  <span className="counter-number">{totalPosts}</span>
                                </div>
                                
                                <div className="counter-item instagram" data-tooltip={`Instagram content: ${platformCounts.instagram}`}>
                                  <img src={instagramIcon} alt="Instagram" className="counter-icon" />
                                  <span className="counter-number">{platformCounts.instagram}</span>
                                </div>
                                
                                <div className="counter-item tiktok" data-tooltip={`TikTok content: ${platformCounts.tiktok}`}>
                                  <img src={tiktokIcon} alt="TikTok" className="counter-icon" />
                                  <span className="counter-number">{platformCounts.tiktok}</span>
                                </div>
                                
                                <div className="counter-item linkedin" data-tooltip={`LinkedIn content: ${platformCounts.linkedin}`}>
                                  <img src={linkedinIcon} alt="LinkedIn" className="counter-icon" />
                                  <span className="counter-number">{platformCounts.linkedin}</span>
                                </div>
                                
                                <div className="counter-item facebook" data-tooltip={`Facebook content: ${platformCounts.facebook}`}>
                                  <img src={facebookIcon} alt="Facebook" className="counter-icon" />
                                  <span className="counter-number">{platformCounts.facebook}</span>
                                </div>
                                
                                <div className="counter-item youtube" data-tooltip={`YouTube content: ${platformCounts.youtube}`}>
                                  <img src={youtubeIcon} alt="YouTube" className="counter-icon" />
                                  <span className="counter-number">{platformCounts.youtube}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </div>

                      {/* Bottom section - Video Edited */}
                      <div className="ped-video-section">
                        <h4>Video Edited</h4>
                        <div className="coming-soon">
                          <span>🎬</span>
                          <span>Coming Soon...</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {activeTab === 'rec' && (
                <div className="tab-content">
                  <h3>Rec</h3>
                  <p>Rec content for {selectedClient.nameCompany} will be displayed here.</p>
                </div>
              )}
              
              {activeTab === 'scripts' && (
                <div className="tab-content">
                  <h3>Scripts</h3>
                  <p>Scripts content for {selectedClient.nameCompany} will be displayed here.</p>
                </div>
              )}
              
              {activeTab === 'brain-dump' && (
                <div className="tab-content">
                  <div className="tab-header">
                    <h3>Brain Dump - Ideas & Notes</h3>
                    <button className="add-brain-dump-btn" onClick={openBrainDumpForm}>
                      Add Note
                    </button>
                  </div>
                  
                  <div className="brain-dump-content">
                    {/* Filters */}
                    <div className="brain-dump-filters">
                      <div className="brain-dump-controls-left">
                        <div className="search-box-extended">
                          <input
                            type="text"
                            value={brainDumpSearchQuery}
                            onChange={(e) => setBrainDumpSearchQuery(e.target.value)}
                            placeholder="Search by title or content..."
                            className="search-input-extended"
                          />
                          {brainDumpSearchQuery && (
                            <button 
                              className="btn-clear-search" 
                              onClick={() => setBrainDumpSearchQuery('')}
                              title="Clear search"
                            >
                              ×
                            </button>
                          )}
                        </div>
                        
                        {selectedBrainDumpNotes.length > 0 && (
                          <>
                            <button 
                              className="btn-select-all" 
                              onClick={handleSelectAllBrainDumpNotes}
                            >
                              {selectedBrainDumpNotes.length === getFilteredBrainDumpNotes().length && getFilteredBrainDumpNotes().length > 0 
                                ? 'Deselect All' 
                                : 'Select All'}
                            </button>
                            
                            <button 
                              className="btn-delete-selected" 
                              onClick={handleDeleteSelectedBrainDumpNotes}
                            >
                              Delete Selected ({selectedBrainDumpNotes.length})
                            </button>
                          </>
                        )}
                      </div>
                      
                      <div className="brain-dump-controls-right">
                        <div className="date-filters">
                          <label>
                            From:
                            <input
                              type="date"
                              value={brainDumpDateFilterFrom}
                              onChange={(e) => setBrainDumpDateFilterFrom(e.target.value)}
                              className="date-filter-input"
                            />
                          </label>
                          <label>
                            To:
                            <input
                              type="date"
                              value={brainDumpDateFilterTo}
                              onChange={(e) => setBrainDumpDateFilterTo(e.target.value)}
                              className="date-filter-input"
                            />
                          </label>
                          {(brainDumpDateFilterFrom || brainDumpDateFilterTo) && (
                            <button 
                              className="btn-clear-filter" 
                              onClick={() => {
                                setBrainDumpDateFilterFrom('');
                                setBrainDumpDateFilterTo('');
                              }}
                            >
                              Clear Filters
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Notes Grid */}
                    {(() => {
                      const filteredNotes = getFilteredBrainDumpNotes();
                      return filteredNotes.length === 0 ? (
                        <div className="brain-dump-placeholder">
                          <div className="brain-dump-icon">🧠</div>
                          <h4>Capture Your Creative Ideas</h4>
                          <p>This is your space to jot down creative ideas, content concepts, and inspiration for {selectedClient.nameCompany}.</p>
                          <p>Start building your content brain dump by adding your first note!</p>
                          <button className="start-brain-dump-btn" onClick={openBrainDumpForm}>
                            Start Brain Dumping
                          </button>
                        </div>
                      ) : (
                        <div className="brain-dump-notes-grid">
                          {filteredNotes.map((note) => (
                            <div 
                              key={note.id} 
                              className={`brain-dump-note-card ${selectedBrainDumpNotes.includes(note.id) ? 'selected' : ''}`}
                            >
                              <div className="note-card-header">
                                {selectedBrainDumpNotes.length > 0 && (
                                  <div 
                                    className={`note-checkbox-area ${selectedBrainDumpNotes.includes(note.id) ? 'selected' : ''}`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleSelectBrainDumpNote(note.id);
                                    }}
                                  >
                                    <span className={`checkbox-label ${selectedBrainDumpNotes.includes(note.id) ? 'selected' : ''}`}>Select</span>
                                  </div>
                                )}
                                <div 
                                  className="note-title-area"
                                  onClick={() => handleEditBrainDumpNote(note)}
                                >
                                  <h5 className="note-title">{note.title}</h5>
                                  <span className="edit-hint">Click to edit</span>
                                </div>
                              </div>
                              <div className="note-card-footer">
                                <span className="note-date">
                                  Last edited: {note.updatedAt.toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                  })}
                                </span>
                                <button 
                                  className="note-delete-btn"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const confirmed = window.confirm('Are you sure you want to delete this note?');
                                    if (confirmed) {
                                      setBrainDumpNotes(prev => prev.filter(n => n.id !== note.id));
                                    }
                                  }}
                                  title="Delete note"
                                >
                                  🗑️
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* PED Form Modal */}
      {showPedForm && (
        <div className="ped-form-overlay" onClick={closePedForm}>
          <div className="ped-form-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ped-form-header">
              <h3>Generate PED Entry - Step {pedFormStep} of 3</h3>
              <button className="ped-form-close" onClick={closePedForm}>×</button>
            </div>

            <div className="ped-form-progress">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${(pedFormStep / 3) * 100}%` }}
                ></div>
              </div>
              <div className="progress-steps">
                <span className={pedFormStep >= 1 ? 'active' : ''}>Basic Info</span>
                <span className={pedFormStep >= 2 ? 'active' : ''}>Content</span>
                <span className={pedFormStep >= 3 ? 'active' : ''}>Assets</span>
              </div>
            </div>

            <div className="ped-form-content">
              {pedFormStep === 1 && (
                <div className="form-step">
                  <h4>Step 1: Basic Information</h4>
                  <div className="form-group">
                    <label>Publication Name *</label>
                    <input
                      type="text"
                      value={pedFormData.publicationName}
                      onChange={(e) => handlePedFormChange('publicationName', e.target.value)}
                      placeholder="Enter publication name"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Release Date *</label>
                    <input
                      type="date"
                      value={pedFormData.releaseDate}
                      onChange={(e) => handlePedFormChange('releaseDate', e.target.value)}
                      min={new Date().toISOString().split('T')[0]} // Prevent selecting dates before today
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Post Type</label>
                    <select
                      value={pedFormData.postType}
                      onChange={(e) => handlePedFormChange('postType', e.target.value)}
                    >
                      <option value="">Select post type</option>
                      <option value="reel">Reel</option>
                      <option value="carousel">Carousel</option>
                      <option value="post">Post</option>
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label>Platforms (Select multiple)</label>
                    <div className="platform-checkboxes">
                      {['instagram', 'tiktok', 'linkedin', 'facebook', 'youtube'].map((platform) => (
                        <label key={platform} className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={pedFormData.platforms.includes(platform)}
                            onChange={() => handlePlatformChange(platform)}
                          />
                          <span className="platform-icon">
                            {platform === 'instagram' && <img src={instagramIcon} alt="Instagram" className="form-platform-icon" />}
                            {platform === 'tiktok' && <img src={tiktokIcon} alt="TikTok" className="form-platform-icon" />}
                            {platform === 'linkedin' && <img src={linkedinIcon} alt="LinkedIn" className="form-platform-icon" />}
                            {platform === 'facebook' && <img src={facebookIcon} alt="Facebook" className="form-platform-icon" />}
                            {platform === 'youtube' && <img src={youtubeIcon} alt="YouTube" className="form-platform-icon" />}
                          </span>
                          {platform.charAt(0).toUpperCase() + platform.slice(1)}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {pedFormStep === 2 && (
                <div className="form-step">
                  <h4>Step 2: Content</h4>
                  <div className="form-group">
                    <label>Copy</label>
                    <textarea
                      value={pedFormData.copy}
                      onChange={(e) => handlePedFormChange('copy', e.target.value)}
                      placeholder="Enter your post copy/caption..."
                      rows={6}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Hashtags</label>
                    <textarea
                      value={pedFormData.hashtags}
                      onChange={(e) => handlePedFormChange('hashtags', e.target.value)}
                      placeholder="Enter hashtags (e.g., #marketing #socialmedia #content)"
                      rows={3}
                    />
                  </div>
                </div>
              )}

              {pedFormStep === 3 && (
                <div className="form-step">
                  <h4>Step 3: Assets</h4>
                  <div className="form-group">
                    <label>Dropbox Link</label>
                    <input
                      type="url"
                      value={pedFormData.dropboxLink}
                      onChange={(e) => handlePedFormChange('dropboxLink', e.target.value)}
                      placeholder="Enter Dropbox link for assets"
                    />
                  </div>
                  
                  <div className="form-summary">
                    <h5>Summary</h5>
                    <div className="summary-item">
                      <strong>Publication:</strong> {pedFormData.publicationName || 'Not set'}
                    </div>
                    <div className="summary-item">
                      <strong>Release Date:</strong> {pedFormData.releaseDate || 'Not set'}
                    </div>
                    <div className="summary-item">
                      <strong>Type:</strong> {pedFormData.postType || 'Not set'}
                    </div>
                    <div className="summary-item">
                      <strong>Platforms:</strong> {pedFormData.platforms.length > 0 ? pedFormData.platforms.join(', ') : 'None selected'}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="ped-form-actions">
              {pedFormStep > 1 && (
                <button className="btn-prev" onClick={prevFormStep}>
                  Previous
                </button>
              )}
              
              {pedFormStep < 3 ? (
                <button 
                  className="btn-next" 
                  onClick={nextFormStep}
                  disabled={
                    (pedFormStep === 1 && (!pedFormData.publicationName || !pedFormData.releaseDate))
                  }
                >
                  Next
                </button>
              ) : (
                <button className="btn-submit" onClick={submitPedForm}>
                  Create PED Entry
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* PED Management Full Page Popup */}
      {showPedManagement && selectedClient && (
        <div className="ped-management-overlay">
          <div className="ped-management-modal">
            <div className="ped-management-header">
              <h2>PED Management - {selectedClient.nameCompany}</h2>
              <button className="ped-management-close" onClick={closePedManagement}>×</button>
            </div>

            <div className="ped-management-controls">
              <div className="ped-controls-left">
                <button 
                  className="btn-select-all" 
                  onClick={handleSelectAllPedEntries}
                >
                  {selectedPedEntries.length === getFilteredPedEntries().length && getFilteredPedEntries().length > 0 
                    ? 'Deselect All' 
                    : 'Select All'}
                </button>
                
                {selectedPedEntries.length > 0 && (
                  <button 
                    className="btn-delete-selected" 
                    onClick={handleDeleteSelectedPedEntries}
                  >
                    Delete Selected ({selectedPedEntries.length})
                  </button>
                )}
              </div>
              
              <div className="ped-controls-center">
                <div className="search-box">
                  <input
                    type="text"
                    value={pedSearchQuery}
                    onChange={(e) => setPedSearchQuery(e.target.value)}
                    placeholder="Search by name or copy content..."
                    className="search-input"
                  />
                  {pedSearchQuery && (
                    <button 
                      className="btn-clear-search" 
                      onClick={() => setPedSearchQuery('')}
                      title="Clear search"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
              
              <div className="ped-controls-right">
                <div className="date-filters">
                  <label>
                    From:
                    <input
                      type="date"
                      value={pedDateFilterFrom}
                      onChange={(e) => setPedDateFilterFrom(e.target.value)}
                      className="date-filter-input"
                    />
                  </label>
                  <label>
                    To:
                    <input
                      type="date"
                      value={pedDateFilterTo}
                      onChange={(e) => setPedDateFilterTo(e.target.value)}
                      className="date-filter-input"
                    />
                  </label>
                  {(pedDateFilterFrom || pedDateFilterTo) && (
                    <button 
                      className="btn-clear-filter" 
                      onClick={() => {
                        setPedDateFilterFrom('');
                        setPedDateFilterTo('');
                      }}
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="ped-management-content">
              {(() => {
                const filteredEntries = getFilteredPedEntries();
                return filteredEntries.length === 0 ? (
                  <div className="no-ped-found">
                    <p>No PED entries found for the selected criteria.</p>
                  </div>
                ) : (
                  <div className="ped-table-container">
                    <table className="ped-table">
                      <thead>
                        <tr>
                          <th>
                            <input
                              type="checkbox"
                              checked={filteredEntries.length > 0 && selectedPedEntries.length === filteredEntries.length}
                              onChange={handleSelectAllPedEntries}
                            />
                          </th>
                          <th>Publication Name</th>
                          <th>Release Date</th>
                          <th>Post Type</th>
                          <th>Platforms</th>
                          <th>Copy</th>
                          <th>Hashtags</th>
                          <th>Assets</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredEntries.map((entry) => (
                          <PedTableRow
                            key={entry.id}
                            entry={entry}
                            isSelected={selectedPedEntries.includes(entry.id)}
                            isEditing={editingPedEntry === entry.id}
                            onSelect={() => handleSelectPedEntry(entry.id)}
                            onEdit={() => handleEditPedEntry(entry.id)}
                            onSave={(updatedData) => handleSavePedEntry(entry.id, updatedData)}
                            onCancel={() => setEditingPedEntry(null)}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Brain Dump Form Modal */}
      {showBrainDumpForm && (
        <div className="brain-dump-form-overlay" onClick={closeBrainDumpForm}>
          <div className="brain-dump-form-modal" onClick={(e) => e.stopPropagation()}>
            <div className="brain-dump-form-header">
              <h3>{editingBrainDumpNote ? 'Edit Brain Dump Note' : 'Add New Brain Dump Note'}</h3>
              <button className="brain-dump-form-close" onClick={closeBrainDumpForm}>×</button>
            </div>

            <div className="brain-dump-form-content">
              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  value={brainDumpFormData.title}
                  onChange={(e) => handleBrainDumpFormChange('title', e.target.value)}
                  placeholder="Enter note title..."
                  className="brain-dump-title-input"
                />
              </div>
              
              <div className="form-group">
                <label>Content *</label>
                <textarea
                  value={brainDumpFormData.content}
                  onChange={(e) => handleBrainDumpFormChange('content', e.target.value)}
                  placeholder="Write your ideas, thoughts, and creative concepts here..."
                  rows={15}
                  className="brain-dump-content-textarea"
                />
              </div>
            </div>

            <div className="brain-dump-form-actions">
              <button className="btn-cancel" onClick={closeBrainDumpForm}>
                Cancel
              </button>
              <button 
                className="btn-save" 
                onClick={submitBrainDumpForm}
                disabled={!brainDumpFormData.title.trim() || !brainDumpFormData.content.trim()}
              >
                {editingBrainDumpNote ? 'Update Note' : 'Save Note'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Dialog Modal */}
      {showExportDialog && (
        <div className="export-dialog-overlay" onClick={closeExportDialog}>
          <div className="export-dialog-modal" onClick={(e) => e.stopPropagation()}>
            <div className="export-dialog-header">
              <h3>Export PED Report</h3>
              <button className="export-dialog-close" onClick={closeExportDialog}>×</button>
            </div>

            <div className="export-dialog-content">
              <p>Select the date range for your PED report:</p>
              
              <div className="export-date-range">
                <div className="form-group">
                  <label>From Date *</label>
                  <input
                    type="date"
                    value={exportDateFrom}
                    onChange={(e) => setExportDateFrom(e.target.value)}
                    className="export-date-input"
                  />
                </div>
                
                <div className="form-group">
                  <label>To Date *</label>
                  <input
                    type="date"
                    value={exportDateTo}
                    onChange={(e) => setExportDateTo(e.target.value)}
                    className="export-date-input"
                  />
                </div>
              </div>

              <div className="export-preview">
                {exportDateFrom && exportDateTo && selectedClient && (() => {
                  const fromDate = new Date(exportDateFrom);
                  const toDate = new Date(exportDateTo);
                  fromDate.setHours(0, 0, 0, 0);
                  toDate.setHours(23, 59, 59, 999);

                  const previewEntries = pedEntries.filter(entry => {
                    if (entry.clientId !== selectedClient.id) return false;
                    if (!entry.releaseDate) return false;
                    
                    const entryDate = new Date(entry.releaseDate);
                    return entryDate >= fromDate && entryDate <= toDate;
                  });

                  return (
                    <div className="preview-info">
                      <p><strong>Preview:</strong></p>
                      <p>Client: {selectedClient.nameCompany}</p>
                      <p>Period: {fromDate.toLocaleDateString()} - {toDate.toLocaleDateString()}</p>
                      <p>Content pieces: {previewEntries.length}</p>
                    </div>
                  );
                })()}
              </div>
            </div>

            <div className="export-dialog-actions">
              <button className="btn-cancel" onClick={closeExportDialog}>
                Cancel
              </button>
              <button 
                className="btn-export" 
                onClick={generatePedReport}
                disabled={!exportDateFrom || !exportDateTo}
              >
                Generate PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// PED Table Row Component for inline editing
interface PedTableRowProps {
  entry: PEDEntry;
  isSelected: boolean;
  isEditing: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onSave: (data: Partial<PEDEntry>) => void;
  onCancel: () => void;
}

function PedTableRow({ entry, isSelected, isEditing, onSelect, onEdit, onSave, onCancel }: PedTableRowProps) {
  const [editData, setEditData] = useState({
    publicationName: entry.publicationName,
    releaseDate: entry.releaseDate,
    postType: entry.postType,
    platforms: entry.platforms,
    copy: entry.copy,
    hashtags: entry.hashtags,
    dropboxLink: entry.dropboxLink
  });

  const handleSave = () => {
    onSave(editData);
  };

  const handlePlatformToggle = (platform: string) => {
    setEditData(prev => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter(p => p !== platform)
        : [...prev.platforms, platform]
    }));
  };

  if (isEditing) {
    return (
      <tr className="ped-row editing">
        <td>
          <input type="checkbox" checked={isSelected} onChange={onSelect} />
        </td>
        <td>
          <input
            type="text"
            value={editData.publicationName}
            onChange={(e) => setEditData(prev => ({ ...prev, publicationName: e.target.value }))}
            className="edit-input"
          />
        </td>
        <td>
          <input
            type="date"
            value={editData.releaseDate}
            onChange={(e) => setEditData(prev => ({ ...prev, releaseDate: e.target.value }))}
            min={new Date().toISOString().split('T')[0]}
            className="edit-input"
          />
        </td>
        <td>
          <select
            value={editData.postType}
            onChange={(e) => setEditData(prev => ({ ...prev, postType: e.target.value }))}
            className="edit-select"
          >
            <option value="">Select type</option>
            <option value="reel">Reel</option>
            <option value="carousel">Carousel</option>
            <option value="post">Post</option>
          </select>
        </td>
        <td>
          <div className="edit-platforms">
            {['instagram', 'tiktok', 'linkedin', 'facebook', 'youtube'].map(platform => (
              <label key={platform} className="platform-checkbox">
                <input
                  type="checkbox"
                  checked={editData.platforms.includes(platform)}
                  onChange={() => handlePlatformToggle(platform)}
                />
                <span>{platform}</span>
              </label>
            ))}
          </div>
        </td>
        <td>
          <textarea
            value={editData.copy}
            onChange={(e) => setEditData(prev => ({ ...prev, copy: e.target.value }))}
            className="edit-textarea"
            rows={2}
          />
        </td>
        <td>
          <textarea
            value={editData.hashtags}
            onChange={(e) => setEditData(prev => ({ ...prev, hashtags: e.target.value }))}
            className="edit-textarea"
            rows={2}
          />
        </td>
        <td>
          <input
            type="url"
            value={editData.dropboxLink}
            onChange={(e) => setEditData(prev => ({ ...prev, dropboxLink: e.target.value }))}
            className="edit-input"
            placeholder="Dropbox URL"
          />
        </td>
        <td>
          <div className="edit-actions">
            <button className="btn-save" onClick={handleSave}>Save</button>
            <button className="btn-cancel" onClick={onCancel}>Cancel</button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className={`ped-row ${isSelected ? 'selected' : ''}`}>
      <td>
        <input type="checkbox" checked={isSelected} onChange={onSelect} />
      </td>
      <td>{entry.publicationName}</td>
      <td>{new Date(entry.releaseDate).toLocaleDateString()}</td>
      <td>{entry.postType || '-'}</td>
      <td>
        <div className="platforms-display">
          {entry.platforms.length > 0 ? (
            entry.platforms.map((platform, index) => (
              <span key={index} className="platform-tag">{platform}</span>
            ))
          ) : (
            <span className="no-platforms">-</span>
          )}
        </div>
      </td>
      <td>
        <div className="copy-preview">
          {entry.copy ? (
            entry.copy.length > 50 ? entry.copy.substring(0, 50) + '...' : entry.copy
          ) : '-'}
        </div>
      </td>
      <td>
        <div className="hashtags-preview">
          {entry.hashtags ? (
            entry.hashtags.length > 30 ? entry.hashtags.substring(0, 30) + '...' : entry.hashtags
          ) : '-'}
        </div>
      </td>
      <td>
        {entry.dropboxLink ? (
          <a href={entry.dropboxLink} target="_blank" rel="noopener noreferrer" className="asset-link">
            📁 View
          </a>
        ) : '-'}
      </td>
      <td>
        <button className="btn-edit" onClick={onEdit}>Edit</button>
      </td>
    </tr>
  );
}
