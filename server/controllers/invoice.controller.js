import Invoice  from '../models/Invoice.model.js';
import Customer from '../models/Customer.model.js';
import Settings from '../models/Settings.model.js';
import ApiError  from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import { calculateGST } from '../utils/gstCalculator.js';
import { generateBillPDF } from '../services/pdf.service.js';
import escapeRegex from '../utils/escapeRegex.js';

/**
 * Generates a unique invoice generator number.
 * Format: BPC-INV-001, BPC-INV-002, ...
 */
const generateInvoiceGenNumber = async () => {
  let settings;
  try {
    settings = await Settings.findOneAndUpdate(
      {},
      { $inc: { invoiceGeneratorCounter: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
  } catch (error) {
    if (error.code === 11000) {
      settings = await Settings.findOneAndUpdate(
        {},
        { $inc: { invoiceGeneratorCounter: 1 } },
        { new: true }
      );
    } else {
      throw error;
    }
  }

  const counter = settings.invoiceGeneratorCounter;
  const prefix  = settings.invoicePrefix || 'BPC';
  const padLen  = Math.max(3, String(counter).length);

  return `${prefix}-INV-${String(counter).padStart(padLen, '0')}`;
};

// ─── POST /api/v1/invoices ────────────────────────────────────────────────────
/**
 * Creates a standalone invoice with GST breakdown.
 * Admin only.
 */
export const createInvoice = asyncHandler(async (req, res) => {
  const {
    customer: customerId, items, invoiceDate,
    cgst, sgst, discountAmount, notes,
    placeOfSupply, settlementDetails,
  } = req.body;

  // Validate customer
  const customer = await Customer.findById(customerId);
  if (!customer) {
    throw new ApiError(404, 'Customer not found');
  }

  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new ApiError(400, 'At least one item is required.');
  }

  const settings = await Settings.getSettings();

  // Build invoice items
  const invoiceItems = [];
  for (const item of items) {
    const quantity  = Number(item.quantity);
    const unitPrice = Number(item.unitPrice);

    if (!item.name || !item.name.trim()) {
      throw new ApiError(400, 'Each item must have a name.');
    }
    if (isNaN(unitPrice) || unitPrice <= 0) {
      throw new ApiError(400, `Item "${item.name}" must have a positive unit price.`);
    }
    if (!quantity || quantity < 1) {
      throw new ApiError(400, `Item "${item.name}" must have a quantity of at least 1.`);
    }

    invoiceItems.push({
      name:       item.name.trim(),
      quantity,
      unit:       item.unit || 'NOS',
      unitPrice,
      totalPrice: Math.round(quantity * unitPrice * 100) / 100,
    });
  }

  // GST calculations
  const subtotal = invoiceItems.reduce((sum, i) => sum + i.totalPrice, 0);
  const cgstRate = cgst !== undefined ? Number(cgst) : settings.defaultCGSTRate;
  const sgstRate = sgst !== undefined ? Number(sgst) : settings.defaultSGSTRate;
  const discount = discountAmount ? Number(discountAmount) : 0;

  const gst = calculateGST(subtotal, cgstRate, sgstRate, discount);

  const invoiceNumber = await generateInvoiceGenNumber();

  const invoice = await Invoice.create({
    invoiceNumber,
    customer:       customerId,
    createdBy:      req.user._id,
    invoiceDate:    invoiceDate ? new Date(invoiceDate) : new Date(),
    items:          invoiceItems,
    subtotal:       gst.subtotal,
    cgst:           gst.cgstRate,
    sgst:           gst.sgstRate,
    cgstAmount:     gst.cgstAmount,
    sgstAmount:     gst.sgstAmount,
    taxAmount:      gst.taxAmount,
    discountAmount: gst.discount,
    totalAmount:    gst.totalAmount,
    placeOfSupply:  placeOfSupply || 'Tamil Nadu',
    notes,
    settlementDetails: settlementDetails || undefined,
    status:         'draft',
  });

  const populated = await Invoice.findById(invoice._id)
    .populate('customer', 'name organization department phone email address')
    .populate('createdBy', 'name email');

  res.status(201).json(new ApiResponse(201, populated, 'Invoice created successfully'));
});

// ─── GET /api/v1/invoices ─────────────────────────────────────────────────────
/**
 * Returns paginated invoices with optional filters.
 */
export const getAllInvoices = asyncHandler(async (req, res) => {
  const {
    search, customer, status,
    page = 1, limit = 20,
    sortBy = 'createdAt', order = 'desc',
  } = req.query;

  const filter = {};

  if (search) {
    const safe = escapeRegex(search);
    filter.$or = [
      { invoiceNumber: { $regex: safe, $options: 'i' } },
      { notes:         { $regex: safe, $options: 'i' } },
    ];
  }

  if (customer) filter.customer = customer;
  if (status)   filter.status   = status;

  const skip      = (Number(page) - 1) * Number(limit);
  const sortOrder = order === 'asc' ? 1 : -1;

  const [invoices, total] = await Promise.all([
    Invoice.find(filter)
      .populate('customer', 'name organization department')
      .populate('createdBy', 'name email')
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Invoice.countDocuments(filter),
  ]);

  res.status(200).json(
    new ApiResponse(200, {
      invoices,
      pagination: {
        total,
        page:  Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    }, 'Invoices fetched successfully')
  );
});

// ─── GET /api/v1/invoices/:id ─────────────────────────────────────────────────
export const getInvoiceById = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findById(req.params.id)
    .populate('customer', 'name organization department phone email address')
    .populate('createdBy', 'name email')
    .lean();

  if (!invoice) {
    throw new ApiError(404, 'Invoice not found');
  }

  res.status(200).json(new ApiResponse(200, invoice, 'Invoice fetched successfully'));
});

// ─── GET /api/v1/invoices/:id/pdf ─────────────────────────────────────────────
/**
 * Generates invoice PDF WITHOUT bank details.
 */
export const getInvoicePDF = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findById(req.params.id)
    .populate('customer', 'name organization department phone email address')
    .populate('createdBy', 'name')
    .lean();

  if (!invoice) {
    throw new ApiError(404, 'Invoice not found');
  }

  const settings  = await Settings.getSettings();
  const pdfBuffer = await generateBillPDF(invoice, settings, 'invoice_generator');

  res.set({
    'Content-Type':        'application/pdf',
    'Content-Disposition': `inline; filename="${invoice.invoiceNumber}.pdf"`,
    'Content-Length':      pdfBuffer.length,
  });

  res.send(pdfBuffer);
});

// ─── DELETE /api/v1/invoices/:id ──────────────────────────────────────────────
export const deleteInvoice = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findById(req.params.id);
  if (!invoice) {
    throw new ApiError(404, 'Invoice not found');
  }

  await Invoice.deleteOne({ _id: invoice._id });

  res.status(200).json(new ApiResponse(200, {}, 'Invoice deleted successfully'));
});
