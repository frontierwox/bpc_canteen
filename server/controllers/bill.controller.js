import Bill     from '../models/Bill.model.js';
import Customer  from '../models/Customer.model.js';
import MenuItem  from '../models/MenuItem.model.js';
import Settings  from '../models/Settings.model.js';
import mongoose  from 'mongoose';
import ApiError  from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import { generateInvoiceNumber } from '../utils/invoiceNumber.js';
import { generateBillPDF }       from '../services/pdf.service.js';
import { calculateGST }          from '../utils/gstCalculator.js';
import escapeRegex from '../utils/escapeRegex.js';

// ─── GET /api/v1/bills ────────────────────────────────────────────────────────
/**
 * Returns paginated bills with optional filters.
 * Admin sees all bills; employees see only their own.
 */
export const getAllBills = asyncHandler(async (req, res) => {
  const {
    search, customer, billType, paymentStatus,
    startDate, endDate,
    page = 1, limit = 20,
    sortBy = 'createdAt', order = 'desc',
  } = req.query;

  const filter = { isVoid: false };

  // Employees are scoped to their own bills only
  if (req.user.role === 'employee') {
    filter.createdBy = req.user._id;
  }

  if (search) {
    const safe = escapeRegex(search);
    filter.$or = [
      { billNumber: { $regex: safe, $options: 'i' } },
      { notes:      { $regex: safe, $options: 'i' } },
    ];
  }

  if (customer)       filter.customer      = customer;
  if (billType)       filter.billType      = billType;
  if (paymentStatus)  filter.paymentStatus = paymentStatus;

  if (startDate || endDate) {
    filter.billDate = {};
    if (startDate) filter.billDate.$gte = new Date(startDate);
    if (endDate)   filter.billDate.$lte = new Date(new Date(endDate).setHours(23, 59, 59, 999));
  }

  const skip      = (Number(page) - 1) * Number(limit);
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
        page:  Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    }, 'Bills fetched successfully')
  );
});

// ─── GET /api/v1/bills/:id ────────────────────────────────────────────────────
/**
 * Returns full bill detail with all populated references.
 * Employees may only view their own bills.
 */
export const getBillById = asyncHandler(async (req, res) => {
  const bill = await Bill.findById(req.params.id)
    .populate('customer',  'name organization department phone email address accountType')
    .populate('createdBy', 'name email')
    .populate('voidedBy',  'name email')
    .lean();

  if (!bill) {
    throw new ApiError(404, 'Bill not found');
  }

  // Employees can only see their own bills
  if (
    req.user.role === 'employee' &&
    bill.createdBy?._id?.toString() !== req.user._id.toString()
  ) {
    throw new ApiError(403, 'You can only view your own bills.');
  }

  res.status(200).json(new ApiResponse(200, bill, 'Bill fetched successfully'));
});

// ─── GET /api/v1/bills/:id/pdf ────────────────────────────────────────────────
/**
 * Generates and streams the bill as an inline PDF.
 */
export const getBillPDF = asyncHandler(async (req, res) => {
  const bill = await Bill.findById(req.params.id)
    .populate('customer',  'name organization department phone email address accountType')
    .populate('createdBy', 'name')
    .lean();

  if (!bill) {
    throw new ApiError(404, 'Bill not found');
  }

  const settings = await Settings.getSettings();
  const pdfType   = bill.billType === 'monthly_credit' ? 'monthly' : 'invoice';
  const pdfBuffer = await generateBillPDF(bill, settings, pdfType);

  res.set({
    'Content-Type':        'application/pdf',
    'Content-Disposition': `inline; filename="${bill.billNumber}.pdf"`,
    'Content-Length':      pdfBuffer.length,
  });

  res.send(pdfBuffer);
});

// ─── GET /api/v1/bills/customer/:customerId ───────────────────────────────────
/**
 * Returns all non-voided bills for a specific customer.
 * NOTE: This route MUST be registered before GET /:id in the router
 * to prevent "customer" being matched as a bill ObjectId.
 */
