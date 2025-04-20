import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/rideHistory.css';
import { 
  CalendarIcon, 
  ChevronLeftIcon, 
  ChevronRightIcon,
  MagnifyingGlassIcon,
  TruckIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const RideHistoryPage = () => {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [toast, setToast] = useState(null);
  const navigate = useNavigate();
  const ridesPerPage = 6;
  
  useEffect(() => {
    // Fetch rides from the MongoDB API
    const fetchRides = async () => {
      try {
        setLoading(true);
        
        // Get auth token from localStorage
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Authentication token not found. Please log in again.');
        }
        
        console.log('Fetching rides with token:', token.substring(0, 10) + '...');
        
        // Use the my-bookings endpoint to get current user's bookings
        const response = await fetch('/api/bookings/my-bookings', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        console.log('Response status:', response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Error response:', errorText);
          throw new Error(`Failed to fetch rides: ${response.status} ${errorText}`);
        }
        
        const data = await response.json();
        console.log('Fetched rides:', data);
        setRides(data || []);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching rides:', error);
        setLoading(false);
        showToast('error', `Failed to load ride history: ${error.message}`);
      }
    };
    
    fetchRides();
  }, []);
  
  // Filter rides based on status and search query
  const filteredRides = rides.filter(ride => {
    const matchesFilter = filter === 'all' || ride.status.toLowerCase() === filter;
    const matchesSearch = searchQuery === '' || 
      ride.pickup.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ride.destination.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ride.id && ride.id.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesFilter && matchesSearch;
  });
  
  // Pagination
  const indexOfLastRide = currentPage * ridesPerPage;
  const indexOfFirstRide = indexOfLastRide - ridesPerPage;
  const currentRides = filteredRides.slice(indexOfFirstRide, indexOfLastRide);
  const totalPages = Math.ceil(filteredRides.length / ridesPerPage);
  
  const paginate = (pageNumber) => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };
  
  // Show toast notification
  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };
  
  // Format date to display in a readable format
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    if (isNaN(date)) return dateString;
    
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };
  
  // Format time to display in a readable format
  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    
    // Handle both time string and date-time string
    if (timeString.includes('T')) {
      const date = new Date(timeString);
      if (isNaN(date)) return timeString;
      
      return new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
      }).format(date);
    }
    
    // Simple time string format
    return timeString;
  };
  
  // Generate ride ID if not available
  const getRideId = (ride) => {
    return ride.id || `RIDE${Math.floor(1000 + Math.random() * 9000)}`;
  };
  
  // Determine the color for the ride status badge
  const getRideStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'completed';
      case 'cancelled': return 'cancelled';
      case 'in-progress': return 'in-progress';
      case 'confirmed': return 'confirmed';
      default: return 'pending';
    }
  };
  
  // Calculate a random fare if not available
  const getRideFare = (ride) => {
    if (ride.fare) {
      // If fare is a string that starts with $, return it as is
      if (typeof ride.fare === 'string' && ride.fare.startsWith('$')) {
        return ride.fare;
      }
      // If fare is a number, format it
      return `$${parseFloat(ride.fare).toFixed(2)}`;
    }
    
    if (ride.price) {
      if (typeof ride.price === 'string' && ride.price.startsWith('$')) {
        return ride.price;
      }
      return `$${parseFloat(ride.price).toFixed(2)}`;
    }
    
    // Generate a random fare based on ride type
    const basePrice = ride.rideType === 'luxury' ? 50 : 
                     ride.rideType === 'premium' ? 30 : 20;
    return `$${(basePrice + Math.floor(Math.random() * 20)).toFixed(2)}`;
  };
  
  return (
    <div className="container">
      <header className="page-header">
        <h1 className="header-title">Ride History</h1>
      </header>
      
      <div className="history-controls">
        <div className="filter-tabs">
          <button 
            className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button 
            className={`filter-tab ${filter === 'completed' ? 'active' : ''}`}
            onClick={() => setFilter('completed')}
          >
            Completed
          </button>
          <button 
            className={`filter-tab ${filter === 'pending' ? 'active' : ''}`}
            onClick={() => setFilter('pending')}
          >
            Pending
          </button>
          <button 
            className={`filter-tab ${filter === 'cancelled' ? 'active' : ''}`}
            onClick={() => setFilter('cancelled')}
          >
            Cancelled
          </button>
        </div>
        
        <div className="search-box">
          <MagnifyingGlassIcon className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search by location or ride ID"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p className="loading-text">Loading your rides...</p>
        </div>
      ) : filteredRides.length === 0 ? (
        <div className="no-rides">
          <ExclamationTriangleIcon className="no-rides-icon" />
          <h3 className="no-rides-message">No rides found</h3>
          <p className="no-rides-subtext">
            {searchQuery 
              ? "No rides match your search criteria. Try a different search."
              : filter !== 'all' 
                ? `You don't have any ${filter} rides yet.`
                : "You haven't taken any rides yet. Book a ride to get started!"}
          </p>
          <Link to="/home" className="book-ride-btn">Book a Ride</Link>
        </div>
      ) : (
        <>
          <div className="rides-list">
            {currentRides.map((ride) => (
              <div 
                key={ride.id || ride._id} 
                className="ride-card"
                onClick={() => navigate(`/ride/${ride.id || ride._id}`)}
              >
                <div className="ride-card-header">
                  <div>
                    <div className="ride-date">{formatDate(ride.date)}</div>
                    <div className="ride-id">{getRideId(ride)}</div>
                  </div>
                  <div className={`ride-status-badge ${getRideStatusClass(ride.status)}`}>
                    {ride.status || 'Pending'}
                  </div>
                </div>
                
                <div className="ride-card-body">
                  <div className="ride-route">
                    <div className="route-markers">
                      <div className="route-dot pickup"></div>
                      <div className="route-line"></div>
                      <div className="route-dot destination"></div>
                    </div>
                    
                    <div className="route-addresses">
                      <div className="address pickup">
                        <div className="address-label">Pickup</div>
                        <p className="address-text">{ride.pickup}</p>
                      </div>
                      
                      <div className="address">
                        <div className="address-label">Destination</div>
                        <p className="address-text">{ride.destination}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="ride-card-footer">
                  <div className="ride-type">
                    <TruckIcon className="vehicle-icon" />
                    {ride.rideType || 'Standard'}
                  </div>
                  <div className="ride-fare">{getRideFare(ride)}</div>
                </div>
              </div>
            ))}
          </div>
          
          {totalPages > 1 && (
            <div className="pagination">
              <button 
                className={`pagination-btn ${currentPage === 1 ? 'disabled' : ''}`}
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeftIcon className="w-5 h-5" />
              </button>
              
              {[...Array(totalPages)].map((_, index) => (
                <button
                  key={index}
                  className={`pagination-btn ${currentPage === index + 1 ? 'active' : ''}`}
                  onClick={() => paginate(index + 1)}
                >
                  {index + 1}
                </button>
              ))}
              
              <button 
                className={`pagination-btn ${currentPage === totalPages ? 'disabled' : ''}`}
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                <ChevronRightIcon className="w-5 h-5" />
              </button>
            </div>
          )}
        </>
      )}
      
      {toast && (
        <div className={`toast ${toast.type}`}>
          {toast.message}
        </div>
      )}
      
      {/* Development tools section */}
      <div className="dev-tools">
        <h3 className="dev-tools-title">Development Tools</h3>
        <div className="dev-actions">
          <button 
            className="dev-button add"
            onClick={() => navigate('/home')}
          >
            Book New Ride
          </button>
          <button 
            className="dev-button update"
            onClick={() => {
              setLoading(true);
              fetch('/api/bookings')
                .then(res => res.json())
                .then(data => {
                  setRides(data);
                  setLoading(false);
                  showToast('info', 'Refreshed ride data');
                })
                .catch(err => {
                  console.error(err);
                  setLoading(false);
                  showToast('error', 'Failed to refresh data');
                });
            }}
          >
            Refresh Data
          </button>
          <button 
            className="dev-button delete"
            onClick={() => {
              setRides([]);
              showToast('success', 'Demo: All rides cleared');
            }}
          >
            Clear All Rides
          </button>
        </div>
        <p className="dev-hint">
          Note: These actions are for demonstration purposes only
        </p>
      </div>
    </div>
  );
};

export default RideHistoryPage; 