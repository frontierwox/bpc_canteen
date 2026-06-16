import express from 'express';
import { body } from 'express-validator';
import {
  createQuotation,
  getAllQuotations,
  getQuotationById,
  getQuotationPDF,
  convertToInvoice,
  updateQuotationStatus,
  deleteQuotation,
} from '../controllers/quotation.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';
import validate from '../middleware/validate.middleware.js';

const router = express.Router();

router.use(protect);
router.use(authorize('admin'));

// ─── Validation ───────────────────────────────────────────────────────────────

const createQuotationValidation = [
  body('customer').notEmpty().withMessage('Customer ID is required'),
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.name').trim().notEmpty().withMessage('Item name is required'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('items.*.unitPrice').isFloat({ min: 0.01 }).withMessage('Unit price must be positive'),
  body('cgst').optional().isFloat({ min: 0, max: 50 }).withMessage('CGST must be between 0 and 50'),
  body('sgst').optional().isFloat({ min: 0, max: 50 }).withMessage('SGST must be between 0 and 50'),
  body('discountAmount').optional().isFloat({ min: 0 }).withMessage('Discount cannot be negative'),
  body('notes').optional().trim().isLength({ max: 2000 }).withMessage('Notes cannot exceed 2000 characters'),
  body('termsAndConditions').optional().trim().isLength({ max: 3000 }).withMessage('Terms cannot exceed 3000 characters'),
  body('eventLocation').optional().trim().isLength({ max: 500 }).withMessage('Event location cannot exceed 500 characters'),
  body('serviceVenue').optional().trim().isLength({ max: 500 }).withMessage('Service venue cannot exceed 500 characters'),
];

const updateStatusValidation = [
  body('status')
    .isIn(['draft', 'sent', 'accepted', 'rejected', 'expired'])
    .withMessage('Invalid status'),
];

// ─── Routes ───────────────────────────────────────────────────────────────────

router.post('/', createQuotationValidation, validate, createQuotation);
router.get('/', getAllQuotations);
router.get('/:id', getQuotationById);
router.get('/:id/pdf', getQuotationPDF);
router.post('/:id/convert', convertToInvoice);
router.patch('/:id/status', updateStatusValidation, validate, updateQuotationStatus);
router.delete('/:id', deleteQuotation);

export default router;
