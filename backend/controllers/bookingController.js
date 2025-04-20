import asyncHandler from '../utils/asyncHandler.js';
import Booking from '../models/bookingModel.js';
import User from '../models/userModel.js';

// @desc    Create a new booking
// @route   POST /api/bookings
// @access  Private
const createBooking = asyncHandler(async (req, res) => {
  console.log('Create booking request received');
  console.log('Request body:', req.body);
  console.log('Authenticated user:', req.user);

  try {
    const {
      id,
      pickup,
      destination,
      date,
      time,
      scheduledTime,
      passengers,
      rideType,
      fare,
      distance,
      duration,
      pickupCoordinates,
      destinationCoordinates,
      phone,
    } = req.body;

    // Get user ID from authenticated user
    const userId = req.user._id;
    console.log('User ID from auth:', userId);

    // Make sure we have all required fields
    if (!id || !pickup || !destination || !date || !time || !rideType || !fare) {
      console.log('Missing required fields in booking data');
      return res.status(400).json({ message: 'Please provide all required booking details' });
    }

    // Create booking object with all details
    const bookingData = {
      id,
      userId,
      pickup,
      destination,
      date,
      time,
      scheduledTime,
      passengers,
      rideType,
      status: 'pending',
      fare,
      distance,
      duration,
      pickupCoordinates,
      destinationCoordinates,
      phone: phone || req.user.phone,
      createdAt: Date.now()
    };

    console.log('Creating booking with data:', bookingData);

    const booking = await Booking.create(bookingData);
    console.log('Booking created successfully:', booking);

    if (booking) {
      // Emit socket event if available
      const io = req.app.get('io');
      if (io) {
        io.to(userId.toString()).emit('newBooking', booking);
        console.log('Socket event emitted for new booking');
      }
      
      return res.status(201).json(booking);
    } else {
      console.log('Failed to create booking');
      return res.status(400).json({ message: 'Invalid booking data' });
    }
  } catch (error) {
    console.error('Error in createBooking controller:', error);
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get all bookings
// @route   GET /api/bookings
// @access  Private/Admin
const getBookings = asyncHandler(async (req, res) => {
  const bookings = await Booking.find({}).sort({ createdAt: -1 });
  res.json(bookings);
});

// @desc    Get booking by ID
// @route   GET /api/bookings/:id
// @access  Private
const getBookingById = asyncHandler(async (req, res) => {
  const booking = await Booking.findOne({ id: req.params.id });
  
  if (booking) {
    // Check if the booking belongs to the authenticated user or user is admin
    if (booking.userId.toString() === req.user._id.toString() || req.user.isAdmin) {
      res.json(booking);
    } else {
      res.status(403);
      throw new Error('Not authorized to access this booking');
    }
  } else {
    res.status(404);
    throw new Error('Booking not found');
  }
});

// @desc    Get bookings by user ID
// @route   GET /api/bookings/user/:userId
// @access  Private
const getBookingsByUserId = asyncHandler(async (req, res) => {
  // Check if the requested user ID matches the authenticated user's ID or user is admin
  if (req.params.userId !== req.user._id.toString() && !req.user.isAdmin) {
    res.status(403);
    throw new Error('Not authorized to access these bookings');
  }

  const bookings = await Booking.find({ userId: req.params.userId }).sort({ createdAt: -1 });
  res.json(bookings);
});

// @desc    Get current user's bookings
// @route   GET /api/bookings/my-bookings
// @access  Private
const getMyBookings = asyncHandler(async (req, res) => {
  const bookings = await Booking.find({ userId: req.user._id }).sort({ createdAt: -1 });
  res.json(bookings);
});

// @desc    Update booking status
// @route   PATCH /api/bookings/:id
// @access  Private
const updateBookingStatus = asyncHandler(async (req, res) => {
  const { status, driverInfo } = req.body;
  
  const booking = await Booking.findOne({ id: req.params.id });
  
  if (booking) {
    // Check if the booking belongs to the authenticated user or user is admin
    if (booking.userId.toString() === req.user._id.toString() || req.user.isAdmin) {
      booking.status = status || booking.status;
      
      if (driverInfo) {
        booking.driverInfo = driverInfo;
      }
      
      const updatedBooking = await booking.save();
      
      // Emit socket event if available
      const io = req.app.get('io');
      if (io) {
        io.to(booking.userId.toString()).emit('bookingStatusUpdate', {
          bookingId: booking.id,
          status: booking.status,
          driverInfo: booking.driverInfo
        });
      }
      
      res.json(updatedBooking);
    } else {
      res.status(403);
      throw new Error('Not authorized to update this booking');
    }
  } else {
    res.status(404);
    throw new Error('Booking not found');
  }
});

// @desc    Delete a booking
// @route   DELETE /api/bookings/:id
// @access  Private
const deleteBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findOne({ id: req.params.id });
  
  if (booking) {
    // Check if the booking belongs to the authenticated user or user is admin
    if (booking.userId.toString() === req.user._id.toString() || req.user.isAdmin) {
      await booking.deleteOne();
      res.json({ message: 'Booking removed' });
    } else {
      res.status(403);
      throw new Error('Not authorized to delete this booking');
    }
  } else {
    res.status(404);
    throw new Error('Booking not found');
  }
});

export { 
  createBooking, 
  getBookings, 
  getBookingById, 
  getBookingsByUserId,
  getMyBookings,
  updateBookingStatus,
  deleteBooking
}; 