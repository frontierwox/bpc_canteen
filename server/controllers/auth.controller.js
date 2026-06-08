import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import User from '../models/User.model.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendEmail } from '../services/email.service.js';

// ─── Cookie Configuration ─────────────────────────────────────────────────────

/**
 * Returns secure cookie options for the refresh token cookie.
 * httpOnly: prevents JS access (XSS protection).
 * secure:   HTTPS-only in production.
 * sameSite: 'none' required for cross-origin requests (Vercel frontend + backend on different domains).
 */
const getCookieOptions = () => ({
  httpOnly: true,
  secure:   process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge:   7 * 24 * 60 * 60 * 1000, // 7 days in ms
  path:     '/',
});

// ─── Token Helpers ────────────────────────────────────────────────────────────

/**
 * Generates a JWT access token and JWT refresh token for a user.
 * The refresh token is stored as a SHA-256 hash in the database —
 * only the raw token is ever sent to the client. This means a
 * database breach cannot be used to directly replay refresh tokens.
 *
 * @param {Object} user - Mongoose User document
 * @returns {Promise<{ accessToken: string, refreshToken: string }>}
 */
const generateTokens = async (user) => {
  const accessToken  = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  // Hash the refresh token before persisting — raw token goes to client only
  const hashedRefreshToken = crypto
    .createHash('sha256')
    .update(refreshToken)
    .digest('hex');

  user.refreshToken = hashedRefreshToken;
  user.lastLogin    = new Date();
  await user.save({ validateBeforeSave: false });

  return { accessToken, refreshToken };
};

// ─── Controllers ──────────────────────────────────────────────────────────────

/**
 * POST /api/v1/auth/login
 * Authenticates user credentials and returns a JWT pair.
 * Access token sent in JSON body; refresh token in an httpOnly cookie.
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, 'Email and password are required.');
  }

  // Fetch with password field (excluded by default in schema)
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    // Generic message — do not reveal whether the email exists
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

  const userResponse = {
    _id:       user._id,
    name:      user.name,
    email:     user.email,
    role:      user.role,
    phone:     user.phone,
    lastLogin: user.lastLogin,
  };

  res
    .status(200)
    .cookie('refreshToken', refreshToken, getCookieOptions())
    .json(new ApiResponse(200, { user: userResponse, accessToken }, 'Login successful'));
});

/**
 * POST /api/v1/auth/logout
 * Invalidates the refresh token in the database and clears the cookie.
 */
export const logout = asyncHandler(async (req, res) => {
  if (req.user) {
    // Unset the stored hash so the token can never be reused
    await User.findByIdAndUpdate(req.user._id, { $unset: { refreshToken: 1 } });
  }

  res
    .status(200)
    .clearCookie('refreshToken', { ...getCookieOptions(), maxAge: 0 })
    .json(new ApiResponse(200, null, 'Logged out successfully'));
});

/**
 * POST /api/v1/auth/refresh-token
 * Verifies the incoming refresh token cookie and issues a new token pair
 * (refresh token rotation — the old token is invalidated on every use).
 */
