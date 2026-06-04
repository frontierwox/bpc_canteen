import mongoose from 'mongoose';
import Bill from '../models/Bill.model.js';
import Customer from '../models/Customer.model.js';
import MenuItem from '../models/MenuItem.model.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

/**
 * GET /api/v1/analytics/summary
 * Overview stats: revenue, bills, customers, outstanding.
 */
export const getSummary = asyncHandler(async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);

  const [
    todayStats,
    monthStats,
    pendingStats,
    activeCustomers,
    menuItemCount,
    outstandingTotal,
  ] = await Promise.all([
    // Today's revenue
    Bill.aggregate([
      { $match: { billDate: { $gte: today, $lt: tomorrow }, isVoid: false } },
      { $group: { _id: null, revenue: { $sum: '$totalAmount' }, count: { $sum: 1 } } },
    ]),
    // This month's revenue
    Bill.aggregate([
      { $match: { billDate: { $gte: monthStart, $lte: monthEnd }, isVoid: false } },
      { $group: { _id: null, revenue: { $sum: '$totalAmount' }, count: { $sum: 1 } } },
    ]),
    // Pending bills
    Bill.aggregate([
      { $match: { paymentStatus: { $in: ['pending', 'partial'] }, isVoid: false } },
      { $group: { _id: null, amount: { $sum: '$balanceDue' }, count: { $sum: 1 } } },
    ]),
    // Active customers
    Customer.countDocuments({ isActive: true }),
    // Menu items
    MenuItem.countDocuments({ isAvailable: true }),
    // Total outstanding
    Customer.aggregate([
      { $match: { outstandingBalance: { $gt: 0 } } },
      { $group: { _id: null, total: { $sum: '$outstandingBalance' } } },
    ]),
  ]);

  res.status(200).json(
    new ApiResponse(200, {
      todayRevenue: todayStats[0]?.revenue || 0,
      todayBills: todayStats[0]?.count || 0,
      monthRevenue: monthStats[0]?.revenue || 0,
      monthBills: monthStats[0]?.count || 0,
      pendingAmount: pendingStats[0]?.amount || 0,
      pendingBills: pendingStats[0]?.count || 0,
      activeCustomers,
      menuItemCount,
      outstandingDues: outstandingTotal[0]?.total || 0,
    }, 'Summary fetched successfully')
  );
});

/**
 * GET /api/v1/analytics/monthly-revenue
 * Revenue data for the last 12 months — for line chart.
 */
export const getMonthlyRevenue = asyncHandler(async (req, res) => {
  const now = new Date();
  const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

  const revenue = await Bill.aggregate([
    {
      $match: {
        billDate: { $gte: twelveMonthsAgo },
        isVoid: false,
      },
    },
    {
      $group: {
        _id: {
          year: { $year: '$billDate' },
          month: { $month: '$billDate' },
        },
        revenue: { $sum: '$totalAmount' },
        bills: { $sum: 1 },
        paid: { $sum: '$paidAmount' },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

  // Fill gaps for months with no data
  const result = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const existing = revenue.find((r) => r._id.year === year && r._id.month === month);

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    result.push({
      month: monthNames[month - 1],
      year,
      label: `${monthNames[month - 1]} ${year}`,
      revenue: existing?.revenue || 0,
      bills: existing?.bills || 0,
      paid: existing?.paid || 0,
    });
  }

  res.status(200).json(new ApiResponse(200, result, 'Monthly revenue fetched successfully'));
});

/**
 * GET /api/v1/analytics/top-items
 * Top 10 selling menu items — for bar chart.
 */
export const getTopItems = asyncHandler(async (req, res) => {
  const topItems = await Bill.aggregate([
    { $match: { isVoid: false } },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.name',
        totalQuantity: { $sum: '$items.quantity' },
        totalRevenue: { $sum: '$items.totalPrice' },
        orderCount: { $sum: 1 },
      },
    },
    { $sort: { totalQuantity: -1 } },
    { $limit: 10 },
    {
      $project: {
        name: '$_id',
        totalQuantity: 1,
        totalRevenue: 1,
        orderCount: 1,
        _id: 0,
      },
    },
  ]);

  res.status(200).json(new ApiResponse(200, topItems, 'Top items fetched successfully'));
});

/**
 * GET /api/v1/analytics/payment-status
 * Payment status distribution — for pie chart.
 */
export const getPaymentStatus = asyncHandler(async (req, res) => {
  const statuses = await Bill.aggregate([
    { $match: { isVoid: false } },
    {
      $group: {
        _id: '$paymentStatus',
        count: { $sum: 1 },
        amount: { $sum: '$totalAmount' },
      },
    },
  ]);

  const statusColors = {
    paid: '#2D7A3A',
    pending: '#C97B00',
    partial: '#D4A017',
    cancelled: '#C0392B',
  };

  const result = statuses.map((s) => ({
    status: s._id,
    count: s.count,
    amount: s.amount,
    color: statusColors[s._id] || '#9A9A9A',
  }));

  res.status(200).json(new ApiResponse(200, result, 'Payment status fetched successfully'));
});

/**
 * GET /api/v1/analytics/customer-outstanding
 * Customers with outstanding balances — for table display.
 */
export const getCustomerOutstanding = asyncHandler(async (req, res) => {
  const customers = await Customer.find({ outstandingBalance: { $gt: 0 }, isActive: true })
    .select('name organization department outstandingBalance phone')
    .sort({ outstandingBalance: -1 })
    .lean();

  res.status(200).json(new ApiResponse(200, customers, 'Outstanding balances fetched successfully'));
});
