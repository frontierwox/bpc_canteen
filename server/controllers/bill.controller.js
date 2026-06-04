import Bill from '../models/Bill.model.js';
import Customer from '../models/Customer.model.js';
import MenuItem from '../models/MenuItem.model.js';
import Settings from '../models/Settings.model.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import { generateInvoiceNumber } from '../utils/invoiceNumber.js';
import { generateBillPDF } from '../services/pdf.service.js';

/**
 * GET /api/v1/bills
 * Admin: all bills. Employee: only own bills. Supports filters.
 */
export const getAllBills = asyncHandler(async (req, res) => {
  const {
    search, customer, billType, paymentStatus, startDate, endDate,
    page = 1, limit = 20, sortBy = 'createdAt', order = 'desc',
  } = req.query;

  const filter = { isVoid: false };

  // Employee sees only their own bills
  if (req.user.role === 'employee') {
    filter.createdBy = req.user._id;
  }

  if (search) {
    filter.$or = [
      { billNumber: { $regex: search, $options: 'i' } },
      { notes: { $regex: search, $options: 'i' } },
    ];
  }

  if (customer) filter.customer = customer;
  if (billType) filter.billType = billType;
  if (paymentStatus) filter.paymentStatus = paymentStatus;

  if (startDate || endDate) {
    filter.billDate = {};
    if (startDate) filter.billDate.$gte = new Date(startDate);
    if (endDate) filter.billDate.$lte = new Date(new Date(endDate).setHours(23, 59, 59, 999));
  }

  const skip = (Number(page) - 1) * Number(limit);
  const sortOrder = order === 'asc' ? 1 : -1;

  const [bills, total] = await Promise.all([
    Bill.find(filter)
      .populate('customer', 'name organization department accountType')
      .populate('createdBy', 'name email')
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Bill.countDocuments(filter),
  ]);

  res.status(200).json(
    new ApiResponse(200, {
      bills,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    }, 'Bills fetched successfully')
  );
});

/**
 * GET /api/v1/bills/:id
 * Returns full bill detail with populated references.
 */
export const getBillById = asyncHandler(async (req, res) => {
  const bill = await Bill.findById(req.params.id)
    .populate('customer', 'name organization department phone email address accountType')
    .populate('createdBy', 'name email')
    .populate('voidedBy', 'name email')
    .lean();

  if (!bill) {
    throw new ApiError(404, 'Bill not found');
  }

  // Employee can only view their own bills
  if (req.user.role === 'employee' && bill.createdBy._id.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'You can only view your own bills.');
  }

  res.status(200).json(new ApiResponse(200, bill, 'Bill fetched successfully'));
});

/**
 * GET /api/v1/bills/:id/pdf
 * Generates and downloads the bill as a PDF.
 */
export const getBillPDF = asyncHandler(async (req, res) => {
  const bill = await Bill.findById(req.params.id)
    .populate('customer', 'name organization department phone email address accountType')
    .populate('createdBy', 'name')
    .lean();

  if (!bill) {
    throw new ApiError(404, 'Bill not found');
  }

  const settings = await Settings.getSettings();

  const pdfType = bill.billType === 'monthly_credit' ? 'monthly' : 'invoice';
  const pdfBuffer = await generateBillPDF(bill, settings, pdfType);

  res.set({
    'Content-Type': 'application/pdf',
    'Content-Disposition': `inline; filename="${bill.billNumber}.pdf"`,
    'Content-Length': pdfBuffer.length,
  });

  res.send(pdfBuffer);
});

/**
 * GET /api/v1/bills/customer/:customerId
 * Returns all bills for a specific customer.
 */
