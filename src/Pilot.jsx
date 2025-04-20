import React from 'react';
import './Pilot.css';

const Pilot = () => {
    const pilotEmail = localStorage.getItem('userEmail') || 'Pilot';

    return (
        <div className="pilot-container">
            <main className="pilot-main">
                <div className="pilot-welcome">
                    <h2>Welcome, {pilotEmail}!</h2>
                    <p>Your driver dashboard is currently under development.</p>
                </div>
                <div className="pilot-empty-state">
                    <div className="empty-icon">🚕</div>
                    <p>You'll soon be able to view and accept ride requests here.</p>
                </div>
            </main>
        </div>
    );
};

export default Pilot; 