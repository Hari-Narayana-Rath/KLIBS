import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/notifications.css';
import { 
  BellIcon, 
  CheckCircleIcon, 
  ExclamationCircleIcon, 
  ClockIcon, 
  TruckIcon,
  XMarkIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import { useSocket } from '../context/SocketContext';

const NotificationComponent = () => {
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationPanelRef = useRef(null);
  const navigate = useNavigate();
  
  // Get notifications and functions from context
  const { 
    notifications, 
    markAsRead, 
    markAllAsRead, 
    removeNotification 
  } = useSocket();
  
  // Handle clicks outside the notification panel to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        notificationPanelRef.current && 
        !notificationPanelRef.current.contains(event.target) &&
        !event.target.classList.contains('notification-bell-icon')
      ) {
        setShowNotifications(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle navigation to ride details
  const handleViewRide = (notification, e) => {
    e.stopPropagation();
    markAsRead(notification.id);
    setShowNotifications(false);
    
    if (notification.bookingId) {
      navigate(`/ride/${notification.bookingId}`);
    }
  };
  
  // Format time relative to now (e.g. "5 min ago")
  const getRelativeTime = (timestamp) => {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffMs = now - notificationTime;
    
    // Convert to minutes, hours, days
    const diffMins = Math.round(diffMs / (1000 * 60));
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  };
  
  // Get icon based on notification type
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'confirmed':
        return <CheckCircleIcon className="notification-icon confirmed" />;
      case 'cancelled':
        return <ExclamationCircleIcon className="notification-icon cancelled" />;
      case 'in-progress':
        return <TruckIcon className="notification-icon in-progress" />;
      case 'completed':
        return <CheckCircleIcon className="notification-icon completed" />;
      default:
        return <ClockIcon className="notification-icon pending" />;
    }
  };
  
  // Unread notifications count
  const unreadCount = notifications.filter(n => !n.read).length;
  
  // Animation for new notifications
  useEffect(() => {
    if (unreadCount > 0) {
      const bellIcon = document.querySelector('.notification-bell');
      if (bellIcon) {
        bellIcon.classList.add('animate-bell');
        setTimeout(() => {
          bellIcon.classList.remove('animate-bell');
        }, 1000);
      }
    }
  }, [unreadCount]);
  
  return (
    <div className="notification-container">
      <div 
        className="notification-bell" 
        onClick={() => setShowNotifications(!showNotifications)}
      >
        <BellIcon className="notification-bell-icon" />
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount}</span>
        )}
      </div>
      
      {showNotifications && (
        <div className="notification-panel" ref={notificationPanelRef}>
          <div className="notification-header">
            <h3>Notifications</h3>
            {notifications.length > 0 && (
              <button 
                className="mark-all-read" 
                onClick={markAllAsRead}
              >
                Mark all as read
              </button>
            )}
          </div>
          
          <div className="notification-list">
            {notifications.length === 0 ? (
              <div className="no-notifications">
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.map(notification => (
                <div 
                  key={notification.id} 
                  className={`notification-item ${!notification.read ? 'unread' : ''}`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="notification-content">
                    {getNotificationIcon(notification.status)}
                    <div className="notification-details">
                      <p className="notification-message">{notification.message}</p>
                      <p className="notification-time">
                        {getRelativeTime(notification.timestamp)}
                      </p>
                    </div>
                  </div>
                  <div className="notification-actions">
                    {notification.bookingId && (
                      <button 
                        className="view-ride-btn"
                        onClick={(e) => handleViewRide(notification, e)}
                      >
                        <span>View</span>
                        <ArrowRightIcon className="view-icon" />
                      </button>
                    )}
                    <button 
                      className="delete-notification" 
                      onClick={(e) => {
                        e.stopPropagation();
                        removeNotification(notification.id);
                      }}
                    >
                      <XMarkIcon className="delete-icon" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationComponent; 