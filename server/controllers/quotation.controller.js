import Quotation from '../models/Quotation.model.js';
import Invoice   from '../models/Invoice.model.js';
import Customer  from '../models/Customer.model.js';
import Settings  from '../models/Settings.model.js';
import ApiError  from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import { calculateGST } from '../utils/gstCalculator.js';
import { generateBillPDF } from '../services/pdf.service.js';
import escapeRegex from '../utils/escapeRegex.js';

/**
 * Generates a unique quotation number.
 * Format: BPC-QTN-001, BPC-QTN-002, …
 */
const generateQuotationNumber = async () => {
  let settings;
  try {
    settings = await Settings.findOneAndUpdate(
      {},
      { $inc: { quotationCounter: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
  } catch (error) {
    if (error.code === 11000) {
      settings = await Settings.findOneAndUpdate(
        {},
        { $inc: { quotationCounter: 1 } },
        { new: true }
      );
    } else {
      throw error;
    }
  }

  const counter = settings.quotationCounter;
  const prefix  = settings.invoicePrefix || 'BPC';
  const padLen  = Math.max(3, String(counter).length);

  return `${prefix}-QTN-${String(counter).padStart(padLen, '0')}`;
};

/**
 * Generates a unique invoice number (for Convert to Invoice).
 * Format: BPC-INV-001, BPC-INV-002, …
 */
const generateInvoiceNumber = async () => {
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

// ─── POST /api/v1/quotations ──────────────────────────────────────────────────
/**
 * Creates a new quotation with GST breakdown.
 * Admin only.
 */
export const createQuotation = asyncHandler(async (req, res) => {
  const {
    customer: customerId, items, quotationDate,
    validUntil, cgst, sgst, discountAmount, notes,
    eventLocation, serviceVenue, termsAndConditions,
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

  // Build quotation items
  const quotationItems = [];
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

    quotationItems.push({
      name:       item.name.trim(),
      quantity,
      unit:       item.unit || 'NOS',
      unitPrice,
      totalPrice: Math.round(quantity * unitPrice * 100) / 100,
    });
  }

  // GST calculations
  const subtotal = quotationItems.reduce((sum, i) => sum + i.totalPrice, 0);
  const cgstRate = cgst !== undefined ? Number(cgst) : settings.defaultCGSTRate;
  const sgstRate = sgst !== undefined ? Number(sgst) : settings.defaultSGSTRate;
  const discount = discountAmount ? Number(discountAmount) : 0;

  const gst = calculateGST(subtotal, cgstRate, sgstRate, discount);

  const quotationNumber = await generateQuotationNumber();

  // Default validity: 15 days from quotation date
  const qDate = quotationDate ? new Date(quotationDate) : new Date();
  const defaultValidUntil = new Date(qDate);
  defaultValidUntil.setDate(defaultValidUntil.getDate() + 15);

  const quotation = await Quotation.create({
    quotationNumber,
    customer:         customerId,
    createdBy:        req.user._id,
    quotationDate:    qDate,
    validUntil:       validUntil ? new Date(validUntil) : defaultValidUntil,
    items:            quotationItems,
    subtotal:         gst.subtotal,
    cgst:             gst.cgstRate,
    sgst:             gst.sgstRate,
    cgstAmount:       gst.cgstAmount,
    sgstAmount:       gst.sgstAmount,
    taxAmount:        gst.taxAmount,
    discountAmount:   gst.discount,
    totalAmount:      gst.totalAmount,
    eventLocation:    eventLocation || '',
    serviceVenue:     serviceVenue || '',
    notes,
    termsAndConditions: termsAndConditions || 'Prices are subject to change without prior notice.\nPayment terms: 50% advance, balance before event.\nCancellation charges may apply.',
    status:           'draft',
  });

  const populated = await Quotation.findById(quotation._id)
    .populate('customer', 'name organization department phone email address')
    .populate('createdBy', 'name email');

  res.status(201).json(new ApiResponse(201, populated, 'Quotation created successfully'));
});

// ─── GET /api/v1/quotations ───────────────────────────────────────────────────
/**
 * Returns paginated quotations with optional filters.
 */
export const getAllQuotations = asyncHandler(async (req, res) => {
  const {
    search, customer, status,
    page = 1, limit = 20,
    sortBy = 'createdAt', order = 'desc',
  } = req.query;

  const filter = {};

  if (search) {
    const safe = escapeRegex(search);
    filter.$or = [
      { quotationNumber: { $regex: safe, $options: 'i' } },
      { notes:           { $regex: safe, $options: 'i' } },
      { eventLocation:   { $regex: safe, $options: 'i' } },
    ];
  }

  if (customer) filter.customer = customer;
  if (status)   filter.status   = status;

  const skip      = (Number(page) - 1) * Number(limit);
  const sortOrder = order === 'asc' ? 1 : -1;

  const [quotations, total] = await Promise.all([
    Quotation.find(filter)
      .populate('customer', 'name organization department')
      .populate('createdBy', 'name email')
      .populate('convertedToInvoice', 'invoiceNumber')
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Quotation.countDocuments(filter),
  ]);

  res.status(200).json(
    new ApiResponse(200, {
      quotations,
      pagination: {
        total,
        page:  Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    }, 'Quotations fetched successfully')
  );
});

// ─── GET /api/v1/quotations/:id ───────────────────────────────────────────────
export const getQuotationById = asyncHandler(async (req, res) => {
  const quotation = await Quotation.findById(req.params.id)
    .populate('customer', 'name organization department phone email address')
    .populate('createdBy', 'name email')
    .populate('convertedToInvoice', 'invoiceNumber')
    .lean();

  if (!quotation) {
    throw new ApiError(404, 'Quotation not found');
  }

  res.status(200).json(new ApiResponse(200, quotation, 'Quotation fetched successfully'));
});

// ─── GET /api/v1/quotations/:id/pdf ───────────────────────────────────────────
/**
 * Generates quotation PDF.
 */
export const getQuotationPDF = asyncHandler(async (req, res) => {
  const quotation = await Quotation.findById(req.params.id)
    .populate('customer', 'name organization department phone email address')
    .populate('createdBy', 'name')
    .lean();

  if (!quotation) {
    throw new ApiError(404, 'Quotation not found');
  }

  const settings  = await Settings.getSettings();
  const pdfBuffer = await generateBillPDF(quotation, settings, 'quotation');

  res.set({
    'Content-Type':        'application/pdf',
    'Content-Disposition': `inline; filename="${quotation.quotationNumber}.pdf"`,
    'Content-Length':      pdfBuffer.length,
  });

  res.send(pdfBuffer);
});

// ─── POST /api/v1/quotations/:id/convert ──────────────────────────────────────
/**
 * Converts a quotation into an invoice.
 * Copies all items, GST, and customer data from quotation into a new invoice.
 */
export const convertToInvoice = asyncHandler(async (req, res) => {
  const quotation = await Quotation.findById(req.params.id)
    .populate('customer', 'name organization department phone email address');

  if (!quotation) {
    throw new ApiError(404, 'Quotation not found');
  }

  if (quotation.convertedToInvoice) {
    throw new ApiError(400, 'This quotation has already been converted to an invoice.');
  }

  const invoiceNumber = await generateInvoiceNumber();

  const invoice = await Invoice.create({
    invoiceNumber,
    customer:       quotation.customer._id,
    createdBy:      req.user._id,
    invoiceDate:    new Date(),
    items:          quotation.items.map(item => ({
      name:       item.name,
      quantity:   item.quantity,
      unit:       item.unit,
      unitPrice:  item.unitPrice,
      totalPrice: item.totalPrice,
    })),
    subtotal:       quotation.subtotal,
    cgst:           quotation.cgst,
    sgst:           quotation.sgst,
    cgstAmount:     quotation.cgstAmount,
    sgstAmount:     quotation.sgstAmount,
    taxAmount:      quotation.taxAmount,
    discountAmount: quotation.discountAmount,
    totalAmount:    quotation.totalAmount,
    placeOfSupply:  quotation.eventLocation || 'Tamil Nadu',
    notes:          quotation.notes ? `Converted from Quotation ${quotation.quotationNumber}. ${quotation.notes}` : `Converted from Quotation ${quotation.quotationNumber}`,
    status:         'draft',
  });

  // Mark quotation as converted and accepted
  quotation.convertedToInvoice = invoice._id;
  if (quotation.status === 'draft' || quotation.status === 'sent') {
    quotation.status = 'accepted';
  }
  await quotation.save();

  const populated = await Invoice.findById(invoice._id)
    .populate('customer', 'name organization department phone email address')
    .populate('createdBy', 'name email');

  res.status(201).json(new ApiResponse(201, {
    invoice: populated,
    quotationNumber: quotation.quotationNumber,
  }, `Quotation ${quotation.quotationNumber} converted to Invoice ${invoice.invoiceNumber} successfully`));
});

// ─── PATCH /api/v1/quotations/:id/status ──────────────────────────────────────
/**
 * Updates quotation status.
 */
export const updateQuotationStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  const validStatuses = ['draft', 'sent', 'accepted', 'rejected', 'expired'];
  if (!validStatuses.includes(status)) {
    throw new ApiError(400, `Invalid status. Must be one of: ${validStatuses.join(', ')}`);
  }

  const quotation = await Quotation.findById(req.params.id);
  if (!quotation) {
    throw new ApiError(404, 'Quotation not found');
  }

  quotation.status = status;
  await quotation.save();

  const populated = await Quotation.findById(quotation._id)
    .populate('customer', 'name organization department phone email address')
    .populate('createdBy', 'name email')
    .populate('convertedToInvoice', 'invoiceNumber')
    .lean();

  res.status(200).json(new ApiResponse(200, populated, 'Quotation status updated'));
});

// ─── DELETE /api/v1/quotations/:id ────────────────────────────────────────────
export const deleteQuotation = asyncHandler(async (req, res) => {
  const quotation = await Quotation.findById(req.params.id);
  if (!quotation) {
    throw new ApiError(404, 'Quotation not found');
  }

  await Quotation.deleteOne({ _id: quotation._id });

  res.status(200).json(new ApiResponse(200, {}, 'Quotation deleted successfully'));
});
