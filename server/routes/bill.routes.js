import express from 'express';
import { body } from 'express-validator';
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

router.use(protect);

const createBillValidation = [
  body('customer').notEmpty().withMessage('Customer is required'),
  body('billType')
    .isIn(['immediate', 'monthly_credit'])
    .withMessage('Bill type must be immediate or monthly_credit'),
  body('items')
    .isArray({ min: 1 })
    .withMessage('At least one item is required'),
  body('items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1'),
];

const paymentValidation = [
  body('amount').isFloat({ min: 0.01 }).withMessage('Payment amount must be greater than 0'),
];

router.get('/', getAllBills);
router.get('/:id', getBillById);
router.get('/:id/pdf', getBillPDF);
router.get('/customer/:customerId', getCustomerBills);
router.post('/', createBillValidation, validate, createBill);
router.put('/:id', updateBill);
router.put('/:id/payment', paymentValidation, validate, recordPayment);
router.delete('/:id/void', authorize('admin'), voidBill);

export default router;