export const getCustomerBills = asyncHandler(async (req, res) => {
  const { startDate, endDate, billType, paymentStatus, page = 1, limit = 50 } = req.query;

  const customer = await Customer.findById(req.params.customerId);
  if (!customer) {
    throw new ApiError(404, 'Customer not found');
  }

  const filter = { customer: req.params.customerId, isVoid: false };

  if (billType)      filter.billType      = billType;
  if (paymentStatus) filter.paymentStatus = paymentStatus;

  if (startDate || endDate) {
    filter.billDate = {};
    if (startDate) filter.billDate.$gte = new Date(startDate);
    if (endDate)   filter.billDate.$lte = new Date(new Date(endDate).setHours(23, 59, 59, 999));
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
        page:  Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    }, 'Customer bills fetched successfully')
  );
});

// ─── POST /api/v1/bills ───────────────────────────────────────────────────────
/**
 * Creates a new bill.
 * Handles both immediate (cash/UPI) and monthly-credit bill types.
 * Snapshots menu item prices at the time of billing.
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

  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new ApiError(400, 'At least one item is required.');
  }

  const settings = await Settings.getSettings();

  // ── Build bill items with price snapshots ─────────────────────────────────
  const billItems = [];

  for (const item of items) {
    let menuItem  = null;
    let unitPrice = item.unitPrice;
    let name      = item.name;
    let unit      = item.unit || 'NOS';

    if (item.menuItem) {
      menuItem = await MenuItem.findById(item.menuItem);
      if (menuItem) {
        name      = menuItem.name;
        unit      = menuItem.unit;
        unitPrice = getEffectivePrice(menuItem);
      }
    }

    if (!name) {
      throw new ApiError(400, 'Each item must have a name.');
    }

    const quantity = Number(item.quantity);
    const price    = Number(unitPrice);

    // Validate price — must be a positive number
    if (isNaN(price) || price <= 0) {
      throw new ApiError(400, `Item "${name}" must have a positive unit price.`);
    }

    if (!quantity || quantity < 1) {
      throw new ApiError(400, `Item "${name}" must have a quantity of at least 1.`);
    }

    billItems.push({
      menuItem:   menuItem?._id || item.menuItem,
      name,
      quantity,
      unit,
      unitPrice:  price,
      totalPrice: Math.round(quantity * price * 100) / 100,
    });
  }

  // ── Financial calculations using centralized GST calculator ────────────────
  const subtotal  = billItems.reduce((sum, i) => sum + i.totalPrice, 0);
  const cgstRate  = req.body.cgst !== undefined ? Number(req.body.cgst) : settings.defaultCGSTRate;
  const sgstRate  = req.body.sgst !== undefined ? Number(req.body.sgst) : settings.defaultSGSTRate;
  const discount  = discountAmount ? Number(discountAmount) : 0;

  const gst = calculateGST(subtotal, cgstRate, sgstRate, discount);

  const billNumber = await generateInvoiceNumber();

  // ── Payment status by bill type ───────────────────────────────────────────
  let paymentStatus;
  let paidAmount;
  let balanceDue;

  if (billType === 'monthly_credit') {
    paymentStatus = 'pending';
    paidAmount    = 0;
    balanceDue    = gst.totalAmount;
  } else {
    paymentStatus = 'paid';
    paidAmount    = gst.totalAmount;
    balanceDue    = 0;
  }

  const bill = await Bill.create({
    billNumber,
    customer:    customerId,
    createdBy:   req.user._id,
    billType,
    billDate:    new Date(),
    serviceDate: serviceDate
      ? new Date(serviceDate)
      : billType === 'monthly_credit' ? new Date() : undefined,
    items:          billItems,
    subtotal:       gst.subtotal,
    taxRate:        gst.taxRate,
    taxAmount:      gst.taxAmount,
    cgst:           gst.cgstRate,
    sgst:           gst.sgstRate,
    cgstAmount:     gst.cgstAmount,
    sgstAmount:     gst.sgstAmount,
    discountAmount: gst.discount,
    totalAmount:    gst.totalAmount,
    paymentStatus,
    paidAmount,
    balanceDue,
    paymentMethod: billType === 'monthly_credit'
      ? 'credit'
      : (paymentMethod || 'cash'),
    notes,
    settlementDetails: req.body.settlementDetails || undefined,
  });

  // Increment customer outstanding balance for credit bills
  if (billType === 'monthly_credit') {
    await Customer.findByIdAndUpdate(customerId, {
      $inc: { outstandingBalance: gst.totalAmount },
    });
  }

  const populatedBill = await Bill.findById(bill._id)
    .populate('customer',  'name organization department accountType')
    .populate('createdBy', 'name email');

  res.status(201).json(new ApiResponse(201, populatedBill, 'Bill created successfully'));
});

// ─── PUT /api/v1/bills/:id ────────────────────────────────────────────────────
/**
 * Updates a bill's items, tax, discount, notes, or service date.
 * Correctly recalculates only the UNPAID portion of the balance difference
 * to avoid double-counting partial payments in customer outstanding balance.
 */
