import express from 'express';
import {
  getSettings,
  updateSettings,
  getMenuQR,
  uploadLogo,
} from '../controllers/settings.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';
import upload from '../middleware/upload.middleware.js';

const router = express.Router();

router.get('/', protect, getSettings);
router.get('/qr', protect, getMenuQR);
router.put('/', protect, authorize('admin'), updateSettings);
router.post('/logo', protect, authorize('admin'), upload.single('logo'), uploadLogo);

export default router;
