/**
 * Utility functions for authentication and user roles
 */

/**
 * Checks if an email matches the pilot email pattern
 * @param {string} email - The email to check
 * @returns {boolean} - True if the email is a pilot email
 */
export const isPilotEmail = (email) => {
  if (!email) return false;
  
  // Check if email matches the pattern: name.pilot@klibs.com
  const pilotPattern = /^[a-zA-Z0-9_.]+\.pilot@klibs\.com$/i;
  return pilotPattern.test(email);
};

/**
 * Determines if the current user is a pilot based on localStorage data
 * @returns {boolean} - True if the user is a pilot
 */
export const isUserPilot = () => {
  const userRole = localStorage.getItem('userRole');
  const userEmail = localStorage.getItem('userEmail');
  
  // If role is explicitly set to pilot, return true
  if (userRole === 'pilot') return true;
  
  // Otherwise check the email pattern as a fallback
  if (userEmail) {
    return isPilotEmail(userEmail);
  }
  
  return false;
};

/**
 * Checks if the user is authenticated
 * @returns {boolean} - True if the user is authenticated
 */
export const isAuthenticated = () => {
  return localStorage.getItem('token') !== null;
};

/**
 * Logs out the current user by clearing localStorage
 */
export const logoutUser = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('userId');
  localStorage.removeItem('userName');
  localStorage.removeItem('userEmail');
  localStorage.removeItem('userPhone');
  localStorage.removeItem('userRole');
}; 