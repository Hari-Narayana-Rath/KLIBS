import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  HomeIcon,
  TicketIcon,
  CreditCardIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';
import '../styles/components.css';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigation = (path) => {
    console.log(`Navigating to: ${path}`);
    navigate(path);
  };

  // Function to determine if a nav item is active
  const isActive = (path) => {
    if (path === '/home' && location.pathname === '/home') {
      return true;
    }
    if (path === '/past-rides' && location.pathname === '/past-rides') {
      return true;
    }
    return false;
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h3 className="sidebar-title">Klibs Cab</h3>
      </div>

      <nav className="sidebar-nav">
        <button 
          className={`sidebar-nav-item ${isActive('/home') ? 'active' : ''}`}
          onClick={() => handleNavigation('/home')}
        >
          <HomeIcon className="sidebar-icon" />
          <span>Book a Ride</span>
        </button>

        <button 
          className={`sidebar-nav-item ${isActive('/past-rides') ? 'active' : ''}`}
          onClick={() => handleNavigation('/past-rides')}
        >
          <TicketIcon className="sidebar-icon" />
          <span>My Rides</span>
        </button>

        <button 
          className="sidebar-nav-item"
          onClick={() => alert('Payment History feature coming soon!')}
        >
          <CreditCardIcon className="sidebar-icon" />
          <span>Payment History</span>
        </button>

        <button 
          className="sidebar-nav-item"
          onClick={() => alert('Profile feature coming soon!')}
        >
          <UserCircleIcon className="sidebar-icon" />
          <span>Profile</span>
        </button>
      </nav>

      <div className="sidebar-footer">
        <p className="sidebar-version">Version 1.0.0</p>
      </div>
    </div>
  );
};

export default Sidebar;