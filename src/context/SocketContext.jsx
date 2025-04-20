import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

// Create context
const SocketContext = createContext(null);

// Socket.IO server URL
const SOCKET_URL = 'http://localhost:5000';

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    // Initialize socket connection
    const socketInstance = io(SOCKET_URL, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    // Set socket state
    setSocket(socketInstance);

    // Socket event listeners
    socketInstance.on('connect', () => {
      console.log('Socket connected:', socketInstance.id);
      setConnected(true);
      
      // Join user room if user is logged in
      const userId = localStorage.getItem('userId');
      if (userId) {
        socketInstance.emit('join', userId);
      }
    });

    socketInstance.on('disconnect', () => {
      console.log('Socket disconnected');
      setConnected(false);
    });

    socketInstance.on('error', (error) => {
      console.error('Socket error:', error);
    });

    // Handle ride updates
    socketInstance.on('rideUpdate', (data) => {
      console.log('Received ride update:', data);
      
      // Add to notifications
      setNotifications(prev => [
        {
          id: Date.now(),
          read: false,
          timestamp: new Date().toISOString(),
          ...data
        },
        ...prev
      ]);
    });

    // Clean up on unmount
    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, []);

  // Function to add user to their room
  const joinUserRoom = (userId) => {
    if (socket && userId) {
      socket.emit('join', userId);
    }
  };

  // Function to send ride status update (for testing or admin use)
  const sendRideStatusUpdate = (data) => {
    if (socket) {
      socket.emit('rideStatusUpdate', data);
    }
  };

  // Add notification
  const addNotification = (notification) => {
    setNotifications(prev => [
      {
        id: Date.now(),
        read: false,
        timestamp: new Date().toISOString(),
        ...notification
      },
      ...prev
    ]);
  };
  
  // Mark notification as read
  const markAsRead = (id) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true } 
          : notification
      )
    );
  };
  
  // Mark all notifications as read
  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  };
  
  // Remove notification
  const removeNotification = (id) => {
    setNotifications(prev => 
      prev.filter(notification => notification.id !== id)
    );
  };

  // Context value
  const value = {
    socket,
    connected,
    joinUserRoom,
    sendRideStatusUpdate,
    notifications,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

// Custom hook to use the socket context
export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export default SocketContext; 