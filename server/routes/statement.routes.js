import express from 'express';
import { body } from 'express-validator';
import {
  getAllStatements,
  getStatementById,
  getStatementPDF,
  getCustomerStatements,
  generateStatement,
  regenerateStatement,
  markStatementPaid,
  validateStatement,
  deleteStatement,
} from '../controllers/statement.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';
import validate from '../middleware/validate.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// ── Read routes ───────────────────────────────────────────────────────────────
router.get('/',                        getAllStatements);
router.get('/customer/:customerId',    getCustomerStatements);
router.get('/:id',                     getStatementById);
router.get('/:id/pdf',                 getStatementPDF);
router.get('/:id/validate',            authorize('admin'), validateStatement);

// ── Generate / Regenerate ─────────────────────────────────────────────────────
router.post(
  '/generate',
  authorize('admin', 'employee'),
  [
    body('customerId').notEmpty().withMessage('Customer ID is required'),
    body('month').isInt({ min: 1, max: 12 }).withMessage('Month must be 1-12'),
    body('year').isInt({ min: 2020 }).withMessage('Year must be 2020 or later'),
    body('forceRegenerate').optional().isBoolean().withMessage('forceRegenerate must be boolean'),
  ],
  validate,
  generateStatement
);

router.post('/:id/regenerate', authorize('admin'), regenerateStatement);

// ── Update routes ─────────────────────────────────────────────────────────────
router.put(
  '/:id/mark-paid',
  authorize('admin'),
  [
    body('amount').optional().isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  ],
  validate,
  markStatementPaid
);

// ── Delete ────────────────────────────────────────────────────────────────────
router.delete('/:id', authorize('admin'), deleteStatement);

export default router;
