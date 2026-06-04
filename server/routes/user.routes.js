import express from 'express';
import { body } from 'express-validator';
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  resetUserPassword,
  getUserActivity,
} from '../controllers/user.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';
import validate from '../middleware/validate.middleware.js';

const router = express.Router();

// All routes require authentication and admin role
router.use(protect);
router.use(authorize('admin'));

const createUserValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('role').optional().isIn(['admin', 'employee']).withMessage('Role must be admin or employee'),
];

const updateUserValidation = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('email').optional().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('role').optional().isIn(['admin', 'employee']).withMessage('Role must be admin or employee'),
];

router.get('/', getAllUsers);
router.get('/:id', getUserById);
router.get('/:id/activity', getUserActivity);
router.post('/', createUserValidation, validate, createUser);
router.put('/:id', updateUserValidation, validate, updateUser);
router.put('/:id/reset-password', resetUserPassword);
router.delete('/:id', deleteUser);

export default router;
