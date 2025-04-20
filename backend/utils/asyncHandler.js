/**
 * Async handler to eliminate try/catch boilerplate in route handlers
 * @param {Function} fn - The async function to handle
 * @returns {Function} Express middleware
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default asyncHandler; 