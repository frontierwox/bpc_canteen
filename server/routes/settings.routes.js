import express from 'express';
import { body } from 'express-validator';
import {
  getSettings,
  updateSettings,
  getMenuQR,
  uploadLogo,
} from '../controllers/settings.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';
import upload from '../middleware/upload.middleware.js';
import validate from '../middleware/validate.middleware.js';

const router = express.Router();

// ─── Validation ───────────────────────────────────────────────────────────────

const updateSettingsValidation = [
  body('businessName').optional().trim().notEmpty().withMessage('Business name cannot be empty'),
  body('defaultTaxRate')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Tax rate must be between 0 and 100'),
  body('email').optional().isEmail().withMessage('Valid email required').normalizeEmail(),
  body('gstin').optional().trim().notEmpty().withMessage('GSTIN cannot be empty'),
  body('invoicePrefix').optional().trim().notEmpty().withMessage('Invoice prefix cannot be empty'),
];

// ─── Routes ───────────────────────────────────────────────────────────────────

router.get('/', protect, getSettings);
router.get('/qr', protect, getMenuQR);
router.put('/', protect, authorize('admin'), updateSettingsValidation, validate, updateSettings);
router.post('/logo', protect, authorize('admin'), upload.single('logo'), uploadLogo);

export default router;
