import React from 'react';
import { FaMapMarkerAlt, FaRegClock, FaUsers, FaCar, FaCheckCircle, FaTimes } from 'react-icons/fa';
import '../styles/components.css';

const PastRidesPanel = ({ pastRides, onRepeatRide, onClose }) => {
    // Format date to a more readable format
    const formatDate = (date) => {
        const options = { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        return date.toLocaleDateString('en-US', options);
    };

    // Get appropriate icon for ride type
    const getRideTypeIcon = (rideType) => {
        switch(rideType.toLowerCase()) {
            case 'luxury':
                return <FaCar className="icon luxury" />;
            case 'premium':
                return <FaCar className="icon premium" />;
            case 'suv':
                return <FaCar className="icon suv" />;
            default:
                return <FaCar className="icon standard" />;
        }
    };

    // Capitalize first letter of ride type
    const formatRideType = (type) => {
        return type.charAt(0).toUpperCase() + type.slice(1);
    };

    return (
        <div className="past-rides-panel">
            <div className="past-rides-header">
                <h2>Past Rides</h2>
                <button className="close-button" onClick={onClose}>
                    <FaTimes />
                </button>
            </div>
            
            <div className="past-rides-body">
                {pastRides.length === 0 ? (
                    <div className="no-rides-message">
                        <p>You don't have any past rides yet.</p>
                    </div>
                ) : (
                    <ul className="past-rides-list">
                        {pastRides.map(ride => (
                            <li key={ride.id} className="past-ride-card">
                                <div className="ride-header">
                                    <div className="ride-date">{formatDate(ride.date)}</div>
                                    <div className="ride-status">
                                        <FaCheckCircle className="status-icon completed" />
                                        {ride.status}
                                    </div>
                                </div>
                                
                                <div className="ride-locations">
                                    <div className="pickup">
                                        <FaMapMarkerAlt className="location-icon pickup" />
                                        <div className="location-text">{ride.pickup}</div>
                                    </div>
                                    <div className="destination">
                                        <FaMapMarkerAlt className="location-icon destination" />
                                        <div className="location-text">{ride.destination}</div>
                                    </div>
                                </div>
                                
                                <div className="ride-details">
                                    <div className="ride-detail">
                                        <FaRegClock className="detail-icon" />
                                        <span>{formatDate(ride.date).split(',')[1]}</span>
                                    </div>
                                    <div className="ride-detail">
                                        <FaUsers className="detail-icon" />
                                        <span>{ride.passengers} passenger{ride.passengers !== 1 ? 's' : ''}</span>
                                    </div>
                                    <div className="ride-detail">
                                        {getRideTypeIcon(ride.rideType)}
                                        <span>{formatRideType(ride.rideType)}</span>
                                    </div>
                                </div>
                                
                                <div className="ride-fare">
                                    <span className="fare-amount">${ride.fare.toFixed(2)}</span>
                                </div>
                                
                                <div className="ride-actions">
                                    <button 
                                        className="repeat-ride-button"
                                        onClick={() => onRepeatRide(ride)}
                                    >
                                        Repeat Ride
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default PastRidesPanel; 