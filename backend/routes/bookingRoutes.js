import express from 'express';
import {
  createBooking,
  getBookings,
  getBookingById,
  getBookingsByUserId,
  getMyBookings,
  updateBookingStatus,
  deleteBooking
} from '../controllers/bookingController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Admin routes
router.get('/', protect, admin, getBookings);

// Protected routes
router.post('/', protect, createBooking);
router.get('/my-bookings', protect, getMyBookings);
router.get('/user/:userId', protect, getBookingsByUserId);
router.get('/:id', protect, getBookingById);
router.patch('/:id', protect, updateBookingStatus);
router.delete('/:id', protect, deleteBooking);

export default router; 