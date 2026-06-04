import express from 'express';
import { body } from 'express-validator';
import {
  getPublicMenu,
  getPublicMenuByCategory,
  getAllMenuItems,
  getMenuItemById,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  setSpecialPrice,
  toggleAvailability,
} from '../controllers/menu.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';
import validate from '../middleware/validate.middleware.js';
import upload from '../middleware/upload.middleware.js';

const router = express.Router();

// Public routes (no auth required)
router.get('/public', getPublicMenu);
router.get('/public/:categoryId', getPublicMenuByCategory);

// Protected routes
router.get('/', protect, getAllMenuItems);
router.get('/:id', protect, getMenuItemById);

// Admin only routes
router.post(
  '/',
  protect,
  authorize('admin'),
  upload.single('image'),
  [
    body('name').trim().notEmpty().withMessage('Item name is required'),
    body('category').notEmpty().withMessage('Category is required'),
    body('basePrice').isFloat({ min: 0 }).withMessage('Base price must be a positive number'),
  ],
  validate,
  createMenuItem
);

router.put(
  '/:id',
  protect,
  authorize('admin'),
  upload.single('image'),
  updateMenuItem
);

router.delete('/:id', protect, authorize('admin'), deleteMenuItem);

router.put(
  '/:id/special-price',
  protect,
  authorize('admin'),
  [body('price').isFloat({ min: 0 }).withMessage('Special price must be a positive number')],
  validate,
  setSpecialPrice
);

router.put(
  '/:id/toggle-availability',
  protect,
  authorize('admin', 'employee'),
  toggleAvailability
);

export default router;
