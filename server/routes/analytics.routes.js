import express from 'express';
import {
  getSummary,
  getMonthlyRevenue,
  getTopItems,
  getPaymentStatus,
  getCustomerOutstanding,
} from '../controllers/analytics.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect);
router.use(authorize('admin'));

router.get('/summary', getSummary);
router.get('/monthly-revenue', getMonthlyRevenue);
router.get('/top-items', getTopItems);
router.get('/payment-status', getPaymentStatus);
router.get('/customer-outstanding', getCustomerOutstanding);

export default router;
