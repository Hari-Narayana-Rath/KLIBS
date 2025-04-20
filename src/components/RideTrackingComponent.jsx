import React, { useState, useEffect } from 'react';
import { 
  CheckCircleIcon,
  ExclamationCircleIcon,
  TruckIcon,
  ClockIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';
import { useSocket } from '../context/SocketContext';
import '../styles/rideTracking.css';

// Possible ride statuses
const RIDE_STATUSES = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  IN_PROGRESS: 'in-progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

// Status steps in the tracking flow
const STATUS_STEPS = [
  { id: RIDE_STATUSES.PENDING, label: 'Booking Pending' },
  { id: RIDE_STATUSES.CONFIRMED, label: 'Driver Confirmed' },
  { id: RIDE_STATUSES.IN_PROGRESS, label: 'Ride in Progress' },
  { id: RIDE_STATUSES.COMPLETED, label: 'Ride Completed' }
];

const RideTrackingComponent = ({ booking }) => {
  const [currentStatus, setCurrentStatus] = useState(booking?.status || RIDE_STATUSES.PENDING);
  const [isLive, setIsLive] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const { socket, notifications } = useSocket();

  // Listen for updates on this specific ride
  useEffect(() => {
    if (!booking || !socket) return;

    const handleRideUpdate = (data) => {
      if (data.bookingId === booking.id) {
        setCurrentStatus(data.status);
        setLastUpdate(new Date());
        setIsLive(true);
        
        // Reset live indicator after 5 seconds
        setTimeout(() => {
          setIsLive(false);
        }, 5000);
      }
    };

    // Find if there are any recent notifications for this ride
    const recentNotification = notifications
      .filter(n => n.bookingId === booking.id)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
    
    if (recentNotification) {
      setLastUpdate(new Date(recentNotification.timestamp));
      if (new Date() - new Date(recentNotification.timestamp) < 5000) {
        setIsLive(true);
        setTimeout(() => {
          setIsLive(false);
        }, 5000);
      }
    }

    // Listen for ride updates
    socket.on('rideUpdate', handleRideUpdate);

    return () => {
      socket.off('rideUpdate', handleRideUpdate);
    };
  }, [booking, socket, notifications]);

  // If ride is cancelled, show only that
  if (currentStatus === RIDE_STATUSES.CANCELLED) {
    return (
      <div className="ride-tracking-cancelled">
        <div className="tracking-cancelled-icon">
          <ExclamationCircleIcon className="h-12 w-12 text-red-500" />
        </div>
        <h3 className="tracking-cancelled-message">This ride has been cancelled</h3>
        <p className="tracking-cancelled-detail">
          {lastUpdate && `Last updated: ${lastUpdate.toLocaleTimeString()}`}
        </p>
      </div>
    );
  }

  // Track the current status index
  const currentStatusIndex = STATUS_STEPS.findIndex(step => step.id === currentStatus);

  // Get icon based on status
  const getStatusIcon = (status) => {
    switch (status) {
      case RIDE_STATUSES.PENDING:
        return <ClockIcon className="status-icon" />;
      case RIDE_STATUSES.CONFIRMED:
        return <CheckCircleIcon className="status-icon" />;
      case RIDE_STATUSES.IN_PROGRESS:
        return <TruckIcon className="status-icon" />;
      case RIDE_STATUSES.COMPLETED:
        return <CheckCircleIcon className="status-icon" />;
      default:
        return <MapPinIcon className="status-icon" />;
    }
  };

  return (
    <div className="ride-tracking-container">
      <div className="ride-tracking-header">
        <h3>Ride Status</h3>
        {isLive && (
          <span className="live-update-indicator">
            <span className="live-dot"></span>
            Live Updates
          </span>
        )}
      </div>
      
      <div className="ride-tracking-timeline">
        {STATUS_STEPS.map((step, index) => {
          // Determine the status of this step
          let stepStatus = "incomplete";
          if (index < currentStatusIndex) {
            stepStatus = "completed";
          } else if (index === currentStatusIndex) {
            stepStatus = "current";
          }
          
          return (
            <div key={step.id} className={`status-step ${stepStatus}`}>
              <div className="status-connector">
                {index !== 0 && <div className={`connector-line ${index <= currentStatusIndex ? 'active' : ''}`}></div>}
              </div>
              <div className="status-icon-container">
                {getStatusIcon(step.id)}
              </div>
              <div className="status-label">{step.label}</div>
            </div>
          );
        })}
      </div>
      
      {lastUpdate && (
        <div className="last-update-info">
          Last updated: {lastUpdate.toLocaleTimeString()}
        </div>
      )}
      
      {booking && booking.driverName && currentStatus !== RIDE_STATUSES.PENDING && (
        <div className="driver-assignment-info">
          <div className="driver-header">
            <h4>Your Driver</h4>
          </div>
          <div className="driver-details">
            <div className="driver-name">{booking.driverName}</div>
            <div className="car-info">{booking.carColor} {booking.carModel} • {booking.licensePlate}</div>
            {booking.estimatedArrival && (
              <div className="estimated-arrival">
                <ClockIcon className="small-icon mr-1" />
                <span>ETA: {booking.estimatedArrival}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RideTrackingComponent; 