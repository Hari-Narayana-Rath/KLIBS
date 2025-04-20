import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import User from '../models/userModel.js';
import Booking from '../models/bookingModel.js';

// Load environment variables
dotenv.config();

// Get directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Connect to MongoDB
connectDB();

// Function to import data from db.json
const importData = async () => {
  try {
    // Read db.json
    const dbPath = path.join(__dirname, '../../db.json');
    console.log(`Reading data from ${dbPath}`);
    const data = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
    
    // Clear existing data
    await User.deleteMany();
    await Booking.deleteMany();
    
    console.log('Existing data cleared');
    
    // Import users
    if (data.users && data.users.length > 0) {
      await User.insertMany(data.users);
      console.log(`${data.users.length} users imported successfully`);
    }
    
    // Import bookings
    if (data.bookings && data.bookings.length > 0) {
      await Booking.insertMany(data.bookings);
      console.log(`${data.bookings.length} bookings imported successfully`);
    }
    
    console.log('All data imported successfully');
    process.exit();
  } catch (error) {
    console.error(`Error importing data: ${error.message}`);
    process.exit(1);
  }
};

importData(); 