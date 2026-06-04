import express from 'express';
import { body } from 'express-validator';
import {
  getAllStatements,
  getStatementById,
  getStatementPDF,
  getCustomerStatements,
  generateStatement,
  markStatementPaid,
  deleteStatement,
} from '../controllers/statement.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';
import validate from '../middleware/validate.middleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getAllStatements);
router.get('/:id', getStatementById);
router.get('/:id/pdf', getStatementPDF);
router.get('/customer/:customerId', getCustomerStatements);

router.post(
  '/generate',
  authorize('admin', 'employee'),
  [
    body('customerId').notEmpty().withMessage('Customer ID is required'),
    body('month').isInt({ min: 1, max: 12 }).withMessage('Month must be 1-12'),
    body('year').isInt({ min: 2020 }).withMessage('Year must be 2020 or later'),
  ],
  validate,
  generateStatement
);

router.put('/:id/mark-paid', authorize('admin'), markStatementPaid);
router.delete('/:id', authorize('admin'), deleteStatement);

export default router;
