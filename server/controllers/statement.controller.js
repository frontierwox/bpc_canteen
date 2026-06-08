import MonthlyStatement from '../models/MonthlyStatement.model.js';
import Customer  from '../models/Customer.model.js';
import mongoose from 'mongoose';
import ApiError  from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import { generateMonthlyStatement } from '../services/billing.service.js';
import { generateBillPDF }          from '../services/pdf.service.js';
import { roundTo2, safeSum }        from '../utils/dateHelpers.js';

// ─── GET /api/v1/statements ───────────────────────────────────────────────────
/**
 * Returns paginated statements with optional filters.
 */
export const getAllStatements = asyncHandler(async (req, res) => {
  const {
    customer, month, year, status,
    page = 1, limit = 20,
    sortBy = 'year', order = 'desc',
  } = req.query;

  const filter = {};
  if (customer) filter.customer = customer;
  if (month)    filter.month    = Number(month);
  if (year)     filter.year     = Number(year);
  if (status)   filter.status   = status;

  const skip      = (Number(page) - 1) * Number(limit);
  const sortOrder = order === 'asc' ? 1 : -1;

  const [statements, total] = await Promise.all([
    MonthlyStatement.find(filter)
      .populate('customer',    'name organization department phone email')
      .populate('generatedBy', 'name')
      .sort({ year: sortOrder, month: sortOrder })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    MonthlyStatement.countDocuments(filter),
  ]);

  res.status(200).json(
    new ApiResponse(200, {
      statements,
      pagination: {
        total,
        page:  Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    }, 'Statements fetched successfully')
  );
});

// ─── GET /api/v1/statements/:id ───────────────────────────────────────────────
/**
 * Returns a single statement with full transactions and daily summary.
 */
export const getStatementById = asyncHandler(async (req, res) => {
  const statement = await MonthlyStatement.findById(req.params.id)
    .populate('customer',    'name organization department phone email address')
    .populate('bills')
    .populate('generatedBy', 'name')
    .lean();

  if (!statement) {
    throw new ApiError(404, 'Statement not found');
  }

  res.status(200).json(new ApiResponse(200, statement, 'Statement fetched successfully'));
});

// ─── GET /api/v1/statements/:id/pdf ──────────────────────────────────────────
/**
 * Generates and streams the monthly statement as a PDF.
 * Bills are populated so the PDF renderer has full item detail.
 */
export const getStatementPDF = asyncHandler(async (req, res) => {
  const statement = await MonthlyStatement.findById(req.params.id)
    .populate('customer',    'name organization department phone email address')
    .populate('bills')           // ← required: PDF renderer needs bill items
    .populate('generatedBy', 'name')
    .lean();

  if (!statement) {
    throw new ApiError(404, 'Statement not found');
  }

  const settings  = await Settings.getSettings();
  const pdfBuffer = await generateBillPDF(statement, settings, 'monthly');

  res.set({
    'Content-Type':        'application/pdf',
    'Content-Disposition': `inline; filename="${statement.statementNumber}.pdf"`,
    'Content-Length':      pdfBuffer.length,
  });

  res.send(pdfBuffer);
});

// ─── GET /api/v1/statements/customer/:customerId ──────────────────────────────
/**
 * Returns all statements for a specific customer, newest first.
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

  res.status(200).json(
    new ApiResponse(200, { customer, statements }, 'Customer statements fetched successfully')
  );
});

// ─── POST /api/v1/statements/generate ────────────────────────────────────────
/**
 * Generates a new monthly statement for a customer.
 * Returns 409 if a statement already exists unless forceRegenerate=true.
 */
export const generateStatement = asyncHandler(async (req, res) => {
  const { customerId, month, year, forceRegenerate = false } = req.body;

  if (!customerId || !month || !year) {
    throw new ApiError(400, 'Customer ID, month, and year are required.');
  }
  if (month < 1 || month > 12) {
    throw new ApiError(400, 'Month must be between 1 and 12.');
  }

  const customer = await Customer.findById(customerId);
  if (!customer) {
    throw new ApiError(404, 'Customer not found');
  }

  if (!forceRegenerate) {
    const existing = await MonthlyStatement.findOne({
      customer: customerId,
      month:    Number(month),
      year:     Number(year),
    });
    if (existing) {
      throw new ApiError(
        409,
        `Statement already exists for ${month}/${year}: ${existing.statementNumber}. ` +
        `Send forceRegenerate=true to overwrite.`
      );
    }
  }

  const statement = await generateMonthlyStatement(
    customerId,
    Number(month),
    Number(year),
    req.user._id,
    Boolean(forceRegenerate)
  );

  const populatedStatement = await MonthlyStatement.findById(statement._id)
    .populate('customer',    'name organization department phone email')
    .populate('generatedBy', 'name')
    .lean();

  res.status(201).json(
    new ApiResponse(201, populatedStatement, 'Monthly statement generated successfully')
  );
});

// ─── POST /api/v1/statements/:id/regenerate ───────────────────────────────────
/**
 * Force-regenerates an existing statement with fresh bill data. Admin only.
 */
export const regenerateStatement = asyncHandler(async (req, res) => {
  const existing = await MonthlyStatement.findById(req.params.id).lean();
  if (!existing) {
    throw new ApiError(404, 'Statement not found');
  }

  const statement = await generateMonthlyStatement(
    existing.customer.toString(),
    existing.month,
    existing.year,
    req.user._id,
    true // forceRegenerate
  );

  const populated = await MonthlyStatement.findById(statement._id)
    .populate('customer',    'name organization department phone email')
    .populate('generatedBy', 'name')
    .lean();

  res.status(200).json(new ApiResponse(200, populated, 'Statement regenerated successfully'));
});

// ─── PUT /api/v1/statements/:id/mark-paid ────────────────────────────────────
/**
 * Records a payment against a statement.
 * Correctly recalculates closingBalance using the authoritative formula:
 *   closingBalance = openingBalance + totalBilled − totalPaid
 */
export const markStatementPaid = asyncHandler(async (req, res) => {
  const { amount, paymentReference } = req.body;

  if (!paymentReference || !paymentReference.trim()) {
    throw new ApiError(400, 'A payment reference or note is required.');
  }

  const statement = await MonthlyStatement.findById(req.params.id);
  if (!statement) {
    throw new ApiError(404, 'Statement not found');
  }

  if (statement.status === 'paid') {
    throw new ApiError(400, 'Statement is already fully paid.');
  }

  // Default to settling the full outstanding closing balance
  const paymentAmount = amount
    ? roundTo2(Number(amount))
    : statement.closingBalance;

  if (paymentAmount <= 0) {
    throw new ApiError(400, 'Payment amount must be greater than zero.');
  }

  if (paymentAmount > statement.closingBalance) {
    throw new ApiError(
      400,
      `Payment (₹${paymentAmount}) exceeds outstanding balance (₹${statement.closingBalance}).`
    );
  }

  // Use MongoDB transaction for atomicity — statement save + customer balance update
  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      statement.totalPaid      = roundTo2(safeSum(statement.totalPaid, paymentAmount));
      // Authoritative formula — always recalculate from source values
      statement.closingBalance = roundTo2(
        safeSum(statement.openingBalance, statement.totalBilled, -statement.totalPaid)
      );
      statement.paymentReference = paymentReference.trim();

      if (statement.closingBalance <= 0) {
        statement.closingBalance = 0;
        statement.status = 'paid';
        statement.paidAt = new Date();
      } else {
        statement.status = 'partial';
      }

      await statement.save({ session });

      // Reduce customer outstanding balance
      await Customer.findByIdAndUpdate(
        statement.customer,
        { $inc: { outstandingBalance: -paymentAmount } },
        { session }
      );
    });

    res.status(200).json(new ApiResponse(200, statement, 'Payment recorded successfully'));
  } finally {
    await session.endSession();
  }
});

