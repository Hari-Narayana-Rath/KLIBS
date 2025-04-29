# Hello Rentals Application

A full-stack MERN (MongoDB, Express, React, Node.js) application for cab booking.

## Features

- User authentication and authorization
- Booking rides with various options (standard, premium, luxury, SUV)
- Real-time ride tracking
- Ride history and management
- Driver assignment and ride status updates
- Responsive design for all devices

## Prerequisites

- Node.js (v14 or later)
- MongoDB (local or Atlas)
- npm or yarn

## Setup and Installation

1. Clone the repository:
```
git clone https://github.com/your-username/hello-rentals.git
cd hello-rentals
```

2. Install dependencies:
```
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```
MONGODB_URI=mongodb://localhost:27017/hello-rentals
PORT=3000
JWT_SECRET=your_jwt_secret_key_here
```

4. Import data from the existing json-server db.json (optional):
```
npm run import-data
```

## Running the Application

### Development Mode

1. Start the backend server:
```
npm run server:dev
```

2. Start the frontend development server:
```
npm run dev
```

The frontend will be available at http://localhost:3001

### Production Mode

1. Build the frontend:
```
npm run build
```

2. Start the server:
```
npm run server
```

## Migrating from json-server to MongoDB

This application was initially built with json-server as a temporary backend. The migration to MongoDB involved:

1. Setting up MongoDB models for Users and Bookings
2. Creating Express controllers and routes
3. Building an authentication system with JWT
4. Creating data import scripts to transfer data from json-server to MongoDB
5. Updating frontend API endpoints to work with the new MongoDB backend

To switch back to using json-server, run:
```
npm run json-server
```

## API Endpoints

### Users
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get a user by ID
- `POST /api/users` - Create a new user

### Bookings
- `GET /api/bookings` - Get all bookings
- `GET /api/bookings/:id` - Get a booking by ID
- `GET /api/bookings/user/:userId` - Get all bookings for a specific user
- `POST /api/bookings` - Create a new booking
- `PATCH /api/bookings/:id` - Update a booking (e.g., change status)
- `DELETE /api/bookings/:id` - Delete a booking

## License

MIT

## Author

Your Name
