import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc, query } from '../lib/mongodb';
import { db } from '../lib/mongodb';
import HamburgerMenu from './HamburgerMenu';
import bianco5Image from '../assets/bianco_5.png';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './Registrations.css';

interface RegistrationsProps {
  onNavigate?: (page: string) => void;
}

interface RecordingDay {
  id: string;
  title: string;
  client: string;
  date: Date | null; // Can be null for "not scheduled"
  startTime: string;
  endTime: string;
  location: string;
  notes: string;
  status: 'complete' | 'scheduled' | 'not-scheduled' | 'incomplete';
  script?: boolean; // Whether script is prepared
  createdAt: Date;
  updatedAt: Date;
}

export default function Registrations({ onNavigate }: RegistrationsProps) {
  const [recordingDays, setRecordingDays] = useState<RecordingDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecordingDay, setSelectedRecordingDay] = useState<RecordingDay | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilterFrom, setDateFilterFrom] = useState('');
  const [dateFilterTo, setDateFilterTo] = useState('');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('list');
  const [showForm, setShowForm] = useState(false);
  const [formStep, setFormStep] = useState(1);
  const [editingRecordingDay, setEditingRecordingDay] = useState<RecordingDay | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    clientId: '',
    date: '',
    allDay: true,
    startTime: '',
    endTime: '',
    location: '',
    assignedUsers: [] as string[],
    videomakerEquipment: '',
    additionalNotes: '',
    script: false
  });
  
  // Firebase data for clients and users
  const [clients, setClients] = useState<Array<{id: string, nameCompany: string, isActive: boolean}>>([]);
  const [users, setUsers] = useState<Array<{id: string, email: string, displayName?: string}>>([]);

  // Load clients from MongoDB
  useEffect(() => {
    const loadClients = async () => {
      try {
        const clientsRef = collection(db, 'clients');
        const q = query(clientsRef);
        const querySnapshot = await getDocs(q);
        const clientsData: Array<{id: string, nameCompany: string, isActive: boolean}> = [];
        
        querySnapshot.docs.forEach((doc: any) => {
          const data = doc.data();
          // Only include active clients in the selection
          if (data.isActive) {
            clientsData.push({
              id: doc.id,
              nameCompany: data.nameCompany,
              isActive: data.isActive
            });
          }
        });
        
        setClients(clientsData);
      } catch (error) {
        console.error('Error loading clients:', error);
      }
    };

    loadClients();
  }, []);

  // Load authenticated users from MongoDB
  useEffect(() => {
    const loadUsers = async () => {
      try {
        // Fetch users from the 'users' collection in MongoDB
        // This collection should be populated when users register/login
        const usersRef = collection(db, 'users');
        const q = query(usersRef);
        const querySnapshot = await getDocs(q);
        const usersData: Array<{id: string, email: string, displayName?: string}> = [];
        
        querySnapshot.docs.forEach((doc: any) => {
          const data = doc.data();
          // Only add users that have proper email from Firebase Auth
          if (data.email) {
            usersData.push({
              id: doc.id,
              email: data.email,
              displayName: data.displayName || data.name || data.email.split('@')[0]
            });
          }
        });
        
        console.log('Loaded users from MongoDB:', usersData);
        setUsers(usersData);
        
        // If no users found in Firestore, show a message
        if (usersData.length === 0) {
          console.warn('No users found in Firestore. Make sure users are being saved to the "users" collection when they register.');
        }
      } catch (error) {
        console.error('Error loading users from Firebase:', error);
        alert('Could not load users from database. Please check your Firebase configuration.');
        // Set empty array instead of fallback mock data
        setUsers([]);
      }
    };

    loadUsers();
  }, []);

  // Load recording days from MongoDB
  useEffect(() => {
    const fetchRecordingDays = async () => {
      try {
        const recordingDaysRef = collection(db, 'recordingDays');
        const q = query(recordingDaysRef);
        const snapshot = await getDocs(q);
        const recordingDaysData = snapshot.docs.map((doc: any) => ({
          id: doc.id,
          ...doc.data(),
          date: doc.data().date ? (doc.data().date instanceof Date ? doc.data().date : new Date(doc.data().date)) : null,
          createdAt: doc.data().createdAt instanceof Date ? doc.data().createdAt : new Date(doc.data().createdAt || Date.now()),
          updatedAt: doc.data().updatedAt instanceof Date ? doc.data().updatedAt : new Date(doc.data().updatedAt || Date.now())
        })) as RecordingDay[];
        
        console.log('Loaded recording days from MongoDB:', recordingDaysData);
        setRecordingDays(recordingDaysData);
      } catch (error) {
        console.error('Error fetching recording days:', error);
        alert('Could not load recording days from database. Please check your Firebase configuration.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchRecordingDays();
  }, []);

  // Check for editing data from ClientManagement page
  useEffect(() => {
    const editRecordingDayId = sessionStorage.getItem('editRecordingDayId');
    const editRecordingDayData = sessionStorage.getItem('editRecordingDayData');
    
    if (editRecordingDayId && editRecordingDayData) {
      try {
        // Wait for recording days to load, then set up editing
        if (recordingDays.length > 0) {
          const recordingDay = recordingDays.find(rd => rd.id === editRecordingDayId);
          if (recordingDay) {
            handleEditRecordingDay(recordingDay, { stopPropagation: () => {} } as React.MouseEvent);
          }
          
          // Clear the session storage
          sessionStorage.removeItem('editRecordingDayId');
          sessionStorage.removeItem('editRecordingDayData');
        }
      } catch (error) {
        console.error('Error parsing edit recording day data:', error);
        sessionStorage.removeItem('editRecordingDayId');
        sessionStorage.removeItem('editRecordingDayData');
      }
    }
  }, [recordingDays]); // Trigger when recording days are loaded

  const getFilteredRecordingDays = () => {
    let filtered = recordingDays;

    // Filter by status
    if (filterStatus !== 'all') {
      if (filterStatus === 'scheduled') {
        // "Scheduled" filter should include both scheduled and complete (they both have dates)
        filtered = filtered.filter(day => day.status === 'scheduled' || day.status === 'complete');
      } else if (filterStatus === 'incomplete') {
        // "Incomplete" filter should show recordings with script: false or status incomplete
        filtered = filtered.filter(day => day.status === 'incomplete' || !day.script);
      } else if (filterStatus === 'complete') {
        // "Complete" filter should show recordings that have both a date and a script
        filtered = filtered.filter(day => day.date && day.script);
      } else {
        filtered = filtered.filter(day => day.status === filterStatus);
      }
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const searchLower = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(day => 
        day.client.toLowerCase().includes(searchLower) ||
        day.location.toLowerCase().includes(searchLower) ||
        day.notes.toLowerCase().includes(searchLower)
      );
    }

    // Filter by date range
    if (dateFilterFrom) {
      const fromDate = new Date(dateFilterFrom);
      filtered = filtered.filter(day => 
        day.date && day.date >= fromDate
      );
    }

    if (dateFilterTo) {
      const toDate = new Date(dateFilterTo);
      toDate.setHours(23, 59, 59, 999); // Include the entire day
      filtered = filtered.filter(day => 
        day.date && day.date <= toDate
      );
    }

    // Sort by priority: 
    // 1. Upcoming dates (scheduled and completed) - nearest first
    // 2. Not scheduled (no date)
    // 3. Past dates - most recent first
    return filtered.sort((a, b) => {
      const now = new Date();
      now.setHours(0, 0, 0, 0); // Start of today for comparison
      
      const aIsUpcoming = a.date && a.date >= now;
      const bIsUpcoming = b.date && b.date >= now;
      const aIsPast = a.date && a.date < now;
      const bIsPast = b.date && b.date < now;
      const aNoDate = !a.date;
      const bNoDate = !b.date;
      
      // 1. Upcoming dates first (scheduled and completed)
      if (aIsUpcoming && !bIsUpcoming) return -1;
      if (bIsUpcoming && !aIsUpcoming) return 1;
      if (aIsUpcoming && bIsUpcoming) {
        // Both upcoming - sort by date (nearest first)
        return a.date!.getTime() - b.date!.getTime();
      }
      
      // 2. Not scheduled (no date) comes next
      if (aNoDate && !bNoDate && !bIsUpcoming) return -1;
      if (bNoDate && !aNoDate && !aIsUpcoming) return 1;
      if (aNoDate && bNoDate) return 0;
      
      // 3. Past dates last (most recent first)
      if (aIsPast && bIsPast) {
        return b.date!.getTime() - a.date!.getTime(); // Most recent past date first
      }
      
      // Past dates go to the bottom
      if (aIsPast && !bIsPast) return 1;
      if (bIsPast && !aIsPast) return -1;
      
      return 0;
    });
  };

  const updateRecordingDayStatus = async (id: string, newStatus: RecordingDay['status']) => {
    try {
      // Update in MongoDB
      await updateDoc(doc(db, 'recordingDays', id), {
        status: newStatus,
        updatedAt: new Date()
      });
      
      // Update local state
      setRecordingDays(prev => prev.map(day => 
        day.id === id 
          ? { ...day, status: newStatus, updatedAt: new Date() }
          : day
      ));
    } catch (error) {
      console.error('Error updating recording day status:', error);
    }
  };

  const handleDeleteRecordingDay = async (recordingDay: RecordingDay, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening the modal
    
    if (window.confirm(`Are you sure you want to delete "${recordingDay.title}"? This action cannot be undone.`)) {
      try {
        // Delete from Firebase
        await deleteDoc(doc(db, 'recordingDays', recordingDay.id));
        
        // Remove from local state
        setRecordingDays(prev => prev.filter(day => day.id !== recordingDay.id));
        
        alert('Recording day deleted successfully!');
      } catch (error) {
        console.error('Error deleting recording day:', error);
        alert('Error deleting recording day. Please try again.');
      }
    }
  };

  const handleEditRecordingDay = (recordingDay: RecordingDay, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening the modal
    
    // Extract assigned users from notes
    const assignedUsersMatch = recordingDay.notes.match(/Assigned Users: ([^\n]+)/);
    let assignedUserIds: string[] = [];
    
    if (assignedUsersMatch && assignedUsersMatch[1] !== 'None assigned') {
      const assignedUserNames = assignedUsersMatch[1].split(', ');
      assignedUserIds = assignedUserNames.map(name => {
        // Find user by display name or email
        const user = users.find(u => 
          (u.displayName && u.displayName === name) || 
          u.email === name ||
          u.email.split('@')[0] === name
        );
        return user ? user.id : '';
      }).filter(id => id !== '');
    }
    
    // Populate form with existing data
    setFormData({
      clientId: clients.find(c => c.nameCompany === recordingDay.client)?.id || '',
      date: recordingDay.date ? recordingDay.date.toISOString().split('T')[0] : '',
      allDay: recordingDay.startTime === 'All Day',
      startTime: recordingDay.startTime === 'All Day' ? '' : recordingDay.startTime,
      endTime: recordingDay.endTime === 'All Day' ? '' : recordingDay.endTime,
      location: recordingDay.location,
      assignedUsers: assignedUserIds,
      videomakerEquipment: recordingDay.notes.match(/Equipment: ([^\n]+)/)?.[1] || '',
      additionalNotes: recordingDay.notes.match(/Additional Notes: ([^\n]+)/)?.[1] || '',
      script: recordingDay.script || false
    });
    
    // Set editing state
    setEditingRecordingDay(recordingDay);
    setShowForm(true);
  };

  // Form handling functions
  const resetForm = () => {
    setFormData({
      clientId: '',
      date: '',
      allDay: true,
      startTime: '',
      endTime: '',
      location: '',
      assignedUsers: [],
      videomakerEquipment: '',
      additionalNotes: '',
      script: false
    });
    setFormStep(1);
    setEditingRecordingDay(null);
  };

  const handleFormSubmit = async () => {
    // Validate required fields
    if (!formData.clientId) {
      alert('Please select a client');
      return;
    }

    // Validate time logic only if not all day and date is provided
    if (formData.date && !formData.allDay && (!formData.startTime || !formData.endTime)) {
      alert('Please fill in start and end times or select all day');
      return;
    }

    if (formData.date && !formData.allDay && formData.startTime >= formData.endTime) {
      alert('End time must be after start time');
      return;
    }

    // Get client name
    const client = clients.find(c => c.id === formData.clientId);
    if (!client) {
      alert('Selected client not found');
      return;
    }

    try {
      // Prepare recording day data for MongoDB
      const recordingDayData: any = {
        title: client.nameCompany,
        clientId: formData.clientId,
        client: client.nameCompany,
        date: formData.date ? new Date(formData.date) : null,
        allDay: formData.allDay,
        startTime: formData.allDay ? 'All Day' : formData.startTime,
        endTime: formData.allDay ? 'All Day' : formData.endTime,
        location: formData.location || 'TBD',
        assignedUsers: formData.assignedUsers,
        videomakerEquipment: formData.videomakerEquipment || '',
        additionalNotes: formData.additionalNotes || '',
        script: formData.script,
        notes: `Equipment: ${formData.videomakerEquipment || 'Not specified'}\n\nAdditional Notes: ${formData.additionalNotes || 'None'}\n\nAssigned Users: ${formData.assignedUsers.length > 0 ? formData.assignedUsers.map(id => users.find(u => u.id === id)?.displayName || users.find(u => u.id === id)?.email).join(', ') : 'None assigned'}`,
        status: editingRecordingDay ? editingRecordingDay.status : (formData.date ? 'scheduled' : 'not-scheduled'),
        updatedAt: new Date()
      };

      if (editingRecordingDay) {
        // Determine the correct status for the updated recording day
        let newStatus: RecordingDay['status'];
        if (formData.date && formData.script) {
          newStatus = 'complete';
        } else if (formData.date) {
          newStatus = 'scheduled';
        } else {
          newStatus = 'not-scheduled';
        }
        
        // Update the recordingDayData with the correct status
        recordingDayData.status = newStatus;
        
        // Update existing recording day
        console.log('Updating recording day in Firebase:', recordingDayData);
        
        await updateDoc(doc(db, 'recordingDays', editingRecordingDay.id), recordingDayData);
        
        // Update local state
        const updatedRecordingDay: RecordingDay = {
          ...editingRecordingDay,
          title: client.nameCompany,
          client: client.nameCompany,
          date: formData.date ? new Date(formData.date) : null,
          startTime: formData.allDay ? 'All Day' : formData.startTime,
          endTime: formData.allDay ? 'All Day' : formData.endTime,
          location: formData.location || 'TBD',
          script: formData.script,
          status: newStatus,
          notes: `Equipment: ${formData.videomakerEquipment || 'Not specified'}\n\nAdditional Notes: ${formData.additionalNotes || 'None'}\n\nAssigned Users: ${formData.assignedUsers.length > 0 ? formData.assignedUsers.map(id => users.find(u => u.id === id)?.displayName || users.find(u => u.id === id)?.email).join(', ') : 'None assigned'}`,
          updatedAt: new Date()
        };

        setRecordingDays(prev => prev.map(day => 
          day.id === editingRecordingDay.id ? updatedRecordingDay : day
        ));
        
        alert('Recording day updated successfully!');
      } else {
        // Create new recording day
        recordingDayData.createdAt = new Date();
        
        console.log('Saving new recording day to MongoDB:', recordingDayData);

        const docRef = await addDoc(collection(db, 'recordingDays'), recordingDayData);
        
        // Create local recording day object for immediate UI update
        const newRecordingDay: RecordingDay = {
          id: docRef.id,
          title: client.nameCompany,
          client: client.nameCompany,
          date: formData.date ? new Date(formData.date) : null,
          startTime: formData.allDay ? 'All Day' : formData.startTime,
          endTime: formData.allDay ? 'All Day' : formData.endTime,
          location: formData.location || 'TBD',
          script: formData.script,
          notes: `Equipment: ${formData.videomakerEquipment || 'Not specified'}\n\nAdditional Notes: ${formData.additionalNotes || 'None'}\n\nAssigned Users: ${formData.assignedUsers.length > 0 ? formData.assignedUsers.map(id => users.find(u => u.id === id)?.displayName || users.find(u => u.id === id)?.email).join(', ') : 'None assigned'}`,
          status: formData.date ? 'scheduled' : 'not-scheduled',
          createdAt: new Date(),
          updatedAt: new Date()
        };

        // Add to local state for immediate UI update
        setRecordingDays(prev => [...prev, newRecordingDay]);
        
        alert('Recording day created and saved to database successfully!');
      }
      
      // Reset form and close modal
      resetForm();
      setShowForm(false);
    } catch (error) {
      console.error('Error saving recording day:', error);
      alert(`Error saving recording day: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleUserToggle = (userId: string) => {
    setFormData(prev => ({
      ...prev,
      assignedUsers: prev.assignedUsers.includes(userId)
        ? prev.assignedUsers.filter(id => id !== userId)
        : [...prev.assignedUsers, userId]
    }));
  };

  const getStatusColor = (status: RecordingDay['status']) => {
    switch (status) {
      case 'scheduled': return '#ff9800'; // Orange
      case 'complete': return '#4caf50'; // Green
      case 'incomplete': return '#f44336'; // Red
      case 'not-scheduled': return '#757575'; // Gray
      default: return '#757575';
    }
  };

  const getStatusCounts = () => {
    return {
      total: recordingDays.length,
      scheduled: recordingDays.filter(r => r.status === 'scheduled' || r.status === 'complete').length, // Count both scheduled and complete
      complete: recordingDays.filter(r => r.date && r.script).length, // Count as complete if has both date and script
      incomplete: recordingDays.filter(r => r.status === 'incomplete' || !r.script).length, // Include recordings without scripts or marked incomplete
      notScheduled: recordingDays.filter(r => r.status === 'not-scheduled').length
    };
  };

  // Get all statuses for a recording day including script status
  const getAllStatuses = (recordingDay: RecordingDay): Array<{status: string, color: string}> => {
    const statuses: Array<{status: string, color: string}> = [];
    
    // Auto-update status to complete if has date and script but not marked complete
    if (recordingDay.date && recordingDay.script && recordingDay.status !== 'complete') {
      // Update the status automatically
      updateRecordingDayStatus(recordingDay.id, 'complete');
      recordingDay.status = 'complete'; // Update locally for immediate display
    }
    
    // Add main status
    statuses.push({
      status: recordingDay.status.charAt(0).toUpperCase() + recordingDay.status.slice(1),
      color: getStatusColor(recordingDay.status)
    });
    
    // Check if recording day is marked as complete but doesn't meet requirements
    if (recordingDay.status === 'complete' && (!recordingDay.date || !recordingDay.script)) {
      statuses.push({
        status: 'Invalid Complete',
        color: '#ff5722' // Orange-red for invalid complete status
      });
    }
    
    // Check script status - if script is false or undefined, needs script
    const needsScript = !recordingDay.script;
    if (needsScript) {
      statuses.push({
        status: 'Script Needed',
        color: '#ff5722' // Orange-red for script needed
      });
    }
    
    return statuses;
  };

  // Calendar helper functions
  const getDaysInMonth = (date: Date): Date[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: Date[] = [];

    // Add previous month's trailing days
    const firstDayWeekday = firstDay.getDay();
    for (let i = firstDayWeekday - 1; i >= 0; i--) {
      days.push(new Date(year, month, -i));
    }

    // Add current month's days
    for (let day = 1; day <= lastDay.getDate(); day++) {
      days.push(new Date(year, month, day));
    }

    // Add next month's leading days
    const remainingDays = 42 - days.length; // 6 weeks × 7 days
    for (let day = 1; day <= remainingDays; day++) {
      days.push(new Date(year, month + 1, day));
    }

    return days;
  };

  const getRecordingDaysForDate = (date: Date): RecordingDay[] => {
    return recordingDays.filter(rd => 
      rd.date && rd.date.toDateString() === date.toDateString()
    );
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  return (
    <div className="registrations-root">
      {/* Hamburger Menu */}
      <HamburgerMenu onNavigate={onNavigate} />

      {/* Logo in top right */}
      <div className="registrations-header">
        <img 
          src={bianco5Image} 
          alt="SIGMA HQ" 
          className="registrations-logo"
        />
      </div>

      {/* Main content */}
      <div className="registrations-content">
        <h1 className="registrations-title">Recording Day Management</h1>
        
        {/* View Mode Toggle */}
        <div className="view-mode-toggle">
          <button 
            className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
          >
            📋 List View
          </button>
          <button 
            className={`toggle-btn ${viewMode === 'calendar' ? 'active' : ''}`}
            onClick={() => setViewMode('calendar')}
          >
            📅 Calendar View
          </button>
          <button 
            className="add-btn"
            onClick={() => setShowForm(true)}
          >
            ➕ Add Recording Day
          </button>
        </div>
        
        {/* Statistics Cards */}
        <div className="registrations-stats">
          {(() => {
            const counts = getStatusCounts();
            return (
              <>
                <div className="stat-card total">
                  <div className="stat-number">{counts.total}</div>
                  <div className="stat-label">Total Recording Days</div>
                </div>
                <div className="stat-card pending">
                  <div className="stat-number">{counts.scheduled}</div>
                  <div className="stat-label">Scheduled</div>
                </div>
                <div className="stat-card contacted">
                  <div className="stat-number">{counts.complete}</div>
                  <div className="stat-label">Complete</div>
                </div>
                <div className="stat-card converted">
                  <div className="stat-number">{counts.incomplete}</div>
                  <div className="stat-label">Incomplete</div>
                </div>
                <div className="stat-card rejected">
                  <div className="stat-number">{counts.notScheduled}</div>
                  <div className="stat-label">Not Scheduled</div>
                </div>
              </>
            );
          })()}
        </div>

        {/* Filters and Search */}
        <div className="registrations-controls">
          <div className="controls-left">
            <div className="search-box">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by title, client, location, or notes..."
                className="search-input"
              />
            </div>
          </div>
          
          <div className="controls-center">
            <div className="registrations-date-filters-container">
              <div className="registrations-date-filter-group">
                <label htmlFor="regDateFilterFrom" className="registrations-date-filter-label">From:</label>
                <input
                  type="date"
                  id="regDateFilterFrom"
                  name="regDateFilterFrom"
                  value={dateFilterFrom}
                  onChange={(e) => setDateFilterFrom(e.target.value)}
                  className="registrations-simple-date-input"
                  title="Filter from date"
                  style={{
                    padding: '8px 12px',
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '6px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: 'white',
                    fontSize: '14px',
                    fontFamily: 'Montserrat, sans-serif',
                    cursor: 'pointer',
                    outline: 'none',
                    minWidth: '140px'
                  }}
                />
              </div>
              <div className="registrations-date-filter-group">
                <label htmlFor="regDateFilterTo" className="registrations-date-filter-label">To:</label>
                <input
                  type="date"
                  id="regDateFilterTo"
                  name="regDateFilterTo"
                  value={dateFilterTo}
                  onChange={(e) => setDateFilterTo(e.target.value)}
                  className="registrations-simple-date-input"
                  title="Filter to date"
                  style={{
                    padding: '8px 12px',
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '6px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: 'white',
                    fontSize: '14px',
                    fontFamily: 'Montserrat, sans-serif',
                    cursor: 'pointer',
                    outline: 'none',
                    minWidth: '140px'
                  }}
                />
              </div>
            </div>
          </div>
          
          <div className="controls-right">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="status-filter"
            >
              <option value="all">All Status</option>
              <option value="scheduled">Scheduled</option>
              <option value="complete">Complete</option>
              <option value="incomplete">Incomplete</option>
              <option value="not-scheduled">Not Scheduled</option>
            </select>
          </div>
        </div>

        {/* Content Area - List or Calendar View */}
        {viewMode === 'list' ? (
          /* Recording Days Grid */
          <div className="registrations-grid">
            {loading ? (
              <div className="loading">
                <p>Loading recording days...</p>
              </div>
            ) : (() => {
              const filteredRecordingDays = getFilteredRecordingDays();
              return filteredRecordingDays.length === 0 ? (
                <div className="no-registrations">
                  <p>No recording days found matching your criteria.</p>
                </div>
              ) : (
                filteredRecordingDays.map((recordingDay) => (
                  <div 
                    key={recordingDay.id} 
                    className="registration-card"
                    onClick={() => setSelectedRecordingDay(recordingDay)}
                  >
                    <div className="registration-header">
                      <h3 className="registration-name">{recordingDay.client}</h3>
                      <div className="card-actions">
                        <button 
                          className="card-action-btn edit-btn"
                          onClick={(e) => handleEditRecordingDay(recordingDay, e)}
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button 
                          className="card-action-btn remove-btn"
                          onClick={(e) => handleDeleteRecordingDay(recordingDay, e)}
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                    
                    <div className="registration-info">
                      <p><strong>Date:</strong> {recordingDay.date ? recordingDay.date.toLocaleDateString() : 'Not scheduled'}</p>
                      <p><strong>Time:</strong> {
                        recordingDay.startTime === 'All Day' && recordingDay.endTime === 'All Day' 
                          ? 'All Day' 
                          : recordingDay.startTime && recordingDay.endTime 
                            ? `${recordingDay.startTime} - ${recordingDay.endTime}` 
                            : 'TBD'
                      }</p>
                      <p><strong>Location:</strong> {recordingDay.location}</p>
                    </div>
                    
                    <div className="registration-status-section">
                      {getAllStatuses(recordingDay).map((statusItem, index) => (
                        <div 
                          key={index}
                          className="registration-status"
                          style={{ backgroundColor: statusItem.color }}
                        >
                          {statusItem.status}
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              );
            })()}
          </div>
        ) : (
          /* Calendar View */
          <div className="calendar-container">
            <div className="calendar-header">
              <button className="nav-btn" onClick={() => navigateMonth('prev')}>‹</button>
              <h2 className="calendar-title">
                {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h2>
              <button className="nav-btn" onClick={() => navigateMonth('next')}>›</button>
            </div>
            
            <div className="calendar-grid">
              <div className="calendar-weekdays">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="weekday">{day}</div>
                ))}
              </div>
              
              <div className="calendar-days">
                {getDaysInMonth(currentDate).map((date, index) => {
                  const isCurrentMonth = date.getMonth() === currentDate.getMonth();
                  const isToday = date.toDateString() === new Date().toDateString();
                  const dayRecordings = getRecordingDaysForDate(date);
                  
                  return (
                    <div 
                      key={index} 
                      className={`calendar-day ${!isCurrentMonth ? 'other-month' : ''} ${isToday ? 'today' : ''}`}
                    >
                      <span className="day-number">{date.getDate()}</span>
                      {dayRecordings.length > 0 && (
                        <div className="day-recordings">
                          {dayRecordings.slice(0, 3).map((recording, idx) => (
                            <div 
                              key={idx}
                              className="recording-dot"
                              style={{ backgroundColor: getStatusColor(recording.status) }}
                              title={`${recording.title} - ${recording.client}`}
                              onClick={() => setSelectedRecordingDay(recording)}
                            />
                          ))}
                          {dayRecordings.length > 3 && (
                            <span className="more-recordings">+{dayRecordings.length - 3}</span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Recording Day Detail Modal */}
      {selectedRecordingDay && (
        <div className="registration-modal-overlay" onClick={() => setSelectedRecordingDay(null)}>
          <div className="registration-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Recording Day Details</h2>
              <button className="modal-close" onClick={() => setSelectedRecordingDay(null)}>×</button>
            </div>
            
            <div className="modal-content">
              <div className="modal-section">
                <h3>Session Information</h3>
                <p><strong>Client:</strong> {selectedRecordingDay.client}</p>
                <p><strong>Date:</strong> {selectedRecordingDay.date ? selectedRecordingDay.date.toLocaleDateString() : 'Not scheduled'}</p>
                <p><strong>Time:</strong> {
                  selectedRecordingDay.startTime === 'All Day' && selectedRecordingDay.endTime === 'All Day' 
                    ? 'All Day Event' 
                    : selectedRecordingDay.startTime && selectedRecordingDay.endTime 
                      ? `${selectedRecordingDay.startTime} - ${selectedRecordingDay.endTime}` 
                      : 'TBD'
                }</p>
                <p><strong>Location:</strong> {selectedRecordingDay.location}</p>
              </div>
              
              <div className="modal-section">
                <h3>Participants</h3>
                <p className="message-content">
                  {(() => {
                    // Extract assigned users from notes or get from assignedUsers field
                    const notesMatch = selectedRecordingDay.notes.match(/Assigned Users: ([^\n]+)/);
                    const participantsList = notesMatch ? notesMatch[1] : 'None assigned';
                    return participantsList;
                  })()}
                </p>
              </div>
              
              <div className="modal-section">
                <h3>Session Notes</h3>
                <p className="message-content">{selectedRecordingDay.notes}</p>
              </div>
              
              <div className="modal-section">
                <h3>Status Management</h3>
                <p><strong>Current Status:</strong> 
                  <span 
                    className="current-status"
                    style={{ backgroundColor: getStatusColor(selectedRecordingDay.status) }}
                  >
                    {selectedRecordingDay.status.charAt(0).toUpperCase() + selectedRecordingDay.status.slice(1)}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Recording Day Form Modal */}
      {showForm && (
        <div className="registration-modal-overlay" onClick={() => setShowForm(false)}>
          {/* Calendar Panel for Recording Days */}
          <div className="recording-calendar-panel" onClick={(e) => e.stopPropagation()}>
            <div className="recording-calendar-header">
              <h3>Recording Calendar</h3>
              <p>Existing recording days schedule</p>
            </div>
            <div className="recording-calendar-content">
              <div className="calendar-legend">
                <div className="legend-item">
                  <div className="legend-dot today"></div>
                  <span>Today</span>
                </div>
                <div className="legend-item">
                  <div className="legend-dot has-recording"></div>
                  <span>Has recording</span>
                </div>
                <div className="legend-item">
                  <div className="legend-dot selected"></div>
                  <span>Selected</span>
                </div>
                <div className="legend-item">
                  <div className="legend-dot past"></div>
                  <span>Past date</span>
                </div>
              </div>
              
              {(() => {
                try {
                  // Helper functions for recording day detection
                  const hasRecordingOnDate = (date: Date) => {
                    try {
                      // Use local timezone formatting to match form data
                      const year = date.getFullYear();
                      const month = String(date.getMonth() + 1).padStart(2, '0');
                      const day = String(date.getDate()).padStart(2, '0');
                      const dateString = `${year}-${month}-${day}`;
                      return recordingDays.some(recording => {
                        if (!recording.date) return false;
                        const recordingYear = recording.date.getFullYear();
                        const recordingMonth = String(recording.date.getMonth() + 1).padStart(2, '0');
                        const recordingDay = String(recording.date.getDate()).padStart(2, '0');
                        const recordingDateString = `${recordingYear}-${recordingMonth}-${recordingDay}`;
                        return recordingDateString === dateString;
                      });
                    } catch (error) {
                      console.error('Error checking recording for date:', error);
                      return false;
                    }
                  };

                  const getRecordingsForDate = (date: Date) => {
                    try {
                      // Use local timezone formatting to match form data
                      const year = date.getFullYear();
                      const month = String(date.getMonth() + 1).padStart(2, '0');
                      const day = String(date.getDate()).padStart(2, '0');
                      const dateString = `${year}-${month}-${day}`;
                      return recordingDays.filter(recording => {
                        if (!recording.date) return false;
                        const recordingYear = recording.date.getFullYear();
                        const recordingMonth = String(recording.date.getMonth() + 1).padStart(2, '0');
                        const recordingDay = String(recording.date.getDate()).padStart(2, '0');
                        const recordingDateString = `${recordingYear}-${recordingMonth}-${recordingDay}`;
                        return recordingDateString === dateString;
                      });
                    } catch (error) {
                      console.error('Error getting recordings for date:', error);
                      return [];
                    }
                  };

                  // Custom tile content for overlay effect
                  const tileContent = ({ date, view }: any) => {
                    try {
                      if (view === 'month' && date instanceof Date) {
                        const recordings = getRecordingsForDate(date);
                        if (recordings.length > 0) {
                          return (
                            <div className="calendar-tile-content">
                              <div className="content-overlay">
                                <div className="content-dots">
                                  {recordings.slice(0, 3).map((recording) => (
                                    <div 
                                      key={recording.id} 
                                      className="content-dot" 
                                      title={recording.client}
                                    />
                                  ))}
                                  {recordings.length > 3 && (
                                    <div className="content-dot more" title={`+${recordings.length - 3} more`}>
                                      +{recordings.length - 3}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        }
                      }
                    } catch (error) {
                      console.error('Error in tileContent:', error);
                    }
                    return null;
                  };

                  // Custom tile class name for styling
                  const tileClassName = ({ date, view }: any) => {
                    try {
                      if (view === 'month' && date instanceof Date) {
                        const classes = [];
                        const today = new Date();
                        
                        // Create date string using local timezone to match form data format
                        const year = date.getFullYear();
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const day = String(date.getDate()).padStart(2, '0');
                        const dateString = `${year}-${month}-${day}`;
                        
                        // Create today string using same local timezone format
                        const todayYear = today.getFullYear();
                        const todayMonth = String(today.getMonth() + 1).padStart(2, '0');
                        const todayDay = String(today.getDate()).padStart(2, '0');
                        const todayString = `${todayYear}-${todayMonth}-${todayDay}`;
                        
                        // Check if date is in the past (using local timezone dates)
                        const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                        const localToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                        if (localDate < localToday && dateString !== todayString) {
                          classes.push('past-date');
                        }
                        
                        // Check if date has recordings
                        if (hasRecordingOnDate(date)) {
                          classes.push('has-recording');
                        }
                        
                        // Check if date is selected
                        if (formData.date === dateString) {
                          classes.push('selected-date');
                        }
                        
                        return classes.join(' ');
                      }
                    } catch (error) {
                      console.error('Error in tileClassName:', error);
                    }
                    return '';
                  };

                  // Date change handler for calendar
                  const handleDateChange = (value: any) => {
                    try {
                      if (value && value instanceof Date) {
                        // Create a new date in local timezone to avoid timezone issues
                        const selectedDate = new Date(value.getFullYear(), value.getMonth(), value.getDate());
                        
                        // Allow selecting past dates for recording days (unlike PED which only allows future)
                        const year = selectedDate.getFullYear();
                        const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
                        const day = String(selectedDate.getDate()).padStart(2, '0');
                        const dateString = `${year}-${month}-${day}`;
                        setFormData(prev => ({ ...prev, date: dateString }));
                      }
                    } catch (error) {
                      console.error('Error handling date change:', error);
                    }
                  };

                  return (
                    <div className="react-calendar-container">
                      <div className="calendar-wrapper">
                        <Calendar
                          onChange={handleDateChange}
                          value={formData.date ? (() => {
                            // Parse the date string properly to avoid timezone issues
                            const [year, month, day] = formData.date.split('-').map(Number);
                            return new Date(year, month - 1, day);
                          })() : null}
                          tileContent={tileContent}
                          tileClassName={tileClassName}
                          showNeighboringMonth={false}
                          locale="en-US"
                          calendarType="iso8601"
                        />
                      </div>
                      
                      {/* Display selected date info */}
                      {formData.date && (() => {
                        try {
                          const [year, month, day] = formData.date.split('-').map(Number);
                          const selectedDate = new Date(year, month - 1, day);
                          const recordings = getRecordingsForDate(selectedDate);
                          
                          return (
                            <div className="selected-date-info">
                              <div className="selected-date-header">
                                <h4>Selected: {selectedDate.toLocaleDateString('en-US', { 
                                  weekday: 'long', 
                                  year: 'numeric', 
                                  month: 'long', 
                                  day: 'numeric' 
                                })}</h4>
                                <button 
                                  className="clear-date-btn"
                                  onClick={() => setFormData(prev => ({ ...prev, date: '' }))}
                                  title="Clear selected date"
                                >
                                  ✕
                                </button>
                              </div>
                              {recordings.length > 0 && (
                                <div className="existing-content">
                                  <p><strong>Existing recordings on this date:</strong></p>
                                  <ul>
                                    {recordings.map(recording => (
                                      <li key={recording.id}>
                                        {recording.client} - {recording.location || 'Location TBD'}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          );
                        } catch (error) {
                          console.error('Error displaying selected date info:', error);
                          return null;
                        }
                      })()}
                    </div>
                  );
                } catch (error) {
                  console.error('Error rendering recording calendar:', error);
                  return (
                    <div className="calendar-error">
                      <p>Error loading calendar. Please refresh the page.</p>
                      <button onClick={() => window.location.reload()}>Refresh</button>
                    </div>
                  );
                }
              })()}
            </div>
          </div>
          
          <div className="registration-modal form-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add New Recording Day - Step {formStep} of 2</h2>
              <button className="modal-close" onClick={() => { resetForm(); setShowForm(false); }}>×</button>
            </div>
            
            <div className="modal-content">
              {formStep === 1 ? (
                // Step 1: Basic Information
                <div className="form-step">
                  <div className="form-group">
                    <label htmlFor="client">Client *</label>
                    <select
                      id="client"
                      value={formData.clientId}
                      onChange={(e) => setFormData(prev => ({ ...prev, clientId: e.target.value }))}
                      className="form-select"
                      required
                    >
                      <option value="">Select a client...</option>
                      {clients.map(client => (
                        <option key={client.id} value={client.id}>
                          {client.nameCompany}
                        </option>
                      ))}
                    </select>
                    {formData.clientId && (
                      <small style={{ color: 'rgba(91, 57, 131, 0.7)', marginTop: '5px', display: 'block' }}>
                        Selected: {clients.find(c => c.id === formData.clientId)?.nameCompany}
                      </small>
                    )}
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="date">Date</label>
                      <div className="date-input-display">
                        <input
                          type="text"
                          value={formData.date ? (() => {
                            try {
                              const [year, month, day] = formData.date.split('-').map(Number);
                              const date = new Date(year, month - 1, day);
                              return date.toLocaleDateString('en-US', { 
                                weekday: 'long', 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                              });
                            } catch (error) {
                              return formData.date;
                            }
                          })() : ''}
                          placeholder="Select a date from the calendar on the left"
                          readOnly
                          className="date-display-input"
                        />
                        <small className="date-helper-text">Click on a date in the calendar to select your recording date</small>
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="allDay">All Day Event</label>
                      <label className="checkbox-label" style={{ marginTop: '8px', display: 'flex', alignItems: 'center' }}>
                        <input
                          type="checkbox"
                          id="allDay"
                          checked={formData.allDay}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            allDay: e.target.checked,
                            startTime: e.target.checked ? '' : prev.startTime,
                            endTime: e.target.checked ? '' : prev.endTime
                          }))}
                          className="checkbox-input"
                        />
                        <span className="checkbox-custom"></span>
                        <span style={{ color: '#5b3983', fontWeight: '600' }}>All Day Event</span>
                      </label>
                    </div>
                  </div>

                  {!formData.allDay && (
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="startTime">Start Time *</label>
                        <input
                          type="time"
                          id="startTime"
                          value={formData.startTime}
                          onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                          className="form-input"
                          required={!formData.allDay}
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="endTime">End Time *</label>
                        <input
                          type="time"
                          id="endTime"
                          value={formData.endTime}
                          onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                          className="form-input"
                          required={!formData.allDay}
                        />
                      </div>
                    </div>
                  )}

                  <div className="form-group">
                    <label htmlFor="location">Location</label>
                    <input
                      type="text"
                      id="location"
                      value={formData.location}
                      onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="Enter recording location..."
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>Assigned Team Members {formData.assignedUsers.length > 0 && `(${formData.assignedUsers.length} selected)`}</label>
                    <div className="user-selection">
                      {users.length === 0 ? (
                        <p style={{ color: 'rgba(91, 57, 131, 0.7)', fontStyle: 'italic', margin: '10px 0', padding: '10px', backgroundColor: 'rgba(91, 57, 131, 0.1)', borderRadius: '5px' }}>
                          No authenticated users found in Firebase. Please make sure users are properly registered and saved to the 'users' collection in Firestore.
                        </p>
                      ) : (
                        users.map(user => (
                          <div key={user.id} className="user-checkbox">
                            <label className="checkbox-label">
                              <input
                                type="checkbox"
                                checked={formData.assignedUsers.includes(user.id)}
                                onChange={() => handleUserToggle(user.id)}
                                className="checkbox-input"
                              />
                              <span className="checkbox-custom"></span>
                              <span className="user-info">
                                <strong>{user.displayName || user.email}</strong>
                                <br />
                                <small>{user.email}</small>
                              </span>
                            </label>
                          </div>
                        ))
                      )}
                      {users.length > 0 && formData.assignedUsers.length === 0 && (
                        <p style={{ color: 'rgba(91, 57, 131, 0.6)', fontStyle: 'italic', margin: '10px 0' }}>
                          Select team members who will be involved in this recording session.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                // Step 2: Equipment and Notes
                <div className="form-step">
                  <div className="form-group">
                    <label htmlFor="equipment">Videomaker Equipment</label>
                    <textarea
                      id="equipment"
                      value={formData.videomakerEquipment}
                      onChange={(e) => setFormData(prev => ({ ...prev, videomakerEquipment: e.target.value }))}
                      placeholder="List cameras, lenses, lighting, audio equipment, etc..."
                      className="form-textarea"
                      rows={6}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="notes">Additional Notes</label>
                    <textarea
                      id="notes"
                      value={formData.additionalNotes}
                      onChange={(e) => setFormData(prev => ({ ...prev, additionalNotes: e.target.value }))}
                      placeholder="Any additional information, special requirements, or notes..."
                      className="form-textarea"
                      rows={6}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="script">Script Required</label>
                    <label className="checkbox-label" style={{ marginTop: '8px', display: 'flex', alignItems: 'center' }}>
                      <input
                        type="checkbox"
                        id="script"
                        checked={formData.script}
                        onChange={(e) => setFormData(prev => ({ ...prev, script: e.target.checked }))}
                        className="checkbox-input"
                      />
                      <span className="checkbox-custom"></span>
                      <span style={{ color: '#5b3983', fontWeight: '600' }}>Script is prepared for this recording</span>
                    </label>
                    <small style={{ color: 'rgba(91, 57, 131, 0.7)', marginTop: '5px', display: 'block' }}>
                      If unchecked, this recording day will be marked as requiring script preparation
                    </small>
                  </div>
                </div>
              )}
            </div>
            
            <div className="modal-actions form-actions">
              {formStep === 1 ? (
                <>
                  <button 
                    className="form-btn secondary"
                    onClick={() => { resetForm(); setShowForm(false); }}
                  >
                    Cancel
                  </button>
                  <button 
                    className="form-btn primary"
                    onClick={() => setFormStep(2)}
                    disabled={!formData.clientId || (formData.date !== '' && !formData.allDay && (!formData.startTime || !formData.endTime))}
                  >
                    Next Step →
                  </button>
                </>
              ) : (
                <>
                  <button 
                    className="form-btn secondary"
                    onClick={() => setFormStep(1)}
                  >
                    ← Back
                  </button>
                  <button 
                    className="form-btn primary"
                    onClick={handleFormSubmit}
                  >
                    {editingRecordingDay ? 'Update Recording Day' : 'Create Recording Day'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