// ─── GET /api/v1/statements/:id/validate ─────────────────────────────────────
/**
 * Runs all validation checks on a statement and returns a detailed report. Admin only.
 */
export const validateStatement = asyncHandler(async (req, res) => {
  const statement = await MonthlyStatement.findById(req.params.id)
    .populate('bills')
    .lean();

  if (!statement) {
    throw new ApiError(404, 'Statement not found');
  }

  const { generateValidationReport } = await import('../utils/statementValidator.js');

  const report = generateValidationReport({
    bills:          statement.bills       || [],
    transactions:   statement.transactions || [],
    dailySummary:   statement.dailySummary || [],
    openingBalance: statement.openingBalance,
    totalBilled:    statement.totalBilled,
    totalPaid:      statement.totalPaid,
    closingBalance: statement.closingBalance,
    customerId:     statement.customer.toString(),
  });

  res.status(200).json(
    new ApiResponse(
      200,
      {
        statementNumber: statement.statementNumber,
        report,
        summary: {
          totalOrders:    statement.totalOrders,
          totalBilled:    statement.totalBilled,
          totalPaid:      statement.totalPaid,
          openingBalance: statement.openingBalance,
          closingBalance: statement.closingBalance,
        },
      },
      report.passed ? 'Validation passed' : 'Validation FAILED — see report'
    )
  );
});

// ─── DELETE /api/v1/statements/:id ───────────────────────────────────────────
/**
 * Deletes a statement and reverses only its unpaid contribution from
 * the customer's outstanding balance. Admin only.
 */
export const deleteStatement = asyncHandler(async (req, res) => {
  const statement = await MonthlyStatement.findById(req.params.id);
  if (!statement) {
    throw new ApiError(404, 'Statement not found');
  }

  // Only reverse the unpaid portion — paid amounts were already settled
  const unpaidContribution = roundTo2(safeSum(statement.totalBilled, -statement.totalPaid));
  if (unpaidContribution > 0) {
    await Customer.findByIdAndUpdate(statement.customer, {
      $inc: { outstandingBalance: -unpaidContribution },
    });
  }

  await MonthlyStatement.deleteOne({ _id: statement._id });

  res.status(200).json(
    new ApiResponse(200, {}, 'Statement deleted. You can now regenerate it.')
  );
});
