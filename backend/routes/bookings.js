import express from 'express';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Temporary in-memory storage (replace with MongoDB later)
let bookings = [];

// Middleware to verify token
const verifyToken = (req, res, next) => {
    const token = req.header('Authorization')?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        req.userId = decoded.userId;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};

// Helper function to send notification
const sendRideStatusNotification = (io, userId, booking, status, message) => {
    io.to(userId).emit('rideUpdate', {
        bookingId: booking.id,
        status,
        message,
        booking
    });
};

// Create booking
router.post('/', verifyToken, (req, res) => {
    try {
        const { pickup, destination, date, time, passengers, rideType } = req.body;

        const newBooking = {
            id: Date.now().toString(),
            userId: req.userId,
            pickup,
            destination,
            date,
            time,
            passengers,
            rideType,
            status: 'pending',
            createdAt: new Date().toISOString()
        };

        bookings.push(newBooking);

        // Send notification via Socket.IO
        const io = req.app.get('io');
        sendRideStatusNotification(
            io, 
            req.userId, 
            newBooking, 
            'created', 
            'Your booking has been created and is pending driver assignment.'
        );

        res.status(201).json(newBooking);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Get user's bookings
router.get('/my-bookings', verifyToken, (req, res) => {
    try {
        const userBookings = bookings.filter(booking => booking.userId === req.userId);
        res.json(userBookings);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Get single booking
router.get('/:id', verifyToken, (req, res) => {
    try {
        const booking = bookings.find(b => b.id === req.params.id);
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        if (booking.userId !== req.userId) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        res.json(booking);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Cancel booking
router.put('/:id/cancel', verifyToken, (req, res) => {
    try {
        const bookingIndex = bookings.findIndex(b => b.id === req.params.id);
        if (bookingIndex === -1) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        if (bookings[bookingIndex].userId !== req.userId) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        bookings[bookingIndex].status = 'cancelled';
        
        // Send notification via Socket.IO
        const io = req.app.get('io');
        sendRideStatusNotification(
            io, 
            req.userId, 
            bookings[bookingIndex], 
            'cancelled', 
            'Your booking has been cancelled successfully.'
        );

        res.json(bookings[bookingIndex]);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Update booking status (for admin/driver use)
router.put('/:id/status', verifyToken, (req, res) => {
    try {
        const { status } = req.body;
        if (!status || !['pending', 'confirmed', 'in-progress', 'completed', 'cancelled'].includes(status)) {
            return res.status(400).json({ message: 'Valid status required' });
        }

        const bookingIndex = bookings.findIndex(b => b.id === req.params.id);
        if (bookingIndex === -1) {
            return res.status(404).json({ message: 'Booking not found' });
        }
        
        // For demo purposes, allowing users to update their own booking status
        // In production, you'd check for admin/driver role
        if (bookings[bookingIndex].userId !== req.userId) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // Update the booking status
        bookings[bookingIndex].status = status;
        
        // Status specific updates
        if (status === 'confirmed') {
            // Simulate driver assignment
            bookings[bookingIndex].driverName = 'Alex Johnson';
            bookings[bookingIndex].driverPhone = '555-123-4567';
            bookings[bookingIndex].driverRating = '4.8';
            bookings[bookingIndex].carModel = 'Toyota Camry';
            bookings[bookingIndex].carColor = 'Silver';
            bookings[bookingIndex].licensePlate = 'ABC 1234';
        }
        
        // Send notification via Socket.IO
        const io = req.app.get('io');
        let message = 'Your ride status has been updated.';
        
        switch(status) {
            case 'confirmed':
                message = 'Your booking is confirmed! Driver is assigned.';
                break;
            case 'in-progress':
                message = 'Your ride is in progress.';
                break;
            case 'completed':
                message = 'Your ride has been completed. Thank you for riding with us!';
                break;
            case 'cancelled':
                message = 'Your ride has been cancelled.';
                break;
        }
        
        sendRideStatusNotification(
            io, 
            bookings[bookingIndex].userId, 
            bookings[bookingIndex], 
            status, 
            message
        );

        res.json(bookings[bookingIndex]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router; 