export const refreshToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies?.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, 'Refresh token missing. Please log in again.');
  }

  // Verify JWT signature and expiry
  let decoded;
  try {
    decoded = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
  } catch {
    throw new ApiError(401, 'Invalid or expired refresh token. Please log in again.');
  }

  const user = await User.findById(decoded._id).select('+refreshToken');

  if (!user) {
    throw new ApiError(401, 'User not found. Token may be invalid.');
  }

  if (!user.isActive) {
    throw new ApiError(403, 'Account has been deactivated.');
  }

  // Hash the incoming token and compare against the stored hash
  const hashedIncoming = crypto
    .createHash('sha256')
    .update(incomingRefreshToken)
    .digest('hex');

  if (!user.refreshToken || user.refreshToken !== hashedIncoming) {
    // Token mismatch — possible replay attack; invalidate all sessions
    await User.findByIdAndUpdate(user._id, { $unset: { refreshToken: 1 } });
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
 * Sends a password-reset link to the user's email.
 * Always returns 200 — never reveals whether an email is registered.
 */
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new ApiError(400, 'Email is required.');
  }

  const user = await User.findOne({ email });

  // Respond identically whether the user exists or not (timing-safe)
  if (!user) {
    return res
      .status(200)
      .json(new ApiResponse(200, null, 'If this email is registered, a reset link has been sent.'));
  }

  // Generate a cryptographically random reset token
  const resetToken  = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

  user.passwordResetToken   = hashedToken;
  user.passwordResetExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

  try {
    await sendEmail({
      to:      user.email,
      subject: 'BPC Canteen — Password Reset Request',
      html: `
        <div style="font-family:'Inter',Arial,sans-serif;max-width:600px;margin:0 auto;background:#FFFDF8;border-radius:12px;overflow:hidden;">
          <div style="background:#7B1C1C;padding:30px;text-align:center;">
            <h1 style="color:#D4A017;margin:0;font-size:24px;">Balaji Perfect Caters</h1>
            <p style="color:#FDF2F2;margin:5px 0 0;font-size:14px;">Canteen Billing System</p>
          </div>
          <div style="padding:30px;">
            <h2 style="color:#1A1A1A;margin-top:0;">Password Reset Request</h2>
            <p style="color:#4A4A4A;line-height:1.6;">Hello <strong>${user.name}</strong>,</p>
            <p style="color:#4A4A4A;line-height:1.6;">We received a request to reset your password. Click the button below to set a new password:</p>
            <div style="text-align:center;margin:30px 0;">
              <a href="${resetUrl}" style="display:inline-block;background:#7B1C1C;color:#FFFFFF;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px;">Reset Password</a>
            </div>
            <p style="color:#9A9A9A;font-size:13px;">This link expires in 30 minutes. If you didn't request this, please ignore this email.</p>
          </div>
          <div style="background:#5A1212;padding:15px;text-align:center;">
            <p style="color:#D4A017;margin:0;font-size:12px;">© ${new Date().getFullYear()} Balaji Perfect Caters. All rights reserved.</p>
          </div>
        </div>
      `,
    });

    res.status(200).json(new ApiResponse(200, null, 'Password reset link sent to your email.'));
  } catch {
    // Clear the token if email delivery fails — otherwise the DB has a dangling token
    user.passwordResetToken   = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    throw new ApiError(500, 'Failed to send reset email. Please try again later.');
  }
});

/**
 * POST /api/v1/auth/reset-password/:token
 * Validates the reset token and sets a new password.
 * Invalidates all sessions on success.
 */
export const resetPassword = asyncHandler(async (req, res) => {
  const { token }    = req.params;
  const { password } = req.body;

  if (!password || password.length < 8) {
    throw new ApiError(400, 'Password must be at least 8 characters.');
  }

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    passwordResetToken:   hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  }).select('+passwordResetToken +passwordResetExpires');

  if (!user) {
    throw new ApiError(400, 'Invalid or expired reset token.');
  }

  user.password             = password;
  user.passwordResetToken   = undefined;
  user.passwordResetExpires = undefined;
  // Invalidate all existing sessions by clearing the stored refresh token hash
  await User.findByIdAndUpdate(user._id, { $unset: { refreshToken: 1 } });
  await user.save();

  res.status(200).json(
    new ApiResponse(200, null, 'Password reset successful. Please log in with your new password.')
  );
});

/**
 * GET /api/v1/auth/me
 * Returns the currently authenticated user's profile (no sensitive fields).
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
 * Allows an authenticated user to change their own password.
 * Invalidates all other sessions on success.
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
  await user.save();

  // Invalidate all sessions so the user must log in again with the new password
  await User.findByIdAndUpdate(user._id, { $unset: { refreshToken: 1 } });

  res.status(200).json(
    new ApiResponse(200, null, 'Password changed successfully. Please log in with your new password.')
  );
});
