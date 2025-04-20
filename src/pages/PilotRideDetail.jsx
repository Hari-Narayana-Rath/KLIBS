import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  PhoneIcon, 
  ChevronLeftIcon, 
  CheckIcon,
  ClockIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import '../styles/pilotRideDetail.css';

// Fix for leaflet icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom markers
const createCustomIcon = (color) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.3);"></div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
};

const pickupIcon = createCustomIcon('#3b82f6');
const destinationIcon = createCustomIcon('#ef4444');
const driverIcon = createCustomIcon('#10b981');

// Component to update map center
const SetViewOnChange = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);
  return null;
};

// Component to simulate driver movement
const DriverMarker = ({ initialPosition, destination, isRideStarted, onArrival }) => {
  const [position, setPosition] = useState(initialPosition);
  const movementRef = useRef(null);
  const hasArrived = useRef(false);

  useEffect(() => {
    if (isRideStarted && !hasArrived.current) {
      // Calculate step sizes for lat/lng to move towards destination
      const latStep = (destination[0] - initialPosition[0]) / 100;
      const lngStep = (destination[1] - initialPosition[1]) / 100;
      
      // Clear any existing interval
      if (movementRef.current) clearInterval(movementRef.current);
      
      // Set up movement simulation
      movementRef.current = setInterval(() => {
        setPosition(prev => {
          // Calculate distance to destination
          const distToDestination = Math.sqrt(
            Math.pow(destination[0] - prev[0], 2) + 
            Math.pow(destination[1] - prev[1], 2)
          );
          
          // If close enough to destination, stop movement
          if (distToDestination < 0.0005) {
            clearInterval(movementRef.current);
            hasArrived.current = true;
            if (onArrival) onArrival();
            return destination;
          }
          
          // Add some randomness to movement
          const randomFactor = 0.9 + Math.random() * 0.2;
          
          return [
            prev[0] + latStep * randomFactor,
            prev[1] + lngStep * randomFactor
          ];
        });
      }, 500);
      
      return () => {
        if (movementRef.current) clearInterval(movementRef.current);
      };
    }
  }, [initialPosition, destination, isRideStarted, onArrival]);

  return (
    <Marker 
      position={position} 
      icon={driverIcon}
    >
      <Popup>
        <div>
          <p>Your current location</p>
        </div>
      </Popup>
    </Marker>
  );
};

