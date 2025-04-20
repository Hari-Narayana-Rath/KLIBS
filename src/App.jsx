import React from "react";
import { useNavigate, Routes, Route, Navigate } from "react-router-dom";
import "./App.css";
import "./index.css";
import Home from "./Home";
import PilotDashboard from "./pages/PilotDashboard";
import PilotRideDetail from "./pages/PilotRideDetail";
import RideHistoryPage from "./pages/RideHistoryPage";
import RideDetailPage from "./pages/RideDetailPage";
import LoginForm from "./components/LoginForm";
import { SocketProvider } from "./context/SocketContext";
import NotificationComponent from "./components/NotificationComponent";
import { isAuthenticated, isUserPilot, logoutUser } from "./utils/authUtils";

const App = () => {
    const navigate = useNavigate();

    // Protected route component
    const ProtectedRoute = ({ children }) => {
        if (!isAuthenticated()) {
            // Redirect to login page
            return <Navigate to="/login" />;
        }
        
        return children;
    };

    // Layout component for authenticated pages
    const AuthenticatedLayout = ({ children }) => {
        if (!isAuthenticated()) {
            return <Navigate to="/login" />;
        }
        
        return (
            <div className="app-container">
                <header className="header">
                    <h2>{isUserPilot() ? "Pilot Dashboard" : "Klibs Booking"}</h2>
                    <div className="header-actions">
                        <NotificationComponent />
                        <button className="button button-secondary" onClick={() => {
                            logoutUser();
                            navigate('/login', { replace: true });
                        }}>
                            Logout
                        </button>
                    </div>
                </header>
                {children}
            </div>
        );
    };

    return (
        <SocketProvider>
            <Routes>
                <Route path="/login" element={<LoginForm />} />
                
                <Route path="/" element={
                    isAuthenticated() ? 
                        <Navigate to={isUserPilot() ? "/pilot" : "/home"} /> : 
                        <Navigate to="/login" />
                } />
                
                <Route path="/home" element={
                    <ProtectedRoute>
                        <AuthenticatedLayout>
                            <Home />
                        </AuthenticatedLayout>
                    </ProtectedRoute>
                } />
                
                <Route path="/pilot" element={
                    <ProtectedRoute>
                        <AuthenticatedLayout>
                            {isUserPilot() ? <PilotDashboard /> : <Navigate to="/home" />}
                        </AuthenticatedLayout>
                    </ProtectedRoute>
                } />
                
                <Route path="/pilot/ride/:rideId" element={
                    <ProtectedRoute>
                        <AuthenticatedLayout>
                            {isUserPilot() ? <PilotRideDetail /> : <Navigate to="/home" />}
                        </AuthenticatedLayout>
                    </ProtectedRoute>
                } />
                
                <Route path="/past-rides" element={
                    <ProtectedRoute>
                        <AuthenticatedLayout>
                            <RideHistoryPage />
                        </AuthenticatedLayout>
                    </ProtectedRoute>
                } />
                
                <Route path="/ride/:rideId" element={
                    <ProtectedRoute>
                        <AuthenticatedLayout>
                            <RideDetailPage />
                        </AuthenticatedLayout>
                    </ProtectedRoute>
                } />
            </Routes>
        </SocketProvider>
    );
};

export default App;