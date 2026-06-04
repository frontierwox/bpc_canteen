import MonthlyStatement from '../models/MonthlyStatement.model.js';
import Customer from '../models/Customer.model.js';
import Settings from '../models/Settings.model.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import { generateMonthlyStatement } from '../services/billing.service.js';
import { generateBillPDF } from '../services/pdf.service.js';

/**
 * GET /api/v1/statements
 * Returns all monthly statements with filters.
 */
export const getAllStatements = asyncHandler(async (req, res) => {
  const { customer, month, year, status, page = 1, limit = 20 } = req.query;

  const filter = {};
  if (customer) filter.customer = customer;
  if (month) filter.month = Number(month);
  if (year) filter.year = Number(year);
  if (status) filter.status = status;

  const skip = (Number(page) - 1) * Number(limit);

  const [statements, total] = await Promise.all([
    MonthlyStatement.find(filter)
      .populate('customer', 'name organization department')
      .populate('generatedBy', 'name')
      .sort({ year: -1, month: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    MonthlyStatement.countDocuments(filter),
  ]);

  res.status(200).json(
    new ApiResponse(200, {
      statements,
      pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) },
    }, 'Statements fetched successfully')
  );
});

/**
 * GET /api/v1/statements/:id
 * Returns a single statement with full details.
 */
export const getStatementById = asyncHandler(async (req, res) => {
  const statement = await MonthlyStatement.findById(req.params.id)
    .populate('customer', 'name organization department phone email address')
    .populate('bills')
    .populate('generatedBy', 'name')
    .lean();

  if (!statement) {
    throw new ApiError(404, 'Statement not found');
  }

  res.status(200).json(new ApiResponse(200, statement, 'Statement fetched successfully'));
});

/**
 * GET /api/v1/statements/:id/pdf
 * Generates and downloads the monthly statement as a PDF.
 */
export const getStatementPDF = asyncHandler(async (req, res) => {
  const statement = await MonthlyStatement.findById(req.params.id)
    .populate('customer', 'name organization department phone email address')
    .populate('generatedBy', 'name')
    .lean();

  if (!statement) {
    throw new ApiError(404, 'Statement not found');
  }

  const settings = await Settings.getSettings();
  const pdfBuffer = await generateBillPDF(statement, settings, 'monthly');

  res.set({
    'Content-Type': 'application/pdf',
    'Content-Disposition': `inline; filename="${statement.statementNumber}.pdf"`,
    'Content-Length': pdfBuffer.length,
  });

  res.send(pdfBuffer);
});

/**
 * GET /api/v1/statements/customer/:customerId
 * Returns all statements for a specific customer.
 */
export const getCustomerStatements = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.params.customerId);
  if (!customer) {
    throw new ApiError(404, 'Customer not found');
  }

  const statements = await MonthlyStatement.find({ customer: req.params.customerId })
    .populate('generatedBy', 'name')
    .sort({ year: -1, month: -1 })
    .lean();

  res.status(200).json(new ApiResponse(200, { customer, statements }, 'Customer statements fetched successfully'));
});

/**
 * POST /api/v1/statements/generate
 * Generates a monthly statement for a customer for a specific month/year.
 */
export const generateStatement = asyncHandler(async (req, res) => {
  const { customerId, month, year } = req.body;

  if (!customerId || !month || !year) {
    throw new ApiError(400, 'Customer ID, month, and year are required.');
  }

  if (month < 1 || month > 12) {
    throw new ApiError(400, 'Month must be between 1 and 12.');
  }

  // Check if statement already exists
  const existing = await MonthlyStatement.findOne({
    customer: customerId,
    month: Number(month),
    year: Number(year),
  });

  if (existing) {
    throw new ApiError(409, `Statement already exists for this customer for ${month}/${year}. Statement: ${existing.statementNumber}`);
  }

  const customer = await Customer.findById(customerId);
  if (!customer) {
    throw new ApiError(404, 'Customer not found');
  }

  const statement = await generateMonthlyStatement(
    customerId,
    Number(month),
    Number(year),
    req.user._id
  );

  const populatedStatement = await MonthlyStatement.findById(statement._id)
    .populate('customer', 'name organization department')
    .populate('generatedBy', 'name');

  res.status(201).json(new ApiResponse(201, populatedStatement, 'Monthly statement generated successfully'));
});

/**
 * PUT /api/v1/statements/:id/mark-paid
 * Marks a statement as paid (admin only).
 */
export const markStatementPaid = asyncHandler(async (req, res) => {
  const { amount, paymentMethod } = req.body;

  const statement = await MonthlyStatement.findById(req.params.id);
  if (!statement) {
    throw new ApiError(404, 'Statement not found');
  }

  const paymentAmount = amount ? Number(amount) : statement.closingBalance;

  statement.totalPaid += paymentAmount;
  statement.closingBalance = Math.max(0, statement.openingBalance + statement.totalBilled - statement.totalPaid);

  if (statement.closingBalance === 0) {
    statement.status = 'paid';
    statement.paidAt = new Date();
  } else {
    statement.status = 'partial';
  }

  await statement.save();

  // Update customer outstanding balance
  await Customer.findByIdAndUpdate(statement.customer, {
    $inc: { outstandingBalance: -paymentAmount },
  });

  res.status(200).json(new ApiResponse(200, statement, 'Statement payment recorded successfully'));
});

/**
 * DELETE /api/v1/statements/:id
 * Deletes a monthly statement and reverses outstanding balance.
 */
export const deleteStatement = asyncHandler(async (req, res) => {
  const statement = await MonthlyStatement.findById(req.params.id);
  if (!statement) {
    throw new ApiError(404, 'Statement not found');
  }

  // Reverse any outstanding-balance contribution
  const netContribution = statement.totalBilled - statement.totalPaid;
  if (netContribution !== 0) {
    await Customer.findByIdAndUpdate(statement.customer, {
      $inc: { outstandingBalance: -netContribution },
    });
  }

  await MonthlyStatement.deleteOne({ _id: statement._id });

  res.status(200).json(new ApiResponse(200, {}, 'Statement deleted successfully. You can now regenerate it.'));
});
