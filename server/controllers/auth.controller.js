import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import User from '../models/User.model.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendEmail } from '../services/email.service.js';

/**
 * Cookie options for refresh token.
 * httpOnly prevents JS access; secure ensures HTTPS in production.
 */
const getCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/',
});

/**
 * Generates both access and refresh tokens, saves refresh token to DB.
 * @param {Object} user - User document
 * @returns {Object} { accessToken, refreshToken }
 */
const generateTokens = async (user) => {
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  // Save refresh token to user document
  user.refreshToken = refreshToken;
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  return { accessToken, refreshToken };
};

/**
 * POST /api/v1/auth/login
 * Authenticates user with email/password and returns JWT tokens.
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, 'Email and password are required.');
  }

  // Find user with password field (normally excluded)
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    throw new ApiError(401, 'Invalid email or password.');
  }

  if (!user.isActive) {
    throw new ApiError(403, 'Account has been deactivated. Contact admin.');
  }

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw new ApiError(401, 'Invalid email or password.');
  }

  const { accessToken, refreshToken } = await generateTokens(user);

  // Remove sensitive fields from response
  const userResponse = {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone,
    lastLogin: user.lastLogin,
  };

  res
    .status(200)
    .cookie('refreshToken', refreshToken, getCookieOptions())
    .json(new ApiResponse(200, { user: userResponse, accessToken }, 'Login successful'));
});

/**
 * POST /api/v1/auth/logout
 * Clears refresh token from DB and cookie.
 */
export const logout = asyncHandler(async (req, res) => {
  // Clear refresh token from DB
  if (req.user) {
    await User.findByIdAndUpdate(req.user._id, { refreshToken: '' });
  }

  res
    .status(200)
    .clearCookie('refreshToken', { ...getCookieOptions(), maxAge: 0 })
    .json(new ApiResponse(200, null, 'Logged out successfully'));
});

/**
 * POST /api/v1/auth/refresh-token
 * Verifies refresh token cookie and issues new token pair.
 */
export const refreshToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies?.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, 'Refresh token missing. Please log in again.');
  }

  let decoded;
  try {
    decoded = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
  } catch (error) {
    throw new ApiError(401, 'Invalid or expired refresh token. Please log in again.');
  }

  const user = await User.findById(decoded._id).select('+refreshToken');

  if (!user) {
    throw new ApiError(401, 'User not found. Token may be invalid.');
  }

  if (!user.isActive) {
    throw new ApiError(403, 'Account has been deactivated.');
  }

  // Verify the refresh token matches what's stored in DB
  if (user.refreshToken !== incomingRefreshToken) {
    throw new ApiError(401, 'Refresh token has been revoked. Please log in again.');
  }

  const { accessToken, refreshToken: newRefreshToken } = await generateTokens(user);

  res
    .status(200)
    .cookie('refreshToken', newRefreshToken, getCookieOptions())
    .json(new ApiResponse(200, { accessToken }, 'Token refreshed successfully'));
});

/**
 * POST /api/v1/auth/forgot-password
 * Sends password reset email with token link.
 */
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new ApiError(400, 'Email is required.');
  }

  const user = await User.findOne({ email });

  if (!user) {
    // Don't reveal whether email exists — security best practice
    return res
      .status(200)
      .json(new ApiResponse(200, null, 'If this email is registered, a reset link has been sent.'));
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

  user.passwordResetToken = hashedToken;
  user.passwordResetExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
  await user.save({ validateBeforeSave: false });

  // Build reset URL
  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

  try {
    await sendEmail({
      to: user.email,
      subject: 'BPC Canteen — Password Reset Request',
      html: `
        <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #FFFDF8; border-radius: 12px; overflow: hidden;">
          <div style="background: #7B1C1C; padding: 30px; text-align: center;">
            <h1 style="color: #D4A017; margin: 0; font-size: 24px;">Balaji Perfect Caters</h1>
            <p style="color: #FDF2F2; margin: 5px 0 0; font-size: 14px;">Canteen Billing System</p>
          </div>
          <div style="padding: 30px;">
            <h2 style="color: #1A1A1A; margin-top: 0;">Password Reset Request</h2>
            <p style="color: #4A4A4A; line-height: 1.6;">Hello <strong>${user.name}</strong>,</p>
            <p style="color: #4A4A4A; line-height: 1.6;">We received a request to reset your password. Click the button below to set a new password:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="display: inline-block; background: #7B1C1C; color: #FFFFFF; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">Reset Password</a>
            </div>
            <p style="color: #9A9A9A; font-size: 13px;">This link expires in 30 minutes. If you didn't request this, please ignore this email.</p>
          </div>
          <div style="background: #5A1212; padding: 15px; text-align: center;">
            <p style="color: #D4A017; margin: 0; font-size: 12px;">© ${new Date().getFullYear()} Balaji Perfect Caters. All rights reserved.</p>
          </div>
        </div>
      `,
    });

    res.status(200).json(new ApiResponse(200, null, 'Password reset link sent to your email.'));
  } catch (error) {
    // Clear reset token if email fails
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    throw new ApiError(500, 'Failed to send reset email. Please try again later.');
  }
});

/**
 * POST /api/v1/auth/reset-password/:token
 * Resets password using the token from email.
 */
export const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!password || password.length < 8) {
    throw new ApiError(400, 'Password must be at least 8 characters.');
  }

  // Hash the incoming token to compare with stored hash
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  }).select('+passwordResetToken +passwordResetExpires');

  if (!user) {
    throw new ApiError(400, 'Invalid or expired reset token.');
  }

  // Set new password and clear reset fields
  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  user.refreshToken = ''; // Invalidate all sessions
  await user.save();

  res.status(200).json(new ApiResponse(200, null, 'Password reset successful. Please log in with your new password.'));
});

/**
 * GET /api/v1/auth/me
 * Returns the currently authenticated user's profile.
 */
export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    throw new ApiError(404, 'User not found.');
  }

  res.status(200).json(new ApiResponse(200, user, 'User profile fetched successfully'));
});

/**
 * PUT /api/v1/auth/change-password
 * Changes password for the authenticated user.
 */
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    throw new ApiError(400, 'Current password and new password are required.');
  }

  if (newPassword.length < 8) {
    throw new ApiError(400, 'New password must be at least 8 characters.');
  }

  const user = await User.findById(req.user._id).select('+password');

  const isPasswordValid = await user.comparePassword(currentPassword);
  if (!isPasswordValid) {
    throw new ApiError(401, 'Current password is incorrect.');
  }

  user.password = newPassword;
  user.refreshToken = ''; // Invalidate all sessions — user will need to log in again
  await user.save();

  res.status(200).json(new ApiResponse(200, null, 'Password changed successfully. Please log in with your new password.'));
});
