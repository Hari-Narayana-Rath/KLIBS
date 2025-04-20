import React from 'react';
import { useNavigate } from 'react-router-dom';

const Header = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        console.log("Logging out user");
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userRole');
        navigate('/', { replace: true });
    };

    const handleNavigation = (path) => {
        console.log(`Header navigating to: ${path}`);
        navigate(path, { replace: true });
    };

    return (
        <header className="header">
            <div className="flex items-center space-x-4">
                <h2>Klibs Booking</h2>
            </div>
            <button className="button button-secondary" onClick={handleLogout}>
                Logout
            </button>
        </header>
    );
};

export default Header; 