const PilotRideDetail = () => {
  const { rideId } = useParams();
  const navigate = useNavigate();
  const [ride, setRide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mapCenter, setMapCenter] = useState([16.5062, 80.648]);
  const [pickupCoords, setPickupCoords] = useState(null);
  const [destinationCoords, setDestinationCoords] = useState(null);
  const [driverPosition, setDriverPosition] = useState(null);
  const [isRideStarted, setIsRideStarted] = useState(false);
  const [arrivalMessage, setArrivalMessage] = useState('');
  const phoneCallTimerRef = useRef(null);

  useEffect(() => {
    fetchRideDetails();
    
    // Get current location
    navigator.geolocation.getCurrentPosition(
      position => {
        const currentPosition = [position.coords.latitude, position.coords.longitude];
        setDriverPosition(currentPosition);
        setMapCenter(currentPosition);
      },
      error => {
        console.error('Error getting location:', error);
        // Fallback coordinates in case geolocation fails
        setDriverPosition([16.5062, 80.648]);
        setMapCenter([16.5062, 80.648]);
      }
    );
    
    return () => {
      if (phoneCallTimerRef.current) clearTimeout(phoneCallTimerRef.current);
    };
  }, [rideId]);

  // Function to fetch ride details
  const fetchRideDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3000/bookings/${rideId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch ride details: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Fetched ride details:', data);
      setRide(data);
      
      // For demo purposes, generate mock coordinates if not available
      // In a real app, these would come from the database
      if (!data.pickupCoordinates) {
        // Simulate coordinates near the default center
        const mockPickupCoords = [
          16.5062 + (Math.random() * 0.01 - 0.005),
          80.648 + (Math.random() * 0.01 - 0.005)
        ];
        setPickupCoords(mockPickupCoords);
        setMapCenter(mockPickupCoords);
      } else {
        setPickupCoords(data.pickupCoordinates);
        setMapCenter(data.pickupCoordinates);
      }
      
      if (!data.destinationCoordinates) {
        // Simulate coordinates a bit further from pickup
        const mockDestCoords = [
          (pickupCoords ? pickupCoords[0] : 16.5062) + (Math.random() * 0.02 - 0.005),
          (pickupCoords ? pickupCoords[1] : 80.648) + (Math.random() * 0.02 - 0.005)
        ];
        setDestinationCoords(mockDestCoords);
      } else {
        setDestinationCoords(data.destinationCoordinates);
      }
      
      // Check if ride is already in progress
      setIsRideStarted(data.status === 'in-progress');
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching ride details:', error);
      setError(`Failed to load ride details: ${error.message}`);
      setLoading(false);
    }
  };

  // Function to update ride status
  const updateRideStatus = async (status) => {
    try {
      const response = await fetch(`http://localhost:3000/bookings/${rideId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          status,
          lastUpdated: new Date().toISOString()
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update ride status: ${response.status}`);
      }
      
      const updatedRide = await response.json();
      setRide(updatedRide);
      
      if (status === 'in-progress') {
        setIsRideStarted(true);
        setArrivalMessage('You have started the ride. Drive safely!');
      } else if (status === 'completed') {
        alert('Ride completed successfully!');
        setTimeout(() => navigate('/pilot'), 2000);
      }
    } catch (error) {
      console.error('Error updating ride status:', error);
      alert(`Failed to update ride status: ${error.message}`);
    }
  };

  // Function to simulate a phone call
  const initiatePhoneCall = () => {
    const passengerPhone = ride.phone || 'passenger';
    alert(`Initiating call to ${passengerPhone}...`);
    
    // In a real app, we would integrate with a calling API
    // For demo purposes, we'll simulate a call with a timer
    setArrivalMessage('Call in progress...');
    
    phoneCallTimerRef.current = setTimeout(() => {
      setArrivalMessage('Call ended. Safe driving!');
      setTimeout(() => setArrivalMessage(''), 3000);
    }, 3000);
  };

  // Function called when driver arrives at pickup location
  const handlePickupArrival = () => {
    setArrivalMessage('You have arrived at the pickup location!');
    
    // Auto-initiate call after arrival if not already in progress
    if (ride.status !== 'in-progress') {
      phoneCallTimerRef.current = setTimeout(() => {
        initiatePhoneCall();
      }, 1500);
    }
  };

  // Function called when driver reaches destination
  const handleDestinationArrival = () => {
    setArrivalMessage('You have reached the destination!');
    
    // Prompt to complete the ride
    phoneCallTimerRef.current = setTimeout(() => {
      if (window.confirm('You have reached the destination. Complete this ride?')) {
        updateRideStatus('completed');
      }
    }, 2000);
  };

  const goBack = () => {
    navigate('/pilot');
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading ride details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p>{error}</p>
        <button onClick={fetchRideDetails} className="retry-btn">Retry</button>
        <button onClick={goBack} className="back-btn">
          <ChevronLeftIcon className="icon" /> Back
        </button>
      </div>
    );
  }

  return (
    <div className="pilot-ride-detail">
      <header className="ride-detail-header">
        <button onClick={goBack} className="back-btn">
          <ChevronLeftIcon className="icon" /> Back
        </button>
        <h1>Ride #{rideId.substring(0, 8)}</h1>
        <div className={`status-badge ${ride?.status || 'pending'}`}>
          {ride?.status || 'Pending'}
        </div>
      </header>
      
      {arrivalMessage && (
        <div className="arrival-message">
          <CheckIcon className="icon" />
          <p>{arrivalMessage}</p>
        </div>
      )}
      
      <div className="ride-detail-content">
        <div className="map-container">
          {(pickupCoords && destinationCoords && driverPosition) ? (
            <MapContainer 
              center={mapCenter} 
              zoom={14} 
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              
              <SetViewOnChange center={mapCenter} />
              
              {pickupCoords && (
                <Marker position={pickupCoords} icon={pickupIcon}>
                  <Popup>
                    <div>
                      <strong>Pickup Location</strong>
                      <p>{ride?.pickup || 'Pickup point'}</p>
                    </div>
                  </Popup>
                </Marker>
              )}
              
              {destinationCoords && (
                <Marker position={destinationCoords} icon={destinationIcon}>
                  <Popup>
                    <div>
                      <strong>Destination</strong>
                      <p>{ride?.destination || 'Destination point'}</p>
                    </div>
                  </Popup>
                </Marker>
              )}
              
              <DriverMarker 
                initialPosition={driverPosition} 
                destination={isRideStarted ? destinationCoords : pickupCoords}
                isRideStarted={true}
                onArrival={isRideStarted ? handleDestinationArrival : handlePickupArrival}
              />
            </MapContainer>
          ) : (
            <div className="map-placeholder">
              <p>Loading map...</p>
            </div>
          )}
        </div>
        
        <div className="ride-info-container">
          <div className="ride-route-card">
            <h3>Ride Details</h3>
            <div className="route-info">
              <div className="location pickup">
                <div className="location-marker pickup"></div>
                <div className="location-details">
                  <span className="location-label">Pickup</span>
                  <p className="location-text">{ride?.pickup || 'Not specified'}</p>
                </div>
              </div>
              <div className="location destination">
                <div className="location-marker destination"></div>
                <div className="location-details">
                  <span className="location-label">Destination</span>
                  <p className="location-text">{ride?.destination || 'Not specified'}</p>
                </div>
              </div>
            </div>
            
            <div className="ride-meta">
              <div className="meta-item">
                <ClockIcon className="icon" />
                <span>{ride?.scheduledTime || ride?.time || 'Not specified'}</span>
              </div>
              <div className="meta-item">
                <UserGroupIcon className="icon" />
                <span>{ride?.passengers || 1} passenger(s)</span>
              </div>
            </div>
          </div>
          
          <div className="passenger-card">
            <h3>Passenger Information</h3>
            <div className="passenger-info">
              <div className="passenger-name">
                <span>{ride?.userName || 'Anonymous User'}</span>
              </div>
              {ride?.phone && (
                <div className="passenger-phone">
                  <button onClick={initiatePhoneCall} className="call-btn">
                    <PhoneIcon className="icon" /> Call Passenger
                  </button>
                </div>
              )}
            </div>
          </div>
          
          <div className="ride-actions">
            {ride?.status === 'confirmed' && (
              <button onClick={() => updateRideStatus('in-progress')} className="action-btn start-btn">
                Start Ride
              </button>
            )}
            
            {ride?.status === 'in-progress' && (
              <button onClick={() => updateRideStatus('completed')} className="action-btn complete-btn">
                Complete Ride
              </button>
            )}
            
            {ride?.status === 'completed' && (
              <div className="completion-message">
                <CheckIcon className="icon" />
                <p>This ride has been completed</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PilotRideDetail; 