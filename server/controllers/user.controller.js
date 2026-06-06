import User from '../models/User.model.js';
import Bill from '../models/Bill.model.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

/**
 * GET /api/v1/users
 * Returns all users (admin only). Supports search and role filter.
 */
export const getAllUsers = asyncHandler(async (req, res) => {
  const { search, role, isActive, page = 1, limit = 20 } = req.query;

  const filter = {};

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  if (role) filter.role = role;
  if (isActive !== undefined) filter.isActive = isActive === 'true';

  const skip = (Number(page) - 1) * Number(limit);

  const [users, total] = await Promise.all([
    User.find(filter)
      .select('-refreshToken')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    User.countDocuments(filter),
  ]);

  res.status(200).json(
    new ApiResponse(200, {
      users,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    }, 'Users fetched successfully')
  );
});

/**
 * GET /api/v1/users/:id
 * Returns a single user by ID.
 */
export const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-refreshToken');

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  res.status(200).json(new ApiResponse(200, user, 'User fetched successfully'));
});

/**
 * POST /api/v1/users
 * Creates a new user (admin only).
 */
export const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, phone } = req.body;

  // Check if email already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(409, 'A user with this email already exists.');
  }

  const user = await User.create({
    name,
    email,
    password,
    role: role || 'employee',
    phone,
    createdBy: req.user._id,
  });

  // Remove password from response
  const userResponse = user.toObject();
  delete userResponse.password;
  delete userResponse.refreshToken;

  res.status(201).json(new ApiResponse(201, userResponse, 'User created successfully'));
});

/**
 * PUT /api/v1/users/:id
 * Updates a user (admin only). Cannot update password via this route.
 */
export const updateUser = asyncHandler(async (req, res) => {
  const { name, email, role, phone, isActive } = req.body;

  const user = await User.findById(req.params.id);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  // Prevent admin from deactivating themselves
  if (req.user._id.toString() === req.params.id && isActive === false) {
    throw new ApiError(400, 'You cannot deactivate your own account.');
  }

  // Check email uniqueness if changed
  if (email && email !== user.email) {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new ApiError(409, 'A user with this email already exists.');
    }
  }

  if (name) user.name = name;
  if (email) user.email = email;
  if (role) user.role = role;
  if (phone !== undefined) user.phone = phone;
  if (isActive !== undefined) user.isActive = isActive;

  await user.save({ validateBeforeSave: true });

  const userResponse = user.toObject();
  delete userResponse.password;
  delete userResponse.refreshToken;

  res.status(200).json(new ApiResponse(200, userResponse, 'User updated successfully'));
});

/**
 * DELETE /api/v1/users/:id
 * Permanently deletes a user (admin only).
 */
export const deleteUser = asyncHandler(async (req, res) => {
  if (req.user._id.toString() === req.params.id) {
    throw new ApiError(400, 'You cannot delete your own account.');
  }

  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  res.status(200).json(new ApiResponse(200, null, 'User deleted successfully'));
});

/**
 * PUT /api/v1/users/:id/reset-password
 * Admin resets another user's password.
 */
export const resetUserPassword = asyncHandler(async (req, res) => {
  const { newPassword } = req.body;

  if (!newPassword || newPassword.length < 8) {
    throw new ApiError(400, 'New password must be at least 8 characters.');
  }

  const user = await User.findById(req.params.id);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  user.password = newPassword;
  user.refreshToken = ''; // Force re-login
  await user.save();

  res.status(200).json(new ApiResponse(200, null, 'Password reset successfully'));
});

/**
 * GET /api/v1/users/:id/activity
 * Returns bill activity for a specific user.
 */
export const getUserActivity = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const user = await User.findById(req.params.id).select('name email role');
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const [bills, total] = await Promise.all([
    Bill.find({ createdBy: req.params.id })
      .populate('customer', 'name organization')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Bill.countDocuments({ createdBy: req.params.id }),
  ]);

  res.status(200).json(
    new ApiResponse(200, {
      user,
      bills,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    }, 'User activity fetched successfully')
  );
});
