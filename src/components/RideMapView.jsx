import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { TruckIcon, MapPinIcon } from '@heroicons/react/24/outline';
import '../styles/rideMap.css';

// Fix for leaflet marker icons
// (This is needed because of how webpack handles assets)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// Custom marker icons
const createCustomIcon = (color, isDriver = false) => {
  return new L.DivIcon({
    className: `custom-marker ${isDriver ? 'driver-marker' : ''}`,
    html: `<div style="background-color: ${color};">
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
               <path stroke-linecap="round" stroke-linejoin="round" d="${isDriver 
                 ? 'M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12' 
                 : 'M15 10.5a3 3 0 11-6 0 3 3 0 016 0z M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z'}" />
             </svg>
           </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  });
};

// Map view updater component to handle changes in markers positions
const MapViewUpdater = ({ center, zoom }) => {
  const map = useMap();
  
  useEffect(() => {
    if (center) {
      map.setView(center, zoom || map.getZoom());
    }
  }, [center, zoom, map]);
  
  return null;
};

const RideMapView = ({ ride }) => {
  const [driverPosition, setDriverPosition] = useState(null);
  const [pickupPosition, setPickupPosition] = useState(null);
  const [destinationPosition, setDestinationPosition] = useState(null);
  const [route, setRoute] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Set up initial positions from ride data
  useEffect(() => {
    if (!ride) return;
    
    setLoading(true);
    
    // Get driver position if available
    if (ride.driverLocation) {
      const { lat, lng } = ride.driverLocation;
      setDriverPosition([lat, lng]);
    }
    
    // Generate mock pickup and destination coordinates based on ride information
    // In a real app, these would come from geocoding the addresses
    const generateRandomPosition = (basePosition, offset = 0.01) => {
      return [
        basePosition[0] + (Math.random() - 0.5) * offset,
        basePosition[1] + (Math.random() - 0.5) * offset
      ];
    };
    
    // Center position (just a fallback)
    const centerPosition = [16.5062, 80.648];
    
    // Set pickup and destination positions
    const pickup = generateRandomPosition(centerPosition);
    setPickupPosition(pickup);
    
    const destination = generateRandomPosition(centerPosition);
    setDestinationPosition(destination);
    
    // Generate a mock route between pickup and destination
    // In a real app, this would be fetched from a routing API
    const routePoints = [];
    const steps = 5; // Number of points to generate between pickup and destination
    
    for (let i = 0; i <= steps; i++) {
      const fraction = i / steps;
      const lat = pickup[0] + (destination[0] - pickup[0]) * fraction;
      const lng = pickup[1] + (destination[1] - pickup[1]) * fraction;
      
      // Add some randomness to make it look more like a real route
      const randomLat = (Math.random() - 0.5) * 0.005;
      const randomLng = (Math.random() - 0.5) * 0.005;
      
      // Don't add randomness to the first and last points
      if (i === 0 || i === steps) {
        routePoints.push([lat, lng]);
      } else {
        routePoints.push([lat + randomLat, lng + randomLng]);
      }
    }
    
    setRoute(routePoints);
    setLoading(false);
  }, [ride]);
  
  // Update driver position when it changes
  useEffect(() => {
    if (!ride?.driverLocation) return;
    
    const { lat, lng } = ride.driverLocation;
    setDriverPosition([lat, lng]);
  }, [ride?.driverLocation]);
  
  if (loading || !pickupPosition || !destinationPosition) {
    return (
      <div className="ride-map-loading">
        <div className="spinner"></div>
        <p>Loading map...</p>
      </div>
    );
  }
  
  return (
    <div className="ride-map-container">
      <MapContainer 
        center={driverPosition || pickupPosition} 
        zoom={14} 
        className="ride-map"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        {/* Map view updater to follow driver position */}
        <MapViewUpdater 
          center={driverPosition || pickupPosition} 
          zoom={14}
        />
        
        {/* Pickup marker */}
        <Marker 
          position={pickupPosition} 
          icon={createCustomIcon('#22C55E')}
        >
          <Popup>
            <div className="map-popup">
              <strong>Pickup Location</strong>
              <p>{ride.pickup}</p>
            </div>
          </Popup>
        </Marker>
        
        {/* Destination marker */}
        <Marker 
          position={destinationPosition} 
          icon={createCustomIcon('#EF4444')}
        >
          <Popup>
            <div className="map-popup">
              <strong>Destination</strong>
              <p>{ride.destination}</p>
            </div>
          </Popup>
        </Marker>
        
        {/* Driver marker (only shown if ride is confirmed or in progress) */}
        {driverPosition && (ride.status === 'confirmed' || ride.status === 'in-progress') && (
          <Marker 
            position={driverPosition} 
            icon={createCustomIcon('#3B82F6', true)}
          >
            <Popup>
              <div className="map-popup">
                <strong>Driver Location</strong>
                <p>{ride.driverName}</p>
                {ride.estimatedArrival && (
                  <p className="eta">ETA: {ride.estimatedArrival}</p>
                )}
              </div>
            </Popup>
          </Marker>
        )}
        
        {/* Route line */}
        <Polyline 
          positions={route} 
          color="#3B82F6" 
          weight={4} 
          opacity={0.7} 
          dashArray={ride.status === 'completed' ? '' : '8, 8'}
        />
      </MapContainer>
      
      <div className="map-legend">
        <div className="legend-item">
          <div className="legend-icon pickup"></div>
          <span>Pickup</span>
        </div>
        <div className="legend-item">
          <div className="legend-icon destination"></div>
          <span>Destination</span>
        </div>
        {(ride.status === 'confirmed' || ride.status === 'in-progress') && (
          <div className="legend-item">
            <div className="legend-icon driver"></div>
            <span>Driver</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default RideMapView; 