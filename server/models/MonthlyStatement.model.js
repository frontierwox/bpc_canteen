import mongoose from 'mongoose';

// ── Item-level detail stored per transaction (for expandable UI) ──────────────
const transactionItemSchema = new mongoose.Schema(
  {
    name:       { type: String, required: true, trim: true },
    quantity:   { type: Number, required: true, min: 0 },
    unit:       { type: String, default: 'NOS', trim: true },
    unitPrice:  { type: Number, required: true, min: 0 },
    totalPrice: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

// ── One row per individual bill/order ─────────────────────────────────────────
const transactionSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: [true, 'Transaction date is required'],
      index: true,
    },
    billId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bill',
    },
    billNumber: {
      type: String,
      trim: true,
    },
    particulars: {
      type: String,
      required: [true, 'Particulars are required'],
      trim: true,
    },
    // Full item breakdown for expandable detail view
    items: [transactionItemSchema],
    subtotal:       { type: Number, default: 0 },
    taxAmount:      { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount cannot be negative'],
    },
    paymentStatus: {
      type: String,
      enum: ['paid', 'pending', 'partial', 'cancelled'],
      default: 'pending',
    },
    createdAt: { type: Date },
  },
  { _id: true }
);

// ── One order row within a daily group ────────────────────────────────────────
const dailyOrderSchema = new mongoose.Schema(
  {
    billNumber:    { type: String, trim: true },
    billId:        { type: mongoose.Schema.Types.ObjectId, ref: 'Bill' },
    time:          { type: String, trim: true },       // "HH:mm" IST
    particulars:   { type: String, trim: true },
    items:         [transactionItemSchema],
    amount:        { type: Number, required: true, min: 0 },
    paymentStatus: { type: String, default: 'pending' },
  },
  { _id: false }
);

// ── Daily summary group (multiple orders on the same day) ─────────────────────
const dailySummarySchema = new mongoose.Schema(
  {
    dayKey:      { type: String, required: true },    // "YYYYMMDD" for sort/lookup
    date:        { type: Date,   required: true },
    displayDate: { type: String, trim: true },         // "05-Jun-2026"
    orders:      [dailyOrderSchema],
    dayTotal:    { type: Number, required: true, min: 0 },
    orderCount:  { type: Number, default: 1 },
  },
  { _id: false }
);

// ── Validation report entry ───────────────────────────────────────────────────
const validationCheckSchema = new mongoose.Schema(
  {
    name:   { type: String },
    passed: { type: Boolean },
    detail: { type: String },
  },
  { _id: false }
);

// ── Main monthly statement schema ─────────────────────────────────────────────
const monthlyStatementSchema = new mongoose.Schema(
  {
    statementNumber: {
      type: String,
      unique: true,
      required: [true, 'Statement number is required'],
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: [true, 'Customer is required'],
    },
    month: {
      type: Number,
      required: true,
      min: [1, 'Month must be between 1 and 12'],
      max: [12, 'Month must be between 1 and 12'],
    },
    year: {
      type: Number,
      required: true,
      min: [2020, 'Year must be 2020 or later'],
    },
    periodStart: {
      type: Date,
      required: [true, 'Period start is required'],
    },
    periodEnd: {
      type: Date,
      required: [true, 'Period end is required'],
    },

    // References to individual bills (ObjectIds)
    bills: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Bill' }],

    // One row per bill — never merged, never duplicated
    transactions: [transactionSchema],

    // Daily grouped view (multiple orders same day → compact display)
    dailySummary: [dailySummarySchema],

    // Financial totals
    openingBalance: { type: Number, default: 0 },
    totalBilled:    { type: Number, required: true, min: 0 },
    totalPaid:      { type: Number, default: 0,  min: 0 },
    closingBalance: { type: Number, required: true },

    // Count of individual orders in the period
    totalOrders: { type: Number, default: 0 },

    status: {
      type: String,
      enum: {
        values: ['draft', 'sent', 'paid', 'partial', 'overdue'],
        message: 'Invalid statement status',
      },
      default: 'draft',
    },
    generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    sentAt:  { type: Date },
    paidAt:  { type: Date },

    notes:          { type: String, trim: true, maxlength: 1000 },
    amountInWords:  { type: String, trim: true },

    // Audit: pre-save validation results stored for traceability
    validationReport: {
      passed: { type: Boolean },
      checks: [validationCheckSchema],
    },
  },
  {
    timestamps: true,
    toJSON:   { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ── Indexes ───────────────────────────────────────────────────────────────────
// Unique compound index: one statement per customer per month/year
monthlyStatementSchema.index({ customer: 1, month: 1, year: 1 }, { unique: true });
monthlyStatementSchema.index({ status: 1 });
monthlyStatementSchema.index({ year: -1, month: -1 });
monthlyStatementSchema.index({ customer: 1, year: -1, month: -1 });

const MonthlyStatement = mongoose.model('MonthlyStatement', monthlyStatementSchema);

export default MonthlyStatement;
