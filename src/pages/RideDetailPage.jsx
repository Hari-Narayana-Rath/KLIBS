import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeftIcon, 
  CalendarIcon, 
  ClockIcon, 
  MapPinIcon, 
  UserIcon, 
  CurrencyDollarIcon,
  PhoneIcon,
  StarIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import '../styles/rideDetail.css';
import { useSocket } from '../context/SocketContext';
import RideTrackingComponent from '../components/RideTrackingComponent';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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

const RideDetailPage = () => {
  const { rideId } = useParams();
  const navigate = useNavigate();
  const [ride, setRide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { sendRideStatusUpdate } = useSocket();
  const [mapCenter, setMapCenter] = useState([16.5062, 80.648]);
  const [pickupCoords, setPickupCoords] = useState(null);
  const [destinationCoords, setDestinationCoords] = useState(null);
  const [driverPosition, setDriverPosition] = useState(null);
  const [driverUpdateInterval, setDriverUpdateInterval] = useState(null);

  useEffect(() => {
    const fetchRideData = async () => {
      try {
        setLoading(true);
        
        // Fetch ride data from MongoDB API
        const response = await fetch(`/api/bookings/${rideId}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch ride data: ${response.status}`);
        }
        
        const rideData = await response.json();
        console.log("Fetched ride data:", rideData);
        setRide(rideData);

        // Generate mock coordinates for pickup and destination if not available
        if (!rideData.pickupCoordinates) {
          const mockPickupCoords = [16.5062, 80.648];
          setPickupCoords(mockPickupCoords);
          setMapCenter(mockPickupCoords);
        } else {
          setPickupCoords(rideData.pickupCoordinates);
          setMapCenter(rideData.pickupCoordinates);
        }
        
        if (!rideData.destinationCoordinates) {
          const mockDestCoords = [16.5142, 80.6375];
          setDestinationCoords(mockDestCoords);
        } else {
          setDestinationCoords(rideData.destinationCoordinates);
        }

        // Simulate driver position for in-progress rides
        if (rideData.status === 'in-progress') {
          // Start with a position closer to pickup
          const initialDriverPos = pickupCoords ? 
            [pickupCoords[0] + (Math.random() * 0.005 - 0.0025), 
             pickupCoords[1] + (Math.random() * 0.005 - 0.0025)] :
            [16.5062, 80.648];
          
          setDriverPosition(initialDriverPos);
          
          // Set up interval to update driver position if ride is in progress
          const interval = setInterval(() => {
            simulateDriverMovement();
          }, 5000);
          
          setDriverUpdateInterval(interval);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching ride data:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchRideData();
    
    return () => {
      if (driverUpdateInterval) {
        clearInterval(driverUpdateInterval);
      }
    };
  }, [rideId]);

  // Simulate driver movement towards destination
  const simulateDriverMovement = () => {
    if (!pickupCoords || !destinationCoords || !driverPosition) return;
    
    setDriverPosition(prevPos => {
      // Move towards destination
      const targetPos = destinationCoords;
      const stepSize = 0.0005; // Small step for smooth movement
      
      // Calculate direction vector
      const dx = targetPos[0] - prevPos[0];
      const dy = targetPos[1] - prevPos[1];
      
      // Normalize and scale
      const distance = Math.sqrt(dx*dx + dy*dy);
      
      // If we're close enough to destination, stop movement
      if (distance < 0.001) return prevPos;
      
      const nx = dx / distance * stepSize;
      const ny = dy / distance * stepSize;
      
      // Add some randomness
      const randFactor = 0.3;
      const randX = (Math.random() * 2 - 1) * randFactor * stepSize;
      const randY = (Math.random() * 2 - 1) * randFactor * stepSize;
      
      return [prevPos[0] + nx + randX, prevPos[1] + ny + randY];
    });
  };

  // Listen for real-time updates to this ride
  useEffect(() => {
    if (!ride) return;
    
    // Set up socket listener for this specific ride
    const handleRideUpdate = (data) => {
      if (data.bookingId === ride.id) {
        // Update ride data with new information
        setRide(prev => ({
          ...prev,
          ...data.booking
        }));
      }
    };
    
    // We could add the socket event listener here, but we're already handling
    // this in the RideTrackingComponent, so we'll let that component manage socket updates
    
    return () => {
      // Clean up if needed
    };
  }, [ride]);

  const handleBackClick = () => {
    navigate('/past-rides');
  };

  const handleContactDriver = () => {
    if (!ride) return;
    
    // Get the driver phone number from driverInfo or fallback
    const driverPhone = ride.driverInfo?.phone || ride.driverPhone;
    
    if (driverPhone) {
      alert(`Calling driver at ${driverPhone}. In a real app, this would initiate a call via a calling API.`);
      
      // In a real app, we would use a calling API. Example:
      // fetch('https://api.callservice.com/call', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     from: userPhone,
      //     to: driverPhone,
      //     callbackUrl: 'https://your-app.com/api/call-status'
      //   })
      // })
    } else {
      alert('Driver phone number is not available');
    }
  };

  const handleCancelRide = async () => {
    if (ride && ride.status === 'pending') {
      try {
        // Update the ride status to cancelled in MongoDB
        const response = await fetch(`/api/bookings/${rideId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: 'cancelled' }),
        });

        if (!response.ok) {
          throw new Error(`Failed to cancel ride: ${response.status}`);
        }

        const updatedRide = await response.json();
        setRide(updatedRide);
        alert('Your ride has been canceled');
        
      } catch (err) {
        console.error('Error cancelling ride:', err);
        alert(`Failed to cancel ride: ${err.message}`);
      }
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="loading-message">
          <div className="spinner"></div>
          <p>Loading ride details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="error-message">
          <strong>Error: </strong>
          <span>{error}</span>
          <button 
            className="back-button mt-4"
            onClick={() => navigate('/past-rides')}
          >
            Go to Ride History
          </button>
        </div>
      </div>
    );
  }

  if (!ride) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="error-message">
          <strong>Error: </strong>
          <span>Ride not found. This ride may have been deleted or does not exist.</span>
          <button 
            className="back-button mt-4"
            onClick={() => navigate('/past-rides')}
          >
            Go to Ride History
          </button>
        </div>
      </div>
    );
  }

  const showMap = ride.status === 'confirmed' || ride.status === 'in-progress';
  const showDriverInfo = ride.status === 'confirmed' || ride.status === 'in-progress' || ride.status === 'completed';

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <div className="mb-6 flex items-center">
        <button 
          onClick={handleBackClick}
          className="back-button"
        >
          <ArrowLeftIcon className="small-icon" />
          <span>Back</span>
        </button>
        <h1 className="header-title ml-4">Ride Details</h1>
      </div>

      {/* Real-time Ride Tracking Component */}
      <RideTrackingComponent booking={ride} />

      {/* Map view for confirmed, in-progress, and completed rides */}
      {showMap && (
        <div className="map-container mb-6">
          {(pickupCoords && destinationCoords) ? (
            <MapContainer 
              center={mapCenter} 
              zoom={14} 
              style={{ height: '400px', width: '100%', borderRadius: '8px' }}
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              
              {pickupCoords && (
                <Marker position={pickupCoords} icon={pickupIcon}>
                  <Popup>
                    <div>
                      <strong>Pickup Location</strong>
                      <p>{ride.pickup}</p>
                    </div>
                  </Popup>
                </Marker>
              )}
              
              {destinationCoords && (
                <Marker position={destinationCoords} icon={destinationIcon}>
                  <Popup>
                    <div>
                      <strong>Destination</strong>
                      <p>{ride.destination}</p>
                    </div>
                  </Popup>
                </Marker>
              )}
              
              {ride.status === 'in-progress' && driverPosition && (
                <Marker position={driverPosition} icon={driverIcon}>
                  <Popup>
                    <div>
                      <strong>Driver Location</strong>
                      <p>{ride.driverInfo?.name || 'Your driver'} is on the way</p>
                    </div>
                  </Popup>
                </Marker>
              )}
            </MapContainer>
          ) : (
            <div className="map-placeholder">
              <p>Loading map...</p>
            </div>
          )}
        </div>
      )}

      <div className="ride-detail-card">
        <div className="ride-detail-header">
          <div className="ride-detail-status-section">
            <div className={`ride-status ${ride.status}`}>
              <span>{ride.status.charAt(0).toUpperCase() + ride.status.slice(1)}</span>
            </div>
            <div className="ride-datetime">
              <div className="flex items-center">
                <CalendarIcon className="small-icon mr-2 text-gray-600" />
                <span>{ride.date}</span>
              </div>
              <div className="flex items-center mt-1">
                <ClockIcon className="small-icon mr-2 text-gray-600" />
                <span>{ride.time}</span>
              </div>
            </div>
          </div>
          
          <div className="ride-fare-section">
            <span className="ride-fare-label">Total Fare</span>
            <span className="ride-fare-amount">${typeof ride.fare === 'number' ? ride.fare.toFixed(2) : ride.fare}</span>
          </div>
        </div>
        
        <div className="ride-route-section">
          <h3 className="section-title">Ride Route</h3>
          <div className="route-display">
            <div className="route-marker">
              <div className="marker-line"></div>
              <div className="marker-dot pickup"></div>
              <div className="marker-dot destination"></div>
            </div>
            <div className="route-locations">
              <div className="location pickup">
                <div className="location-label">PICKUP</div>
                <div className="location-address">{ride.pickup}</div>
              </div>
              <div className="location destination">
                <div className="location-label">DESTINATION</div>
                <div className="location-address">{ride.destination}</div>
              </div>
            </div>
          </div>
          
          <div className="ride-metrics">
            <div className="metric">
              <div className="metric-label">Ride Type</div>
              <div className="metric-value">{ride.rideType.charAt(0).toUpperCase() + ride.rideType.slice(1)}</div>
            </div>
            <div className="metric">
              <div className="metric-label">Passengers</div>
              <div className="metric-value">{ride.passengers}</div>
            </div>
            <div className="metric">
              <div className="metric-label">Distance</div>
              <div className="metric-value">{ride.distance || "3.5 km"}</div>
            </div>
            <div className="metric">
              <div className="metric-label">Duration</div>
              <div className="metric-value">{ride.duration || "15 min"}</div>
            </div>
          </div>
        </div>
        
        {/* Driver Section - Only shown for confirmed, in-progress, or completed rides */}
        {showDriverInfo && ride.driverInfo && (
          <div className="driver-section">
            <h3 className="section-title">Driver Information</h3>
            <div className="driver-details">
              <div className="driver-profile">
                <div className="driver-avatar">
                  <UserIcon className="w-8 h-8 text-gray-300" />
                </div>
                <div className="driver-info">
                  <div className="driver-name">{ride.driverInfo.name || "Driver"}</div>
                  <div className="driver-rating">
                    <div className="rating-display">
                      <StarIcon className="w-4 h-4 text-yellow-400 mr-1" />
                      <span className="rating-number">{ride.driverInfo.rating || "4.8"}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="car-details">
                <div className="car-model">{ride.driverInfo.vehicle || "Toyota Camry"}</div>
                <div className="car-license">{ride.driverInfo.licensePlate || "KA-01-AA-1234"}</div>
                {ride.driverInfo.phone && (
                  <button onClick={handleContactDriver} className="contact-driver-btn">
                    <PhoneIcon className="w-4 h-4 mr-2" />
                    Contact Driver
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Pending Ride Section - Only shown for pending rides */}
        {ride.status === 'pending' && (
          <div className="pending-ride-section">
            <h3 className="section-title">Upcoming Ride</h3>
            <div className="scheduled-time">
              <ClockIcon className="w-5 h-5 mr-2 text-blue-500" />
              Scheduled for {ride.scheduledTime || `${ride.date} at ${ride.time}`}
            </div>
            <p>Your ride is waiting to be assigned to a driver. You can cancel it if needed.</p>
            <button onClick={handleCancelRide} className="cancel-ride-btn mt-4">
              <XMarkIcon className="w-4 h-4 mr-2" />
              Cancel Ride
            </button>
          </div>
        )}
        
        {/* Payment Section */}
        <div className="payment-section">
          <h3 className="section-title">Payment Details</h3>
          <div className="payment-info">
            <div className="payment-method">
              <CurrencyDollarIcon className="w-5 h-5 mr-2 text-green-500" />
              Payment Method: Cash
            </div>
            <div className="fare-breakdown">
              <div className="fare-item">
                <span>Base Fare</span>
                <span>$10.00</span>
              </div>
              <div className="fare-item">
                <span>Distance ({ride.distance || "3.5 km"})</span>
                <span>$3.50</span>
              </div>
              <div className="fare-item">
                <span>Time ({ride.duration || "15 min"})</span>
                <span>$1.50</span>
              </div>
              {ride.passengers > 1 && (
                <div className="fare-item">
                  <span>Additional Passengers ({ride.passengers - 1})</span>
                  <span>${((ride.passengers - 1) * 1.5).toFixed(2)}</span>
                </div>
              )}
              <div className="fare-item total">
                <span>Total</span>
                <span>${typeof ride.fare === 'number' ? ride.fare.toFixed(2) : ride.fare}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Development Tools Section */}
      <div className="dev-tools mt-8 p-4 border border-gray-300 rounded-lg bg-gray-50">
        <h3 className="text-lg font-semibold mb-4">Development Tools</h3>
        <div className="simulator-controls">
          <button
            className="sim-button start"
            onClick={() => {
              // Simulate ride confirmation
              fetch(`/api/bookings/${rideId}`, {
                method: 'PATCH',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  status: 'confirmed',
                  driverInfo: {
                    name: 'John Driver',
                    rating: 4.8,
                    vehicle: 'Toyota Camry',
                    licensePlate: 'KA-01-AA-1234',
                    phone: '9876543210'
                  }
                }),
              }).then(r => r.json()).then(data => {
                setRide(data);
                alert('Ride confirmed with driver');
              });
            }}
          >
            Simulate Driver Assigned
          </button>
          <button
            className="sim-button in-progress"
            onClick={() => {
              // Simulate ride start
              fetch(`http://localhost:3000/bookings/${rideId}`, {
                method: 'PATCH',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  status: 'in-progress'
                }),
              }).then(r => r.json()).then(data => {
                setRide(data);
                alert('Ride started');
              });
            }}
          >
            Simulate Ride Start
          </button>
          <button
            className="sim-button completed"
            onClick={() => {
              // Simulate ride completion
              fetch(`http://localhost:3000/bookings/${rideId}`, {
                method: 'PATCH',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  status: 'completed'
                }),
              }).then(r => r.json()).then(data => {
                setRide(data);
                alert('Ride completed');
              });
            }}
          >
            Simulate Ride Complete
          </button>
        </div>
        <p className="simulator-note">Note: These actions are for demonstration purposes only.</p>
      </div>
    </div>
  );
};

export default RideDetailPage; 