export const updateBill = asyncHandler(async (req, res) => {
  const bill = await Bill.findById(req.params.id);
  if (!bill) {
    throw new ApiError(404, 'Bill not found');
  }

  if (bill.isVoid) {
    throw new ApiError(400, 'Cannot edit a voided bill.');
  }

  if (
    req.user.role === 'employee' &&
    bill.createdBy.toString() !== req.user._id.toString()
  ) {
    throw new ApiError(403, 'You can only edit your own bills.');
  }

  const { items, taxRate, discountAmount, notes, serviceDate } = req.body;

  if (items && Array.isArray(items) && items.length > 0) {
    const billItems = [];

    for (const item of items) {
      const quantity  = Number(item.quantity);
      const unitPrice = Number(item.unitPrice);

      if (isNaN(unitPrice) || unitPrice <= 0) {
        throw new ApiError(400, `Item "${item.name || 'unknown'}" must have a positive unit price.`);
      }
      if (!quantity || quantity < 1) {
        throw new ApiError(400, `Item "${item.name || 'unknown'}" must have a quantity of at least 1.`);
      }

      billItems.push({
        menuItem:   item.menuItem,
        name:       item.name,
        quantity,
        unit:       item.unit || 'NOS',
        unitPrice,
        totalPrice: Math.round(quantity * unitPrice * 100) / 100,
      });
    }

    // Capture the old unpaid (balance-due) portion before recalculating
    const oldBalanceDue = Math.max(0, bill.totalAmount - bill.paidAmount);

    bill.items    = billItems;
    bill.subtotal = billItems.reduce((sum, i) => sum + i.totalPrice, 0);

    const cgstRate = taxRate !== undefined ? Number(taxRate) / 2 : bill.cgst;
    const sgstRate = taxRate !== undefined ? Number(taxRate) / 2 : bill.sgst;
    const discount = discountAmount !== undefined ? Number(discountAmount) : bill.discountAmount;

    const gst = calculateGST(bill.subtotal, cgstRate, sgstRate, discount);

    bill.taxRate        = gst.taxRate;
    bill.taxAmount      = gst.taxAmount;
    bill.cgst           = gst.cgstRate;
    bill.sgst           = gst.sgstRate;
    bill.cgstAmount     = gst.cgstAmount;
    bill.sgstAmount     = gst.sgstAmount;
    bill.discountAmount = gst.discount;
    bill.totalAmount    = gst.totalAmount;
    bill.balanceDue     = Math.max(0, bill.totalAmount - bill.paidAmount);

    // Adjust customer outstanding by the change in UNPAID portion only
    if (bill.billType === 'monthly_credit') {
      const newBalanceDue = bill.balanceDue;
      const diff          = newBalanceDue - oldBalanceDue;
      if (diff !== 0) {
        await Customer.findByIdAndUpdate(bill.customer, {
          $inc: { outstandingBalance: diff },
        });
      }
    }
  }

  if (notes !== undefined)       bill.notes             = notes;
  if (serviceDate)               bill.serviceDate       = new Date(serviceDate);
  if (req.body.settlementDetails) bill.settlementDetails = req.body.settlementDetails;

  await bill.save();

  const populatedBill = await Bill.findById(bill._id)
    .populate('customer',  'name organization department')
    .populate('createdBy', 'name email');

  res.status(200).json(new ApiResponse(200, populatedBill, 'Bill updated successfully'));
});

