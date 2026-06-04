import express from 'express';
import { body } from 'express-validator';
import {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/category.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';
import validate from '../middleware/validate.middleware.js';

const router = express.Router();

// Public-ish: categories list needed by public menu too
router.get('/', getAllCategories);

// Admin only
router.post(
  '/',
  protect,
  authorize('admin'),
  [body('name').trim().notEmpty().withMessage('Category name is required')],
  validate,
  createCategory
);

router.put(
  '/:id',
  protect,
  authorize('admin'),
  updateCategory
);

router.delete('/:id', protect, authorize('admin'), deleteCategory);

export default router;
