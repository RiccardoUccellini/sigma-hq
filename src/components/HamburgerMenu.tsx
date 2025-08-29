import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './HamburgerMenu.css';

interface HamburgerMenuProps {
  onNavigate?: (page: string) => void;
}

export default function HamburgerMenu({ onNavigate }: HamburgerMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { logout } = useAuth();

  async function handleLogout() {
    try {
      await logout();
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  }

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleNavigation = (page: string) => {
    setIsOpen(false);
    if (onNavigate) {
      onNavigate(page);
    }
  };

  return (
    <div className="hamburger-menu">
      {/* Hamburger Button */}
      <button 
        className={`hamburger-btn ${isOpen ? 'open' : ''}`}
        onClick={toggleMenu}
        aria-label="Toggle menu"
      >
        <span className="hamburger-line"></span>
        <span className="hamburger-line"></span>
        <span className="hamburger-line"></span>
      </button>

      {/* Menu Overlay */}
      {isOpen && (
        <div className="menu-overlay" onClick={toggleMenu}>
          <div className="menu-content" onClick={(e) => e.stopPropagation()}>
            <div className="menu-header">
              <h3 className="menu-title">Menu</h3>
              <button className="menu-close" onClick={toggleMenu}>
                ×
              </button>
            </div>
            
            <div className="menu-items">
              <button className="menu-item" onClick={() => handleNavigation('dashboard')}>
                Dashboard
              </button>
              <button className="menu-item" onClick={() => handleNavigation('client-management')}>
                Client Management
              </button>
              <button className="menu-item" onClick={() => handleNavigation('clients')}>
                Clients
              </button>
              <button className="menu-item" onClick={() => handleNavigation('registrations')}>
                Recording Day
              </button>
              <button className="menu-item" onClick={() => handleNavigation('settings')}>
                Settings
              </button>
              <button className="menu-item" onClick={() => handleNavigation('profile')}>
                Profile
              </button>
              <hr className="menu-divider" />
              <button className="menu-item logout-item" onClick={handleLogout}>
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
