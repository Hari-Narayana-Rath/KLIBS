import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/loginForm.css';
import { isPilotEmail } from '../utils/authUtils';

const LoginForm = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const endpoint = isLogin ? '/api/users/login' : '/api/users';
      console.log(`Submitting ${isLogin ? 'login' : 'registration'} form to ${endpoint}`);
      
      const formDataToSend = isLogin 
        ? { email: formData.email, password: formData.password } 
        : { name: formData.name, email: formData.email, password: formData.password, phone: formData.phone };
      
      console.log('Form data being sent:', { ...formDataToSend, password: '******' });
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formDataToSend),
      });

      console.log('Response status:', response.status);
      
      // Get text response for debugging
      const responseText = await response.text();
      console.log('Response text:', responseText);
      
      // If empty response, handle it
      if (!responseText.trim()) {
        throw new Error('Server returned an empty response');
      }
      
      // Parse the response as JSON
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error('Failed to parse response as JSON:', e);
        throw new Error(`Failed to parse server response: ${responseText}`);
      }
      
      if (!response.ok) {
        throw new Error(data.message || 'Authentication failed');
      }
      
      console.log('Authentication successful, user data:', { ...data, token: '******' });
      
      // Check if the email is a pilot email
      const isPilot = isPilotEmail(formData.email);
      const userRole = isPilot ? 'pilot' : (data.isAdmin ? 'admin' : 'user');
      
      console.log('Detected user role:', userRole);
      
      // Save user data and token to localStorage
      localStorage.setItem('token', data.token);
      localStorage.setItem('userId', data.id || data._id);
      localStorage.setItem('userName', data.name);
      localStorage.setItem('userEmail', data.email);
      localStorage.setItem('userPhone', data.phone);
      
      // Set user role based on email pattern
      localStorage.setItem('userRole', userRole);
      
      console.log('User data saved to localStorage');
      
      // Redirect based on role
      if (userRole === 'pilot') {
        navigate('/pilot');
      } else {
        navigate('/home');
      }
    } catch (error) {
      console.error('Authentication error:', error);
      setError(error.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleForm = () => {
    setIsLogin(!isLogin);
    setError('');
  };

  return (
    <div className="login-container">
      <div className="login-form-card">
        <h2 className="form-title">{isLogin ? 'Login' : 'Register'}</h2>
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit} className="auth-form">
          {!isLogin && (
            <>
              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name || ''}
                  onChange={handleChange}
                  required={!isLogin}
                  placeholder="Enter your full name"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="phone">Phone Number</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone || ''}
                  onChange={handleChange}
                  required={!isLogin}
                  placeholder="Enter your phone number"
                />
              </div>
            </>
          )}
          
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <div>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="Enter your email"
              />
              {formData.email && isPilotEmail(formData.email) && (
                <div className="pilot-badge">Pilot Account</div>
              )}
            </div>
            <small className="email-hint">
              For pilot accounts, use format: <code>name.pilot@klibs.com</code>
            </small>
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Enter your password"
            />
          </div>
          
          <button 
            type="submit" 
            className="submit-button"
            disabled={loading}
          >
            {loading ? 'Processing...' : isLogin ? 'Login' : 'Register'}
          </button>
        </form>
        
        <div className="form-toggle">
          <p>
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            <button 
              type="button"
              onClick={toggleForm}
              className="toggle-button"
            >
              {isLogin ? 'Register' : 'Login'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm; 