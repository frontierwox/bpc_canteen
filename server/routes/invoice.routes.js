import express from 'express';
import { body } from 'express-validator';
import {
  createInvoice,
  getAllInvoices,
  getInvoiceById,
  getInvoicePDF,
  deleteInvoice,
} from '../controllers/invoice.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';
import validate from '../middleware/validate.middleware.js';

const router = express.Router();

router.use(protect);
router.use(authorize('admin'));

// ─── Validation ───────────────────────────────────────────────────────────────

const createInvoiceValidation = [
  body('customer').notEmpty().withMessage('Customer ID is required'),
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.name').trim().notEmpty().withMessage('Item name is required'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('items.*.unitPrice').isFloat({ min: 0.01 }).withMessage('Unit price must be positive'),
  body('cgst').optional().isFloat({ min: 0, max: 50 }).withMessage('CGST must be between 0 and 50'),
  body('sgst').optional().isFloat({ min: 0, max: 50 }).withMessage('SGST must be between 0 and 50'),
  body('discountAmount').optional().isFloat({ min: 0 }).withMessage('Discount cannot be negative'),
  body('notes').optional().trim().isLength({ max: 2000 }).withMessage('Notes cannot exceed 2000 characters'),
  body('settlementDetails.settledByName').optional().trim().isLength({ max: 150 }),
  body('settlementDetails.settledByPhone').optional().trim(),
  body('settlementDetails.settledByCompany').optional().trim().isLength({ max: 200 }),
];

// ─── Routes ───────────────────────────────────────────────────────────────────

router.post('/', createInvoiceValidation, validate, createInvoice);
router.get('/', getAllInvoices);
router.get('/:id', getInvoiceById);
router.get('/:id/pdf', getInvoicePDF);
router.delete('/:id', deleteInvoice);

export default router;
