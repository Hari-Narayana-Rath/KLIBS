import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import '../styles/bookingForm.css'; // Import the new CSS file

import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerIconShadow,
});
L.Marker.prototype.options.icon = DefaultIcon;

try {
    Modal.setAppElement('#root');
} catch (e) {
    console.warn('Unable to set app element for Modal');
}

const customModalStyles = {
    content: {
        top: '50%',
        left: '50%',
        right: 'auto',
        bottom: 'auto',
        marginRight: '-50%',
        transform: 'translate(-50%, -50%)',
        background: '#1f2937', // bg-gray-800
        border: 'none',
        borderRadius: '0.5rem',
        padding: '1.5rem',
        maxWidth: '90%',
        width: '900px',
        maxHeight: '90vh',
    },
    overlay: {
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        zIndex: 1000,
    }
};

const BookingForm = ({ onBookingCreated }) => {
    const [formData, setFormData] = useState({
        pickup: '',
        pickupCoords: { lat: null, lng: null },
        destination: '',
        destinationCoords: { lat: null, lng: null },
        date: '',
        time: '',
        passengers: 1,
        rideType: 'standard',
        phone: '',
    });

    const [isMapOpen, setIsMapOpen] = useState(false);
    const [mapTarget, setMapTarget] = useState('pickup');
    const [mapKey, setMapKey] = useState(0); // Used to force re-render the map
    
    // Add effect to monitor ride type changes
    useEffect(() => {
        console.log("Current ride type:", formData.rideType);
    }, [formData.rideType]);

    // Function to get location name from coordinates
    const getLocationName = async (lat, lng) => {
        try {
            console.log("Fetching location for:", lat, lng);
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
            );
            
            if (!response.ok) {
                throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log("Location data received:", data);
            return data.display_name || '';
        } catch (error) {
            console.error('Error fetching location name:', error);
            return '';
        }
    };

    // Open map modal for selection
    const openMapForSelection = (target) => {
        console.log("Opening map for:", target);
        setMapTarget(target);
        setMapKey(prev => prev + 1); // Force map re-render
        setIsMapOpen(true);
    };

    // Handle map click to select location
    const handleMapClick = async (lat, lng) => {
        console.log("Map clicked at:", lat, lng);
        try {
            const locationName = await getLocationName(lat, lng);
            console.log("Location name:", locationName);
            
            if (mapTarget === 'pickup') {
                setFormData((prev) => ({
                    ...prev,
                    pickup: locationName,
                    pickupCoords: { lat, lng }
                }));
            } else {
                setFormData((prev) => ({
                    ...prev,
                    destination: locationName,
                    destinationCoords: { lat, lng }
                }));
            }
            setIsMapOpen(false);
        } catch (error) {
            console.error("Error in handleMapClick:", error);
            // Keep the modal open if there's an error
            alert("Failed to get location information. Please try again.");
        }
    };

    // Form submission handler
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Validate form data
            if (!formData.pickup || !formData.destination || !formData.date || !formData.time) {
                alert('Please fill in all required fields');
                return;
            }

            // Validate phone number
            if (!formData.phone || formData.phone.length < 10) {
                alert('Please enter a valid phone number. We need this to contact you about your ride.');
                return;
            }

            // Get the current user ID from localStorage
            const userId = localStorage.getItem('userId');
            
            if (!userId) {
                throw new Error('User ID not found. Please log in again.');
            }
            
            console.log('Using user ID:', userId);
            
            // Generate a unique ID
            const bookingId = 'ride' + Date.now().toString().slice(-6);

            // Format the booking data to match db.json schema
            const bookingData = {
                id: bookingId,
                userId,
                date: formData.date,
                time: formData.time,
                status: 'pending',
                pickup: formData.pickup,
                destination: formData.destination,
                rideType: formData.rideType,
                passengers: formData.passengers,
                phone: formData.phone,
                fare: calculateFare(formData.rideType, formData.passengers),
                distance: "Calculating...",
                duration: "Calculating...",
                scheduledTime: `${formData.date} ${formData.time}`,
                pickupCoordinates: formData.pickupCoords.lat && formData.pickupCoords.lng 
                    ? { lat: formData.pickupCoords.lat, lng: formData.pickupCoords.lng }
                    : null,
                destinationCoordinates: formData.destinationCoords.lat && formData.destinationCoords.lng 
                    ? { lat: formData.destinationCoords.lat, lng: formData.destinationCoords.lng }
                    : null,
                createdAt: new Date().toISOString(),
                userName: localStorage.getItem('userEmail') || 'Anonymous'
            };

            console.log('Sending booking data:', bookingData);

            // Save to MongoDB API
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('Authentication token not found. Please log in.');
            }

            console.log('Using token:', token);

            const requestOptions = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(bookingData),
            };

            console.log('Request options:', requestOptions);

            // Use the proxy URL configured in vite.config.js
            const apiUrl = '/api/bookings';
            console.log('Sending request to:', apiUrl);

            const response = await fetch(apiUrl, requestOptions);
            console.log('Response status:', response.status);
            console.log('Response headers:', [...response.headers.entries()]);

            // Check if response is ok
            if (!response.ok) {
                // Try to get the response text first to debug
                const responseText = await response.text();
                console.error('Error response text:', responseText);
                
                // Try to parse as JSON if possible
                let errorData = null;
                try {
                    errorData = JSON.parse(responseText);
                } catch (e) {
                    console.error('Failed to parse error response as JSON:', e);
                }
                
                throw new Error(`Failed to save booking: ${response.status} ${errorData ? errorData.message : responseText}`);
            }

            // Try to get the response text first
            const responseText = await response.text();
            console.log('Response text:', responseText);

            // If the response is empty, handle it
            if (!responseText.trim()) {
                throw new Error('Server returned an empty response');
            }

            // Parse as JSON
            const savedBooking = JSON.parse(responseText);
            console.log('Booking saved to MongoDB:', savedBooking);
            
            // Notify the parent component of the new booking
            if (onBookingCreated) {
                onBookingCreated(savedBooking);
            }
            
            alert('Booking created successfully!');
            
            // Reset form after successful booking
            setFormData({
                pickup: '',
                pickupCoords: { lat: null, lng: null },
                destination: '',
                destinationCoords: { lat: null, lng: null },
                date: '',
                time: '',
                passengers: 1,
                rideType: 'standard',
                phone: '',
            });
        } catch (error) {
            console.error('Error creating booking:', error);
            alert(`Failed to create booking: ${error.message}. Please check the console for more details.`);
        }
    };

    // Calculate fare based on ride type and passengers
    const calculateFare = (rideType, passengers) => {
        // Base fare by ride type
        let baseFare;
        switch(rideType.toLowerCase()) {
            case 'luxury':
                baseFare = 50;
                break;
            case 'premium':
                baseFare = 35;
                break;
            case 'suv':
                baseFare = 30;
                break;
            default: // standard
                baseFare = 20;
                break;
        }
        
        // Add passenger fee (first passenger included in base fare)
        const additionalPassengers = Math.max(0, passengers - 1);
        const passengerFee = additionalPassengers * 5;
        
        // Add some randomness to simulate distance calculation
        const randomFactor = Math.random() * 10;
        
        const totalFare = baseFare + passengerFee + randomFactor;
        return `$${totalFare.toFixed(2)}`;
    };
    
    // Handle form field changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    return (
        <div className="min-h-screen bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <div className="booking-form-container">
                    <div className="bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
                        <div className="p-8">
                            <h2 className="text-3xl font-bold text-white mb-8 text-center">Book Your Ride</h2>
                            <form onSubmit={handleSubmit} className="space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <label className="block text-sm font-semibold text-gray-300 uppercase tracking-wider">
                                            Pickup Location
                                        </label>
                                        <div className="relative form-field">
                                            <input
                                                type="text"
                                                value={formData.pickup}
                                                onChange={(e) => setFormData((prev) => ({ ...prev, pickup: e.target.value }))}
                                                placeholder="Enter pickup location"
                                                className="w-full px-4 py-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition duration-200"
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => openMapForSelection('pickup')}
                                                className="absolute right-2 top-2 bg-blue-600 text-white py-1 px-3 rounded-lg hover:bg-blue-700"
                                            >
                                                Select on Map
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <label className="block text-sm font-semibold text-gray-300 uppercase tracking-wider">
                                            Destination
                                        </label>
                                        <div className="relative form-field">
                                            <input
                                                type="text"
                                                value={formData.destination}
                                                onChange={(e) => setFormData((prev) => ({ ...prev, destination: e.target.value }))}
                                                placeholder="Enter destination"
                                                className="w-full px-4 py-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition duration-200"
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => openMapForSelection('destination')}
                                                className="absolute right-2 top-2 bg-blue-600 text-white py-1 px-3 rounded-lg hover:bg-blue-700"
                                            >
                                                Select on Map
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-4 form-field">
                                        <label className="block text-sm font-semibold text-gray-300 uppercase tracking-wider">Date</label>
                                        <input
                                            type="date"
                                            value={formData.date}
                                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                            className="w-full px-4 py-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition duration-200"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-4 form-field">
                                        <label className="block text-sm font-semibold text-gray-300 uppercase tracking-wider">Time</label>
                                        <input
                                            type="time"
                                            value={formData.time}
                                            onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                                            className="w-full px-4 py-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition duration-200"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-4 form-field">
                                        <label className="block text-sm font-semibold text-gray-300 uppercase tracking-wider">Passengers</label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="10"
                                            value={formData.passengers}
                                            onChange={(e) => setFormData({ ...formData, passengers: parseInt(e.target.value) })}
                                            className="w-full px-4 py-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition duration-200"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Ride Type Selection - Enhanced Style */}
                                <div className="space-y-4 ride-type-selector mb-8">
                                    <label className="block text-sm font-semibold text-gray-300 uppercase tracking-wider">
                                        Ride Type
                                    </label>
                                    <div className="ride-type-grid">
                                        {/* First Row */}
                                        <button 
                                            type="button"
                                            onClick={() => {
                                                console.log("Selecting standard ride type");
                                                setFormData(prev => ({ ...prev, rideType: 'standard' }));
                                            }}
                                            className={`ride-type-btn p-4 rounded-lg cursor-pointer border-2 w-full text-left ${
                                                formData.rideType === 'standard' ? 'selected' : 'bg-gray-700 border-gray-500 hover:bg-gray-600'
                                            }`}
                                        >
                                            <div>
                                                <div className="ride-type-icon"></div>
                                                <h3 className="font-bold text-white">Standard</h3>
                                                <p className="text-xs text-gray-300 mt-1">
                                                    Affordable everyday rides
                                                </p>
                                            </div>
                                        </button>
                                        
                                        <button 
                                            type="button"
                                            onClick={() => {
                                                console.log("Selecting premium ride type");
                                                setFormData(prev => ({ ...prev, rideType: 'premium' }));
                                            }}
                                            className={`ride-type-btn p-4 rounded-lg cursor-pointer border-2 w-full text-left ${
                                                formData.rideType === 'premium' ? 'selected' : 'bg-gray-700 border-gray-500 hover:bg-gray-600'
                                            }`}
                                        >
                                            <div>
                                                <div className="ride-type-icon"></div>
                                                <h3 className="font-bold text-white">Premium</h3>
                                                <p className="text-xs text-gray-300 mt-1">
                                                    Comfortable cars with top-rated drivers
                                                </p>
                                            </div>
                                        </button>
                                        
                                        {/* Second Row */}
                                        <button 
                                            type="button"
                                            onClick={() => {
                                                console.log("Selecting luxury ride type");
                                                setFormData(prev => ({ ...prev, rideType: 'luxury' }));
                                            }}
                                            className={`ride-type-btn p-4 rounded-lg cursor-pointer border-2 w-full text-left ${
                                                formData.rideType === 'luxury' ? 'selected' : 'bg-gray-700 border-gray-500 hover:bg-gray-600'
                                            }`}
                                        >
                                            <div>
                                                <div className="ride-type-icon"></div>
                                                <h3 className="font-bold text-white">Luxury</h3>
                                                <p className="text-xs text-gray-300 mt-1">
                                                    High-end cars with professional drivers
                                                </p>
                                            </div>
                                        </button>
                                        
                                        <button 
                                            type="button"
                                            onClick={() => {
                                                console.log("Selecting SUV ride type");
                                                setFormData(prev => ({ ...prev, rideType: 'suv' }));
                                            }}
                                            className={`ride-type-btn p-4 rounded-lg cursor-pointer border-2 w-full text-left ${
                                                formData.rideType === 'suv' ? 'selected' : 'bg-gray-700 border-gray-500 hover:bg-gray-600'
                                            }`}
                                        >
                                            <div>
                                                <div className="ride-type-icon"></div>
                                                <h3 className="font-bold text-white">SUV</h3>
                                                <p className="text-xs text-gray-300 mt-1">
                                                    Spacious vehicles for groups up to 6
                                                </p>
                                            </div>
                                        </button>
                                    </div>
                                    <input 
                                        type="hidden" 
                                        name="rideType" 
                                        value={formData.rideType}
                                        required 
                                    />
                                </div>

                                {/* Add phone input field */}
                                <div className="form-group">
                                    <label htmlFor="phone">Phone Number*</label>
                                    <input
                                        type="tel"
                                        id="phone"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        placeholder="Enter your phone number"
                                        required
                                    />
                                    <p className="helper-text">We need your phone number to connect you with your driver</p>
                                </div>

                                <div className="pt-6">
                                    <button
                                        type="submit"
                                        className="book-now-btn w-full text-white py-5 px-8 rounded-lg font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800"
                                    >
                                        Book Now
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>

            {/* Map Modal with custom styles */}
            <Modal
                isOpen={isMapOpen}
                onRequestClose={() => setIsMapOpen(false)}
                style={customModalStyles}
                contentLabel="Select Location on Map"
                ariaHideApp={false}
            >
                <div className="map-modal-content w-full h-full">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-white">
                            Select {mapTarget === 'pickup' ? 'Pickup' : 'Destination'} Location
                        </h2>
                        <button
                            onClick={() => setIsMapOpen(false)}
                            className="text-gray-400 hover:text-white"
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    
                    <div style={{ height: '500px', width: '100%' }} className="relative">
                        {isMapOpen && (
                            <MapContainer
                                key={mapKey}
                                center={[16.5062, 80.6480]}
                                zoom={13}
                                style={{ height: '100%', width: '100%' }}
                                scrollWheelZoom={true}
                            >
                                <TileLayer
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                />
                                <MapClickHandler onClick={handleMapClick} />
                            </MapContainer>
                        )}
                    </div>
                    
                    <div className="location-prompt mt-4 text-white text-sm p-3 rounded">
                        Click anywhere on the map to select a location
                    </div>
                </div>
            </Modal>
        </div>
    );
};

// Component to handle map clicks
const MapClickHandler = ({ onClick }) => {
    console.log("MapClickHandler mounted");
    const map = useMapEvents({
        click: (e) => {
            const { lat, lng } = e.latlng;
            console.log("Map clicked at coordinates:", lat, lng);
            onClick(lat, lng);
        },
    });
    return null;
};

export default BookingForm;