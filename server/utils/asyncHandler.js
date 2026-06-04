/**
 * Wraps async route handlers to automatically catch errors
 * and pass them to Express error handling middleware.
 * Eliminates the need for try-catch blocks in every controller.
 *
 * @param {Function} requestHandler - Async Express route handler
 * @returns {Function} Wrapped handler with error catching
 */
const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch(next);
  };
};

export default asyncHandler;
