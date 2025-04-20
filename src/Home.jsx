import React from 'react';
import Sidebar from './components/Sidebar';
import BookingForm from './components/BookingForm';
import './styles/components.css';

const Home = () => {
    return (
        <div className="home-wrapper">
            <div className="home-container">
                <div className="dashboard">
                    <Sidebar />
                    <main className="main-content">
                        <BookingForm />
                    </main>
                </div>
            </div>
        </div>
    );
};

export default Home; 