// ─── PUT /api/v1/bills/:id/payment ───────────────────────────────────────────
/**
 * Records a full or partial payment against a bill.
 * Updates paymentStatus automatically based on remaining balance.
 */
export const recordPayment = asyncHandler(async (req, res) => {
  const { amount, paymentMethod } = req.body;

  if (!amount || Number(amount) <= 0) {
    throw new ApiError(400, 'Payment amount must be greater than zero.');
  }

  // Use MongoDB transaction for atomicity — bill save + customer balance update
  const session = await mongoose.startSession();

  try {
    let populatedBill;

    await session.withTransaction(async () => {
      const bill = await Bill.findById(req.params.id).session(session);
      if (!bill) {
        throw new ApiError(404, 'Bill not found');
      }

      if (bill.isVoid) {
        throw new ApiError(400, 'Cannot record payment for a voided bill.');
      }

      if (bill.paymentStatus === 'paid') {
        throw new ApiError(400, 'Bill is already fully paid.');
      }

      const paymentAmount = Number(amount);

      if (paymentAmount > bill.balanceDue) {
        throw new ApiError(
          400,
          `Payment amount (₹${paymentAmount}) exceeds balance due (₹${bill.balanceDue}).`
        );
      }

      // Validate paymentMethod against model enum if provided
      const allowedMethods = ['cash', 'upi', 'bank_transfer', 'credit', 'other'];
      if (paymentMethod && !allowedMethods.includes(paymentMethod)) {
        throw new ApiError(400, `Invalid payment method. Allowed: ${allowedMethods.join(', ')}.`);
      }

      bill.paidAmount += paymentAmount;
      bill.balanceDue  = Math.max(0, bill.totalAmount - bill.paidAmount);

      bill.paymentStatus =
        bill.balanceDue === 0 ? 'paid'
        : bill.paidAmount > 0 ? 'partial'
        : 'pending';

      if (paymentMethod) bill.paymentMethod = paymentMethod;

      await bill.save({ session });

      // Reduce customer outstanding balance for credit bills
      if (bill.billType === 'monthly_credit') {
        await Customer.findByIdAndUpdate(
          bill.customer,
          { $inc: { outstandingBalance: -paymentAmount } },
          { session }
        );
      }

      populatedBill = await Bill.findById(bill._id)
        .populate('customer', 'name organization')
        .populate('createdBy', 'name')
        .session(session);
    });

    res.status(200).json(new ApiResponse(200, populatedBill, 'Payment recorded successfully'));
  } finally {
    await session.endSession();
  }
});

// ─── DELETE /api/v1/bills/:id/void ───────────────────────────────────────────
/**
 * Voids (cancels) a bill. Admin only.
 * Reverses only the unpaid portion of a credit bill's outstanding balance.
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

  // Reverse only the balance still outstanding (not amounts already paid)
  if (bill.billType === 'monthly_credit' && bill.balanceDue > 0) {
    await Customer.findByIdAndUpdate(bill.customer, {
      $inc: { outstandingBalance: -bill.balanceDue },
    });
  }

  bill.isVoid        = true;
  bill.voidReason    = reason || 'No reason provided';
  bill.voidedBy      = req.user._id;
  bill.voidedAt      = new Date();
  bill.paymentStatus = 'cancelled';

  await bill.save({ validateBeforeSave: false });

  res.status(200).json(new ApiResponse(200, null, 'Bill voided successfully'));
});

// ─── Helper ───────────────────────────────────────────────────────────────────

/**
 * Returns the effective selling price for a menu item.
 * Uses the special price when it is active and within its valid date range.
 *
 * @param {Object} menuItem - Mongoose MenuItem document (plain object)
 * @returns {number} The price to charge
 */
function getEffectivePrice(menuItem) {
  if (menuItem.specialPrice?.isActive && menuItem.specialPrice?.price != null) {
    const now   = new Date();
    const from  = menuItem.specialPrice.validFrom;
    const until = menuItem.specialPrice.validUntil;
    if ((!from || now >= from) && (!until || now <= until)) {
      return menuItem.specialPrice.price;
    }
  }
  return menuItem.basePrice;
}
