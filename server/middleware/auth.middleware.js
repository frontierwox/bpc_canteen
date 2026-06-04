import jwt from 'jsonwebtoken';
import User from '../models/User.model.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';

/**
 * Middleware: Verifies JWT access token from Authorization header.
 * Attaches the authenticated user object to req.user.
 * Rejects inactive users even with valid tokens.
 */
export const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Extract token from Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    throw new ApiError(401, 'Not authorized. Token missing.');
  }

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const user = await User.findById(decoded._id).select('-password -refreshToken');

    if (!user) {
      throw new ApiError(401, 'User not found. Token may be invalid.');
    }

    if (!user.isActive) {
      throw new ApiError(401, 'Account has been deactivated. Contact admin.');
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof ApiError) throw error;

    if (error.name === 'JsonWebTokenError') {
      throw new ApiError(401, 'Invalid token. Please log in again.');
    }

    if (error.name === 'TokenExpiredError') {
      throw new ApiError(401, 'Token expired. Please refresh your session.');
    }

    throw new ApiError(401, 'Authentication failed.');
  }
});

/**
 * Middleware: Role-based authorization gate.
 * Must be used AFTER the protect middleware.
 *
 * @param {...string} roles - Allowed roles (e.g., 'admin', 'employee')
 * @returns {Function} Express middleware
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      throw new ApiError(401, 'Authentication required before authorization.');
    }

    if (!roles.includes(req.user.role)) {
      throw new ApiError(
        403,
        `Role '${req.user.role}' is not authorized to access this route.`
      );
    }

    next();
  };
};
