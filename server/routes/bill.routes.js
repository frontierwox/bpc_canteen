import express    from 'express';
import { body }   from 'express-validator';
import {
  getAllBills,
  getBillById,
  getBillPDF,
  getCustomerBills,
  createBill,
  updateBill,
  recordPayment,
  voidBill,
} from '../controllers/bill.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';
import validate from '../middleware/validate.middleware.js';

const router = express.Router();

// All bill routes require authentication
router.use(protect);

// ─── Validation Schemas ───────────────────────────────────────────────────────

const createBillValidation = [
  body('customer')
    .notEmpty().withMessage('Customer is required'),
  body('billType')
    .isIn(['immediate', 'monthly_credit'])
    .withMessage('Bill type must be immediate or monthly_credit'),
  body('items')
    .isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.quantity')
    .isInt({ min: 1 }).withMessage('Item quantity must be at least 1'),
  body('items.*.unitPrice')
    .optional()
    .isFloat({ min: 0.01 }).withMessage('Item unit price must be positive'),
  body('taxRate')
    .optional()
    .isFloat({ min: 0, max: 100 }).withMessage('Tax rate must be between 0 and 100'),
  body('discountAmount')
    .optional()
    .isFloat({ min: 0 }).withMessage('Discount amount cannot be negative'),
];

const updateBillValidation = [
  body('items')
    .optional()
    .isArray({ min: 1 }).withMessage('Items must be a non-empty array'),
  body('items.*.quantity')
    .optional()
    .isInt({ min: 1 }).withMessage('Item quantity must be at least 1'),
  body('items.*.unitPrice')
    .optional()
    .isFloat({ min: 0.01 }).withMessage('Item unit price must be positive'),
  body('items.*.name')
    .optional()
    .trim()
    .notEmpty().withMessage('Item name cannot be empty'),
  body('taxRate')
    .optional()
    .isFloat({ min: 0, max: 100 }).withMessage('Tax rate must be between 0 and 100'),
  body('discountAmount')
    .optional()
    .isFloat({ min: 0 }).withMessage('Discount amount cannot be negative'),
];

const paymentValidation = [
  body('amount')
    .isFloat({ min: 0.01 }).withMessage('Payment amount must be greater than 0'),
  body('paymentMethod')
    .optional()
    .isIn(['cash', 'upi', 'bank_transfer', 'credit', 'other'])
    .withMessage('Invalid payment method'),
];

// ─── Routes ───────────────────────────────────────────────────────────────────
// IMPORTANT: Specific static routes (/customer/:id) MUST be registered before
// parametric routes (/:id) to prevent Express matching "customer" as an ObjectId.

router.get('/',                         getAllBills);
router.get('/customer/:customerId',     getCustomerBills);        // ← before /:id
router.get('/:id',                      getBillById);
router.get('/:id/pdf',                  getBillPDF);

router.post('/',                        createBillValidation, validate, createBill);
router.put('/:id',                      updateBillValidation, validate, updateBill);
router.put('/:id/payment',             paymentValidation,    validate, recordPayment);
router.delete('/:id/void',             authorize('admin'),          voidBill);

export default router;