export const getCustomerBills = asyncHandler(async (req, res) => {
  const { startDate, endDate, billType, paymentStatus, page = 1, limit = 50 } = req.query;

  const customer = await Customer.findById(req.params.customerId);
  if (!customer) {
    throw new ApiError(404, 'Customer not found');
  }

  const filter = { customer: req.params.customerId, isVoid: false };

  if (billType) filter.billType = billType;
  if (paymentStatus) filter.paymentStatus = paymentStatus;
  if (startDate || endDate) {
    filter.billDate = {};
    if (startDate) filter.billDate.$gte = new Date(startDate);
    if (endDate) filter.billDate.$lte = new Date(new Date(endDate).setHours(23, 59, 59, 999));
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [bills, total] = await Promise.all([
    Bill.find(filter)
      .populate('createdBy', 'name')
      .sort({ billDate: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Bill.countDocuments(filter),
  ]);

  res.status(200).json(
    new ApiResponse(200, {
      customer,
      bills,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    }, 'Customer bills fetched successfully')
  );
});

/**
 * POST /api/v1/bills
 * Creates a new bill. Core billing logic — handles immediate and monthly credit.
 */
export const createBill = asyncHandler(async (req, res) => {
  const {
    customer: customerId, billType, serviceDate, items,
    taxRate, discountAmount, paymentMethod, notes,
  } = req.body;

  // Validate customer
  const customer = await Customer.findById(customerId);
  if (!customer) {
    throw new ApiError(404, 'Customer not found');
  }

  if (!customer.isActive) {
    throw new ApiError(400, 'Cannot create bill for inactive customer.');
  }

  // Validate items
  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new ApiError(400, 'At least one item is required.');
  }

  // Fetch settings for tax rate default
  const settings = await Settings.getSettings();

  // Build bill items with price snapshots
  const billItems = [];
  for (const item of items) {
    let menuItem = null;
    let unitPrice = item.unitPrice;
    let name = item.name;
    let unit = item.unit || 'NOS';

    if (item.menuItem) {
      menuItem = await MenuItem.findById(item.menuItem);
      if (menuItem) {
        name = menuItem.name;
        unit = menuItem.unit;
        // Use effective price (considers special pricing)
        unitPrice = getEffectivePrice(menuItem);
      }
    }

    if (!name || !unitPrice || !item.quantity) {
      throw new ApiError(400, `Invalid item data: name, quantity, and price are required.`);
    }

    const quantity = Number(item.quantity);
    const price = Number(unitPrice);

    billItems.push({
      menuItem: menuItem?._id || item.menuItem,
      name,
      quantity,
      unit,
      unitPrice: price,
      totalPrice: Math.round(quantity * price * 100) / 100,
    });
  }

  // Calculate totals
  const subtotal = billItems.reduce((sum, item) => sum + item.totalPrice, 0);
  const effectiveTaxRate = taxRate !== undefined ? Number(taxRate) : settings.defaultTaxRate;
  const taxAmount = Math.round(subtotal * (effectiveTaxRate / 100) * 100) / 100;
  const discount = discountAmount ? Number(discountAmount) : 0;
  const totalAmount = Math.round((subtotal + taxAmount - discount) * 100) / 100;

  // Generate unique bill number
  const billNumber = await generateInvoiceNumber();

  // Determine payment status based on bill type
  let paymentStatus = 'paid';
  let paidAmount = totalAmount;
  let balanceDue = 0;

  if (billType === 'monthly_credit') {
    paymentStatus = 'pending';
    paidAmount = 0;
    balanceDue = totalAmount;
  }

  const bill = await Bill.create({
    billNumber,
    customer: customerId,
    createdBy: req.user._id,
    billType,
    billDate: new Date(),
    serviceDate: serviceDate ? new Date(serviceDate) : (billType === 'monthly_credit' ? new Date() : undefined),
    items: billItems,
    subtotal,
    taxRate: effectiveTaxRate,
    taxAmount,
    discountAmount: discount,
    totalAmount,
    paymentStatus,
    paidAmount,
    balanceDue,
    paymentMethod: billType === 'monthly_credit' ? 'credit' : (paymentMethod || 'cash'),
    notes,
  });

  // Update customer outstanding balance for credit bills
  if (billType === 'monthly_credit') {
    await Customer.findByIdAndUpdate(customerId, {
      $inc: { outstandingBalance: totalAmount },
    });
  }

  // Populate for response
  const populatedBill = await Bill.findById(bill._id)
    .populate('customer', 'name organization department accountType')
    .populate('createdBy', 'name email');

  res.status(201).json(new ApiResponse(201, populatedBill, 'Bill created successfully'));
});

/**
 * PUT /api/v1/bills/:id
 * Updates a bill (only if not yet finalized/paid).
 */
export const updateBill = asyncHandler(async (req, res) => {
  const bill = await Bill.findById(req.params.id);
  if (!bill) {
    throw new ApiError(404, 'Bill not found');
  }

  if (bill.isVoid) {
    throw new ApiError(400, 'Cannot edit a voided bill.');
  }

  // Only admin can edit any bill; employee can only edit their own
  if (req.user.role === 'employee' && bill.createdBy.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'You can only edit your own bills.');
  }

  const { items, taxRate, discountAmount, notes, serviceDate } = req.body;

  if (items && Array.isArray(items) && items.length > 0) {
    const billItems = [];
    for (const item of items) {
      const quantity = Number(item.quantity);
      const unitPrice = Number(item.unitPrice);
      billItems.push({
        menuItem: item.menuItem,
        name: item.name,
        quantity,
        unit: item.unit || 'NOS',
        unitPrice,
        totalPrice: Math.round(quantity * unitPrice * 100) / 100,
      });
    }

    // Recalculate the old total for balance adjustment
    const oldTotal = bill.totalAmount;

    bill.items = billItems;
    bill.subtotal = billItems.reduce((sum, i) => sum + i.totalPrice, 0);

    const effectiveTaxRate = taxRate !== undefined ? Number(taxRate) : bill.taxRate;
    bill.taxRate = effectiveTaxRate;
    bill.taxAmount = Math.round(bill.subtotal * (effectiveTaxRate / 100) * 100) / 100;

    const discount = discountAmount !== undefined ? Number(discountAmount) : bill.discountAmount;
    bill.discountAmount = discount;
    bill.totalAmount = Math.round((bill.subtotal + bill.taxAmount - discount) * 100) / 100;
    bill.balanceDue = Math.max(0, bill.totalAmount - bill.paidAmount);

    // Adjust customer outstanding balance if credit bill total changed
    if (bill.billType === 'monthly_credit') {
      const diff = bill.totalAmount - oldTotal;
      if (diff !== 0) {
        await Customer.findByIdAndUpdate(bill.customer, {
          $inc: { outstandingBalance: diff },
        });
      }
    }
  }

  if (notes !== undefined) bill.notes = notes;
  if (serviceDate) bill.serviceDate = new Date(serviceDate);

  await bill.save();

  const populatedBill = await Bill.findById(bill._id)
    .populate('customer', 'name organization department')
    .populate('createdBy', 'name email');

  res.status(200).json(new ApiResponse(200, populatedBill, 'Bill updated successfully'));
});

/**
 * PUT /api/v1/bills/:id/payment
 * Records a payment against a bill.
 */
export const recordPayment = asyncHandler(async (req, res) => {
  const { amount, paymentMethod } = req.body;

  if (!amount || Number(amount) <= 0) {
    throw new ApiError(400, 'Payment amount must be greater than zero.');
  }

  const bill = await Bill.findById(req.params.id);
  if (!bill) {
    throw new ApiError(404, 'Bill not found');
  }

  if (bill.isVoid) {
    throw new ApiError(400, 'Cannot record payment for a voided bill.');
  }

  const paymentAmount = Number(amount);

  if (paymentAmount > bill.balanceDue) {
    throw new ApiError(400, `Payment amount (₹${paymentAmount}) exceeds balance due (₹${bill.balanceDue}).`);
  }

  bill.paidAmount += paymentAmount;
  bill.balanceDue = Math.max(0, bill.totalAmount - bill.paidAmount);

  if (bill.balanceDue === 0) {
    bill.paymentStatus = 'paid';
  } else {
    bill.paymentStatus = 'partial';
  }

  if (paymentMethod) bill.paymentMethod = paymentMethod;

  await bill.save({ validateBeforeSave: false });

  // Update customer outstanding balance
  if (bill.billType === 'monthly_credit') {
    await Customer.findByIdAndUpdate(bill.customer, {
      $inc: { outstandingBalance: -paymentAmount },
    });
  }

  const populatedBill = await Bill.findById(bill._id)
    .populate('customer', 'name organization')
    .populate('createdBy', 'name');

  res.status(200).json(new ApiResponse(200, populatedBill, 'Payment recorded successfully'));
});

/**
 * DELETE /api/v1/bills/:id/void
 * Voids/cancels a bill (admin only).
 */
export const voidBill = asyncHandler(async (req, res) => {
  const { reason } = req.body;

  const bill = await Bill.findById(req.params.id);
  if (!bill) {
    throw new ApiError(404, 'Bill not found');
  }

  if (bill.isVoid) {
    throw new ApiError(400, 'Bill is already voided.');
  }

  // Reverse outstanding balance if it was a credit bill
  if (bill.billType === 'monthly_credit' && bill.balanceDue > 0) {
    await Customer.findByIdAndUpdate(bill.customer, {
      $inc: { outstandingBalance: -bill.balanceDue },
    });
  }

  bill.isVoid = true;
  bill.voidReason = reason || 'No reason provided';
  bill.voidedBy = req.user._id;
  bill.voidedAt = new Date();
  bill.paymentStatus = 'cancelled';

  await bill.save({ validateBeforeSave: false });

  res.status(200).json(new ApiResponse(200, null, 'Bill voided successfully'));
});

// ─── Helper ─────────────────────────────────────────────────────

function getEffectivePrice(menuItem) {
  if (menuItem.specialPrice?.isActive && menuItem.specialPrice?.price != null) {
    const now = new Date();
    const from = menuItem.specialPrice.validFrom;
    const until = menuItem.specialPrice.validUntil;
    if ((!from || now >= from) && (!until || now <= until)) {
      return menuItem.specialPrice.price;
    }
  }
  return menuItem.basePrice;
}
