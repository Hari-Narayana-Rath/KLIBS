# Cab Booking Application

A full-stack cab booking application with user and pilot interfaces, built with React, Node.js, Express, and MongoDB.

![Cab Booking App](https://github.com/yourusername/cab-booking-app/raw/main/screenshots/app-preview.png)

## Features

- User authentication with JWT
- Role-based access (user/pilot)
- Ride booking with map selection
- Real-time ride tracking with Socket.io
- Ride history and details
- Responsive UI for both mobile and desktop

## Tech Stack

### Frontend
- React.js
- React Router for navigation
- Leaflet for maps
- Socket.io client for real-time updates
- Tailwind CSS for styling

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- JWT authentication
- Socket.io for real-time communication

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- npm or yarn

## Installation

### Clone the repository

```bash
git clone https://github.com/yourusername/cab-booking-app.git
cd cab-booking-app
```

### Set up environment variables

Create a `.env` file in the root directory and another one in the `backend` directory with the following variables:

```
# Root .env
NODE_ENV=development
```

```
# Backend .env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/klibs-booking
JWT_SECRET=yoursecretkey
```

### Install dependencies

Install backend dependencies:
```bash
cd backend
npm install
```

Install frontend dependencies:
```bash
cd ..
npm install
```

## Running the Application

### Start MongoDB

Make sure MongoDB is running on your system:
```bash
mongod
```

### Start the backend server

```bash
cd backend
npm run dev
```

The backend server will run on http://localhost:5000

### Start the frontend development server

```bash
# In another terminal
npm run dev
```

The frontend development server will run on http://localhost:3000

## Usage

### User Registration/Login

1. Regular users: Register with any email
2. Pilot users: Register with an email pattern `name.pilot@klibs.com`

### Booking a Ride

1. Log in as a regular user
2. Fill in the booking form with pickup and destination locations
3. Select date, time, number of passengers, and ride type
4. Click "Book Now"

### Pilot Dashboard

1. Log in with a pilot email (`name.pilot@klibs.com`)
2. View assigned rides and ride details
3. Update ride status

## Project Structure

```
cab-booking-app/
├── backend/             # Backend Node.js/Express app
│   ├── config/          # Database configuration
│   ├── controllers/     # Route controllers
│   ├── middleware/      # Express middleware
│   ├── models/          # Mongoose models
│   ├── routes/          # Express routes
│   ├── utils/           # Utility functions
│   └── server.js        # Entry point
│
├── public/              # Public assets
├── src/                 # Frontend React app
│   ├── components/      # React components
│   ├── context/         # React context providers
│   ├── hooks/           # Custom React hooks
│   ├── pages/           # Page components
│   ├── styles/          # CSS files
│   ├── utils/           # Utility functions
│   ├── App.jsx          # Main App component
│   └── main.jsx         # Entry point
│
├── .env                 # Environment variables
├── package.json         # NPM package configuration
└── README.md            # Project documentation
```

## API Endpoints

### Authentication
- `POST /api/users` - Register a new user
- `POST /api/users/login` - Login a user

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `POST /api/users/address` - Save a new address

### Bookings
- `GET /api/bookings/my-bookings` - Get user's bookings
- `POST /api/bookings` - Create a new booking
- `GET /api/bookings/:id` - Get a booking by ID
- `PATCH /api/bookings/:id` - Update booking status
- `DELETE /api/bookings/:id` - Delete a booking

## Deployment

### Backend Deployment
1. Set up a MongoDB Atlas cluster
2. Update the MONGODB_URI in the .env file
3. Deploy to a hosting service like Heroku or Render

### Frontend Deployment
1. Build the React app: `npm run build`
2. Deploy the build folder to services like Netlify or Vercel

## Testing Accounts

For testing purposes, you can use these accounts:

- Regular User: 
  - Email: user@example.com
  - Password: password123

- Pilot: 
  - Email: john.pilot@klibs.com
  - Password: password123

## License

[MIT](LICENSE)


## Acknowledgements

- OpenStreetMap for the map data
- Heroicons for the icon set
