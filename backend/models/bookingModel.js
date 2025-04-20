import mongoose from 'mongoose';

const bookingSchema = mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true
    },
    userId: {
      type: String,
      required: true,
      ref: 'User'
    },
    pickup: {
      type: String,
      required: true
    },
    destination: {
      type: String,
      required: true
    },
    date: {
      type: String,
      required: true
    },
    time: {
      type: String,
      required: true
    },
    scheduledTime: {
      type: String
    },
    passengers: {
      type: Number,
      required: true,
      default: 1
    },
    rideType: {
      type: String,
      required: true,
      default: 'standard'
    },
    status: {
      type: String,
      required: true,
      default: 'pending'
    },
    fare: {
      type: mongoose.Schema.Types.Mixed, // Can store number or string like "$10.00"
      required: true
    },
    distance: {
      type: String
    },
    duration: {
      type: String
    },
    pickupCoordinates: {
      lat: Number,
      lng: Number
    },
    destinationCoordinates: {
      lat: Number,
      lng: Number
    },
    driverInfo: {
      name: String,
      phone: String,
      rating: String,
      vehicle: String,
      licensePlate: String
    },
    phone: {
      type: String
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

const Booking = mongoose.model('Booking', bookingSchema);

export default Booking; 