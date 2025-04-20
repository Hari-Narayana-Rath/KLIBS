import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PhoneIcon, MapIcon, UserIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import '../styles/pilotDashboard.css';

const PilotDashboard = () => {
  const [requests, setRequests] = useState([]);
  const [activeRide, setActiveRide] = useState(null);
  const [pilotLocation, setPilotLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const navigate = useNavigate();

  // Fetch ride requests on component mount
  useEffect(() => {
    fetchRideRequests();
    
    // Simulate pilot's location (in a real app, this would use the browser's geolocation API)
    navigator.geolocation.getCurrentPosition(
      position => {
        setPilotLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      error => {
        console.error('Error getting location:', error);
        // Fallback to a default location if geolocation fails
        setPilotLocation({ lat: 16.5062, lng: 80.648 });
      }
    );
    
    // Set pilot's phone number from local storage or prompt to enter it
    const savedPhone = localStorage.getItem('pilotPhone');
    if (savedPhone) {
      setPhoneNumber(savedPhone);
    }
    
    // Poll for new requests every 30 seconds
    const interval = setInterval(fetchRideRequests, 30000);
    return () => clearInterval(interval);
  }, []);

  // Function to fetch ride requests from the API
  const fetchRideRequests = async () => {
    try {
      setLoading(true);
      // Fetch pending ride requests
      const response = await fetch('http://localhost:3000/bookings?status=pending');
      if (!response.ok) {
        throw new Error('Failed to fetch ride requests');
      }
      const data = await response.json();
      console.log('Fetched ride requests:', data);
      setRequests(data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching ride requests:', error);
      setError('Failed to load ride requests. Please try again.');
      setLoading(false);
    }
  };

  // Function to accept a ride request
  const acceptRide = async (request) => {
    try {
      if (!phoneNumber) {
        alert('Please enter your phone number first');
        return;
      }
      
      // Update the ride status to 'confirmed' in the database
      const response = await fetch(`http://localhost:3000/bookings/${request.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'confirmed',
          driverInfo: {
            name: localStorage.getItem('userName') || 'Pilot',
            phone: phoneNumber,
            vehicle: 'Toyota Camry',
            licensePlate: 'KL-01-AB-1234',
            rating: 4.8
          }
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to accept ride');
      }
      
      // Get the updated ride
      const updatedRide = await response.json();
      setActiveRide(updatedRide);
      
      // Remove from pending requests
      setRequests(requests.filter(r => r.id !== request.id));
      
      // Show success message
      alert(`Ride accepted! You can now contact the passenger at ${request.phone || 'Phone number not available'}`);
    } catch (error) {
      console.error('Error accepting ride:', error);
      alert('Failed to accept the ride. Please try again.');
    }
  };

  // Function to call the passenger
  const callPassenger = (phone) => {
    if (!phone) {
      alert('Passenger phone number not available');
      return;
    }
    
    // In a real app, we would integrate with a calling API
    // For demo purposes, we'll show how this would work
    alert(`Calling passenger at ${phone}...`);
    
    // Example of how you would integrate with a call API:
    // fetch('https://api.callservice.com/call', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     from: phoneNumber,
    //     to: phone,
    //     callbackUrl: 'https://your-app.com/api/call-status'
    //   })
    // })
  };

  // Function to navigate to active ride detail
  const viewActiveRide = () => {
    if (activeRide) {
      navigate(`/pilot/ride/${activeRide.id}`);
    }
  };

  // Function to save pilot's phone number
  const savePhoneNumber = () => {
    if (phoneNumber.length < 10) {
      alert('Please enter a valid phone number');
      return;
    }
    localStorage.setItem('pilotPhone', phoneNumber);
    alert('Phone number saved successfully');
  };

  // Function to update ride status
  const updateRideStatus = async (status) => {
    if (!activeRide) return;
    
    try {
      const response = await fetch(`http://localhost:3000/bookings/${activeRide.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update ride status to ${status}`);
      }
      
      const updatedRide = await response.json();
      setActiveRide(updatedRide);
      
      alert(`Ride status updated to ${status}`);
      
      if (status === 'completed') {
        setActiveRide(null);
      }
    } catch (error) {
      console.error('Error updating ride status:', error);
      alert('Failed to update ride status. Please try again.');
    }
  };

  return (
    <div className="pilot-dashboard">
      <header className="dashboard-header">
        <h1>KLIBS Pilot Dashboard</h1>
        <div className="pilot-profile">
          <div className="pilot-info">
            <p className="pilot-name">{localStorage.getItem('userEmail') || 'Pilot'}</p>
            <div className="phone-input">
              <input
                type="tel"
                placeholder="Enter your phone number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="pilot-phone-input"
              />
              <button onClick={savePhoneNumber} className="save-phone-btn">Save</button>
            </div>
          </div>
        </div>
      </header>

      <div className="dashboard-content">
        {/* Active Ride Section */}
        {activeRide && (
          <div className="active-ride-section">
            <h2>Active Ride</h2>
            <div className="active-ride-card">
              <div className="ride-details">
                <div className="ride-locations">
                  <div className="location pickup">
                    <div className="location-marker pickup"></div>
                    <p>{activeRide.pickup}</p>
                  </div>
                  <div className="location destination">
                    <div className="location-marker destination"></div>
                    <p>{activeRide.destination}</p>
                  </div>
                </div>
                <div className="passenger-info">
                  <h3>Passenger Details</h3>
                  <p><UserIcon className="icon" /> {activeRide.userName || 'Anonymous'}</p>
                  <p><PhoneIcon className="icon" /> {activeRide.phone || 'N/A'}</p>
                </div>
                <div className="ride-status">
                  <p>Status: <span className={`status-badge ${activeRide.status}`}>{activeRide.status}</span></p>
                </div>
              </div>
              <div className="ride-actions">
                {activeRide.phone && (
                  <button onClick={() => callPassenger(activeRide.phone)} className="action-btn call-btn">
                    <PhoneIcon className="btn-icon" /> Call Passenger
                  </button>
                )}
                <button onClick={viewActiveRide} className="action-btn map-btn">
                  <MapIcon className="btn-icon" /> View on Map
                </button>
                {activeRide.status === 'confirmed' && (
                  <button onClick={() => updateRideStatus('in-progress')} className="action-btn start-btn">
                    Start Ride
                  </button>
                )}
                {activeRide.status === 'in-progress' && (
                  <button onClick={() => updateRideStatus('completed')} className="action-btn complete-btn">
                    Complete Ride
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Ride Requests Section */}
        <div className="ride-requests-section">
          <h2>Ride Requests</h2>
          {loading ? (
            <div className="loading-container">
              <div className="spinner"></div>
              <p>Loading ride requests...</p>
            </div>
          ) : error ? (
            <div className="error-message">
              <p>{error}</p>
              <button onClick={fetchRideRequests} className="retry-btn">Retry</button>
            </div>
          ) : requests.length === 0 ? (
            <div className="no-requests-message">
              <p>No pending ride requests at the moment.</p>
              <p>New requests will appear here automatically.</p>
            </div>
          ) : (
            <div className="requests-list">
              {requests.map((request) => (
                <div key={request.id} className="request-card">
                  <div className="request-header">
                    <p className="request-time">{new Date(request.createdAt || new Date()).toLocaleString()}</p>
                    <p className="ride-type">{request.rideType || 'Standard'}</p>
                  </div>
                  <div className="request-body">
                    <div className="request-locations">
                      <div className="location pickup">
                        <div className="location-marker pickup"></div>
                        <p>{request.pickup}</p>
                      </div>
                      <div className="location destination">
                        <div className="location-marker destination"></div>
                        <p>{request.destination}</p>
                      </div>
                    </div>
                    <div className="request-details">
                      <p><UserIcon className="icon" /> {request.userName || 'Anonymous'}</p>
                      <p><PhoneIcon className="icon" /> {request.phone || 'N/A'}</p>
                      <p>Passengers: {request.passengers || 1}</p>
                    </div>
                  </div>
                  <div className="request-actions">
                    <button onClick={() => acceptRide(request)} className="action-btn accept-btn">
                      <CheckCircleIcon className="btn-icon" /> Accept
                    </button>
                    <button className="action-btn reject-btn">
                      <XCircleIcon className="btn-icon" /> Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Development Tools Section */}
      <div className="dev-tools">
        <h3>Development Tools</h3>
        <div className="dev-actions">
          <button 
            onClick={() => {
              const mockRequest = {
                id: `req-${Date.now()}`,
                pickup: "Gandhi Nagar, Vijayawada",
                destination: "Benz Circle, Vijayawada",
                createdAt: new Date().toISOString(),
                rideType: "Premium",
                passengers: 2,
                userName: "Test User",
                phone: "9876543210",
                userId: "user123"
              };
              setRequests([...requests, mockRequest]);
            }} 
            className="dev-btn add-request"
          >
            Add Mock Request
          </button>
          <button onClick={fetchRideRequests} className="dev-btn refresh">
            Refresh Requests
          </button>
          <button 
            onClick={() => {
              if (activeRide) {
                setActiveRide(null);
              } else if (requests.length > 0) {
                setActiveRide({
                  ...requests[0],
                  status: 'confirmed'
                });
                setRequests(requests.slice(1));
              } else {
                alert('No requests to simulate');
              }
            }} 
            className="dev-btn toggle-active"
          >
            Toggle Active Ride
          </button>
        </div>
        <p className="dev-note">Note: These actions are for demonstration purposes only.</p>
      </div>
    </div>
  );
};

export default PilotDashboard; 