import { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query } from '../lib/mongodb';
import { db } from '../lib/mongodb';
import HamburgerMenu from './HamburgerMenu';
import bianco5Image from '../assets/bianco_5.png';
import './Clients.css';

interface Client {
  id: string;
  nameCompany: string;
  startDate: Date;
  isActive: boolean;
  clientType?: 'former' | 'prospective'; // Only if not active
  endDate?: Date; // Only if former client
  createdAt: Date;
}

interface ClientsProps {
  onNavigate?: (page: string) => void;
}

export default function Clients({ onNavigate }: ClientsProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'prospective' | 'former'>('active');
  
  const [formData, setFormData] = useState({
    nameCompany: '',
    startDate: '',
    isActive: true,
    clientType: '' as 'former' | 'prospective' | '',
    endDate: ''
  });

  // Load clients from Firestore
  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      const clientsRef = collection(db, 'clients');
      const q = query(clientsRef);
      const querySnapshot = await getDocs(q);
      const clientsData: Client[] = [];
      
      querySnapshot.docs.forEach((doc: any) => {
        const data = doc.data();
        clientsData.push({
          id: doc.id,
          nameCompany: data.nameCompany,
          startDate: data.startDate instanceof Date ? data.startDate : new Date(data.startDate),
          isActive: data.isActive,
          clientType: data.clientType,
          endDate: data.endDate ? (data.endDate instanceof Date ? data.endDate : new Date(data.endDate)) : undefined,
          createdAt: data.createdAt instanceof Date ? data.createdAt : new Date(data.createdAt)
        });
      });
      
      setClients(clientsData);
    } catch (error) {
      console.error('Error loading clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Validate required fields
      if (!formData.nameCompany || !formData.startDate) {
        alert('Please fill in all required fields.');
        return;
      }
      
      if (!formData.isActive && !formData.clientType) {
        alert('Please select client type for inactive clients.');
        return;
      }
      
      if (!formData.isActive && formData.clientType === 'former' && !formData.endDate) {
        alert('Please provide an end date for former clients.');
        return;
      }
      
      const clientData: any = {
        nameCompany: formData.nameCompany,
        startDate: new Date(formData.startDate),
        isActive: formData.isActive,
        createdAt: new Date()
      };
      
      // Only add optional fields if they have values
      if (!formData.isActive && formData.clientType) {
        clientData.clientType = formData.clientType;
      }
      
      if (formData.endDate) {
        clientData.endDate = new Date(formData.endDate);
      }
      
      console.log('Adding client:', clientData);
      await addDoc(collection(db, 'clients'), clientData);
      console.log('Client added successfully');
      
      // Reload clients from MongoDB
      await loadClients();
      
      // Reset form
      setFormData({
        nameCompany: '',
        startDate: '',
        isActive: true,
        clientType: '',
        endDate: ''
      });
      setShowForm(false);
    } catch (error) {
      console.error('Error adding client:', error);
      alert(`Error adding client: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox' && name === 'isActive') {
      setFormData({
        ...formData,
        isActive: checked,
        clientType: checked ? '' : formData.clientType,
        endDate: checked ? '' : formData.endDate
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleEditClient = (client: Client) => {
    setEditingClient(client);
    setFormData({
      nameCompany: client.nameCompany,
      startDate: client.startDate.toISOString().split('T')[0],
      isActive: client.isActive,
      clientType: client.clientType || '',
      endDate: client.endDate ? client.endDate.toISOString().split('T')[0] : ''
    });
    setShowForm(true);
  };

  const handleDeleteClient = async (clientId: string) => {
    if (window.confirm('Are you sure you want to delete this client?')) {
      try {
        await deleteDoc(doc(db, 'clients', clientId));
        await loadClients();
      } catch (error) {
        console.error('Error deleting client:', error);
        alert('Error deleting client. Please try again.');
      }
    }
  };

  const handleUpdateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingClient) return;
    
    try {
      // Validate required fields
      if (!formData.nameCompany || !formData.startDate) {
        alert('Please fill in all required fields.');
        return;
      }
      
      if (!formData.isActive && !formData.clientType) {
        alert('Please select client type for inactive clients.');
        return;
      }
      
      if (!formData.isActive && formData.clientType === 'former' && !formData.endDate) {
        alert('Please provide an end date for former clients.');
        return;
      }
      
      const clientData: any = {
        nameCompany: formData.nameCompany,
        startDate: new Date(formData.startDate),
        isActive: formData.isActive,
      };
      
      // Only add optional fields if they have values
      if (!formData.isActive && formData.clientType) {
        clientData.clientType = formData.clientType;
      }
      
      if (formData.endDate) {
        clientData.endDate = new Date(formData.endDate);
      }
      
      await updateDoc(doc(db, 'clients', editingClient.id), clientData);
      
      // Reload clients from MongoDB
      await loadClients();
      
      // Reset form
      setFormData({
        nameCompany: '',
        startDate: '',
        isActive: true,
        clientType: '',
        endDate: ''
      });
      setEditingClient(null);
      setShowForm(false);
    } catch (error) {
      console.error('Error updating client:', error);
      alert(`Error updating client: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Filter and sort clients
  const getFilteredAndSortedClients = () => {
    let filteredClients = clients.filter(client => {
      // Search filter
      const matchesSearch = client.nameCompany.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Status filter
      let matchesStatus = true;
      if (statusFilter === 'active') {
        matchesStatus = client.isActive;
      } else if (statusFilter === 'inactive') {
        matchesStatus = !client.isActive;
      } else if (statusFilter === 'prospective') {
        matchesStatus = !client.isActive && client.clientType === 'prospective';
      } else if (statusFilter === 'former') {
        matchesStatus = !client.isActive && client.clientType === 'former';
      }
      
      return matchesSearch && matchesStatus;
    });

    // Sort by start date
    filteredClients.sort((a, b) => {
      if (sortOrder === 'asc') {
        return a.startDate.getTime() - b.startDate.getTime();
      } else {
        return b.startDate.getTime() - a.startDate.getTime();
      }
    });

    return filteredClients;
  };

  return (
    <div className="clients-root">
      {/* Hamburger Menu */}
      <HamburgerMenu onNavigate={onNavigate} />

      {/* Logo in top right */}
      <div className="clients-header">
        <img 
          src={bianco5Image} 
          alt="SIGMA HQ" 
          className="clients-logo"
        />
      </div>

      {/* Main content */}
      <div className="clients-content">
        <h1 className="clients-title">Clients</h1>
        
        {/* Clients Container */}
        <div className="clients-container">
          {/* Add Client Button */}
          <button 
            className="add-client-btn"
            onClick={() => setShowForm(true)}
            title="Add new client"
          >
            +
          </button>

          {/* Filters Section */}
          <div className="filters-section">
            <div className="filter-controls">
              <div className="filter-group">
                <label htmlFor="sortOrder">Sort by Date:</label>
                <select
                  id="sortOrder"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                  className="filter-select"
                >
                  <option value="desc">Newest First</option>
                  <option value="asc">Oldest First</option>
                </select>
              </div>
              
              <div className="filter-group">
                <label htmlFor="statusFilter">Status:</label>
                <select
                  id="statusFilter"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive' | 'prospective' | 'former')}
                  className="filter-select"
                >
                  <option value="all">All Clients</option>
                  <option value="active">Active Only</option>
                  <option value="inactive">Inactive Only</option>
                  <option value="prospective">Prospective Only</option>
                  <option value="former">Former Only</option>
                </select>
              </div>
            </div>
            
            <div className="search-container">
              <input
                type="text"
                placeholder="Search clients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
          </div>

          {/* Clients List */}
          <div className="clients-list">
            {loading ? (
              <div className="loading">
                <p>Loading clients...</p>
              </div>
            ) : (() => {
              const filteredClients = getFilteredAndSortedClients();
              return filteredClients.length === 0 ? (
                <div className="no-clients">
                  <p>{clients.length === 0 ? "No clients found. Click the + button to add your first client." : "No clients match your current filters."}</p>
                </div>
              ) : (
                filteredClients.map((client) => (
                  <div key={client.id} className="client-card">
                    <div className="client-info">
                      <h3 className="client-name">{client.nameCompany}</h3>
                      <p className="client-status">
                        {client.isActive ? (
                          <span className="status-active">Active</span>
                        ) : (
                          <span className="status-inactive">
                            {client.clientType === 'former' ? 'Former Client' : 'Prospective Client'}
                          </span>
                        )}
                      </p>
                      <div className={`client-dates ${!client.endDate ? 'single-date' : ''}`}>
                        <span className="client-start-date">Start: {client.startDate.toLocaleDateString()}</span>
                        {client.endDate && (
                          <span className="client-end-date">End: {client.endDate.toLocaleDateString()}</span>
                        )}
                      </div>
                      <div className="client-actions">
                        <button 
                          className="btn-edit"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditClient(client);
                          }}
                          title="Edit client"
                        >
                          Edit
                        </button>
                        <button 
                          className="btn-delete"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClient(client.id);
                          }}
                          title="Delete client"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              );
            })()}
          </div>
        </div>
      </div>

      {/* Add Client Form Popup */}
      {showForm && (
        <div className="form-overlay" onClick={() => setShowForm(false)}>
          <div className="form-popup" onClick={(e) => e.stopPropagation()}>
            <div className="form-header">
              <h2>{editingClient ? 'Edit Client' : 'Add New Client'}</h2>
              <button 
                className="form-close"
                onClick={() => {
                  setShowForm(false);
                  setEditingClient(null);
                  setFormData({
                    nameCompany: '',
                    startDate: '',
                    isActive: true,
                    clientType: '',
                    endDate: ''
                  });
                }}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={editingClient ? handleUpdateClient : handleAddClient} className="client-form">
              <div className="form-group">
                <label htmlFor="nameCompany">Name / Company</label>
                <input
                  id="nameCompany"
                  name="nameCompany"
                  type="text"
                  required
                  value={formData.nameCompany}
                  onChange={handleInputChange}
                  placeholder="Enter client or company name"
                />
              </div>

              <div className="form-group">
                <label htmlFor="startDate">Start Date</label>
                <input
                  id="startDate"
                  name="startDate"
                  type="date"
                  required
                  value={formData.startDate}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input
                    name="isActive"
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({
                      ...formData,
                      isActive: e.target.checked,
                      clientType: e.target.checked ? '' : formData.clientType,
                      endDate: e.target.checked ? '' : formData.endDate
                    })}
                  />
                  Active
                </label>
              </div>

              {!formData.isActive && (
                <div className="form-group">
                  <label>Client Type</label>
                  <div className="radio-group">
                    <label className="radio-label">
                      <input
                        name="clientType"
                        type="radio"
                        value="prospective"
                        checked={formData.clientType === 'prospective'}
                        onChange={handleInputChange}
                      />
                      Prospective Client
                    </label>
                    <label className="radio-label">
                      <input
                        name="clientType"
                        type="radio"
                        value="former"
                        checked={formData.clientType === 'former'}
                        onChange={handleInputChange}
                      />
                      Former Client
                    </label>
                  </div>
                </div>
              )}

              {!formData.isActive && formData.clientType === 'former' && (
                <div className="form-group">
                  <label htmlFor="endDate">End Date</label>
                  <input
                    id="endDate"
                    name="endDate"
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={handleInputChange}
                  />
                </div>
              )}

              <div className="form-actions">
                <button 
                  type="button" 
                  className="btn-cancel"
                  onClick={() => {
                    setShowForm(false);
                    setEditingClient(null);
                    setFormData({
                      nameCompany: '',
                      startDate: '',
                      isActive: true,
                      clientType: '',
                      endDate: ''
                    });
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-submit">
                  {editingClient ? 'Update Client' : 'Add Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
