import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import bianco5Image from '../assets/bianco_5.png';
import HamburgerMenu from './HamburgerMenu';
import Clients from './Clients';
import ClientManagement from './ClientManagement';
import './Dashboard.css';

export default function Dashboard() {
  const { currentUser } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');

  const handleServiceClick = (service: string) => {
    if (service === 'service1') {
      setCurrentPage('clients');
    } else if (service === 'service2') {
      setCurrentPage('client-management');
    }
    // Add other services later
  };

  const handleNavigation = (page: string) => {
    setCurrentPage(page);
  };

  // Render different pages based on currentPage state
  if (currentPage === 'clients') {
    return <Clients onNavigate={handleNavigation} />;
  }

  if (currentPage === 'client-management') {
    return <ClientManagement onNavigate={handleNavigation} />;
  }

  return (
    <div className="dashboard-root">
      {/* Hamburger Menu */}
      <HamburgerMenu onNavigate={handleNavigation} />

      {/* Logo in top right */}
      <div className="dashboard-header">
        <img 
          src={bianco5Image} 
          alt="SIGMA HQ" 
          className="dashboard-logo"
        />
      </div>

      {/* Main content */}
      <div className="dashboard-content">
        <h1 className="dashboard-title">SIGMA HQ Dashboard</h1>
        
        <div className="dashboard-buttons-grid">
          <button 
            className="dashboard-btn"
            onClick={() => handleServiceClick('service1')}
          >
            Service 1
          </button>
          <button 
            className="dashboard-btn"
            onClick={() => handleServiceClick('service2')}
          >
            Client Management
          </button>
          <button 
            className="dashboard-btn"
            onClick={() => handleServiceClick('service3')}
          >
            Service 3
          </button>
          <button 
            className="dashboard-btn"
            onClick={() => handleServiceClick('service4')}
          >
            Service 4
          </button>
        </div>
      </div>

      {/* User info in bottom left */}
      <div className="dashboard-user-info">
        Welcome, {currentUser?.email}
      </div>
    </div>
  );
}
