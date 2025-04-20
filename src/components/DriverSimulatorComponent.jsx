import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import '../styles/driverSimulator.css';

const DriverSimulatorComponent = ({ booking }) => {
  const [driverLocation, setDriverLocation] = useState({
    lat: 16.5062,
    lng: 80.648,
  });
  const [eta, setEta] = useState('10 min');
  const [simulationRunning, setSimulationRunning] = useState(false);
  const [simulationInterval, setSimulationInterval] = useState(null);
  const { sendRideStatusUpdate } = useSocket();

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (simulationInterval) {
        clearInterval(simulationInterval);
      }
    };
  }, [simulationInterval]);

  // Start/stop location simulation
  const toggleSimulation = () => {
    if (simulationRunning) {
      if (simulationInterval) {
        clearInterval(simulationInterval);
        setSimulationInterval(null);
      }
      setSimulationRunning(false);
    } else {
      // Start simulation
      setSimulationRunning(true);
      
      // Simulate driver moving to destination
      const intervalId = setInterval(() => {
        // Generate random movement (simulating driver movement)
        const latChange = (Math.random() - 0.5) * 0.001;
        const lngChange = (Math.random() - 0.5) * 0.001;
        
        setDriverLocation(prev => ({
          lat: prev.lat + latChange,
          lng: prev.lng + lngChange
        }));
        
        // Update ETA
        const newEta = Math.max(1, parseInt(eta) - 1);
        setEta(`${newEta} min`);
        
        // Send location update via socket
        sendRideStatusUpdate({
          userId: localStorage.getItem('userId'),
          bookingId: booking.id,
          status: booking.status,
          message: `Driver location updated`,
          booking: {
            ...booking,
            driverLocation: {
              lat: driverLocation.lat + latChange,
              lng: driverLocation.lng + lngChange
            },
            estimatedArrival: `${newEta} min`
          }
        });
        
        // If ETA reaches 1 min, automatically change status to in-progress
        if (newEta === 1 && booking.status === 'confirmed') {
          sendRideStatusUpdate({
            userId: localStorage.getItem('userId'),
            bookingId: booking.id,
            status: 'in-progress',
            message: 'Your driver has arrived! Your ride is now in progress.',
            booking: {
              ...booking,
              status: 'in-progress',
              driverLocation: {
                lat: driverLocation.lat + latChange,
                lng: driverLocation.lng + lngChange
              },
              estimatedArrival: 'Driver arrived'
            }
          });
        }
      }, 5000); // Update every 5 seconds
      
      setSimulationInterval(intervalId);
    }
  };

  // Simulate the entire ride cycle
  const simulateFullRide = () => {
    // First confirm and assign driver (if not already confirmed)
    if (booking.status === 'pending') {
      sendRideStatusUpdate({
        userId: localStorage.getItem('userId'),
        bookingId: booking.id,
        status: 'confirmed',
        message: 'Your booking has been confirmed! A driver has been assigned.',
        booking: {
          ...booking,
          status: 'confirmed',
          driverName: 'Alex Johnson',
          driverPhone: '555-123-4567',
          driverRating: '4.8',
          carModel: 'Toyota Camry',
          carColor: 'Silver',
          licensePlate: 'ABC 1234',
          estimatedArrival: '10 min',
          driverLocation: {
            lat: 16.5062 + (Math.random() - 0.5) * 0.01,
            lng: 80.648 + (Math.random() - 0.5) * 0.01
          }
        }
      });
      
      // Set initial driver location
      setDriverLocation({
        lat: 16.5062 + (Math.random() - 0.5) * 0.01,
        lng: 80.648 + (Math.random() - 0.5) * 0.01
      });
    }
    
    // Schedule in-progress update in 10 seconds
    setTimeout(() => {
      sendRideStatusUpdate({
        userId: localStorage.getItem('userId'),
        bookingId: booking.id,
        status: 'in-progress',
        message: 'Your ride is now in progress. Enjoy your trip!',
        booking: {
          ...booking,
          status: 'in-progress',
          driverLocation: driverLocation,
          estimatedArrival: 'In progress'
        }
      });
      
      // Schedule completion update in 10 more seconds
      setTimeout(() => {
        sendRideStatusUpdate({
          userId: localStorage.getItem('userId'),
          bookingId: booking.id,
          status: 'completed',
          message: 'Your ride has been completed. Thank you for riding with us!',
          booking: {
            ...booking,
            status: 'completed',
            fare: '$24.50',
            distance: '3.2 miles',
            duration: '15 min',
            paymentMethod: 'Credit Card (****4567)'
          }
        });
      }, 10000);
    }, 10000);
  };

  return (
    <div className="driver-simulator">
      <h3 className="simulator-title">Driver Simulator (Testing Only)</h3>
      
      <div className="simulator-content">
        <div className="driver-location">
          <p className="location-label">Current Driver Location:</p>
          <p className="location-coords">
            Lat: {driverLocation.lat.toFixed(6)}, Lng: {driverLocation.lng.toFixed(6)}
          </p>
          <p className="location-eta">ETA: {eta}</p>
        </div>
        
        <div className="simulator-controls">
          <button 
            className={`sim-button ${simulationRunning ? 'stop' : 'start'}`}
            onClick={toggleSimulation}
          >
            {simulationRunning ? 'Stop Simulation' : 'Start Location Updates'}
          </button>
          
          <button 
            className="sim-button full-ride"
            onClick={simulateFullRide}
          >
            Simulate Full Ride Cycle
          </button>
        </div>
      </div>
      
      <p className="simulator-note">
        Note: This simulator is for testing the real-time tracking system only.
        In a production environment, these updates would come from the driver's app.
      </p>
    </div>
  );
};

export default DriverSimulatorComponent; 