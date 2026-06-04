import express from 'express';
import { body } from 'express-validator';
import {
  getAllCustomers,
  getCustomerById,
  getCustomerBalance,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from '../controllers/customer.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';
import validate from '../middleware/validate.middleware.js';

const router = express.Router();

router.use(protect);

const createCustomerValidation = [
  body('name').trim().notEmpty().withMessage('Customer name is required'),
  body('accountType')
    .optional()
    .isIn(['immediate', 'monthly_credit'])
    .withMessage('Account type must be immediate or monthly_credit'),
  body('email').optional().isEmail().withMessage('Valid email required').normalizeEmail(),
];

router.get('/', getAllCustomers);
router.get('/:id', getCustomerById);
router.get('/:id/balance', getCustomerBalance);
router.post('/', authorize('admin', 'employee'), createCustomerValidation, validate, createCustomer);
router.put('/:id', authorize('admin'), updateCustomer);
router.delete('/:id', authorize('admin'), deleteCustomer);

export default router;
