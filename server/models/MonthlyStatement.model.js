import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: [true, 'Transaction date is required'],
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
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount cannot be negative'],
    },
  },
  { _id: true }
);

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
      required: [true, 'Month is required'],
      min: [1, 'Month must be between 1 and 12'],
      max: [12, 'Month must be between 1 and 12'],
    },
    year: {
      type: Number,
      required: [true, 'Year is required'],
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
    bills: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Bill',
      },
    ],
    transactions: [transactionSchema],
    openingBalance: {
      type: Number,
      default: 0,
    },
    totalBilled: {
      type: Number,
      required: [true, 'Total billed amount is required'],
      min: [0, 'Total billed cannot be negative'],
    },
    totalPaid: {
      type: Number,
      default: 0,
      min: [0, 'Total paid cannot be negative'],
    },
    closingBalance: {
      type: Number,
      required: [true, 'Closing balance is required'],
    },
    status: {
      type: String,
      enum: {
        values: ['draft', 'sent', 'paid', 'partial', 'overdue'],
        message: 'Invalid statement status',
      },
      default: 'draft',
    },
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    sentAt: {
      type: Date,
    },
    paidAt: {
      type: Date,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
    },
    amountInWords: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound index to prevent duplicate statements for same customer/month/year
monthlyStatementSchema.index({ customer: 1, month: 1, year: 1 }, { unique: true });
monthlyStatementSchema.index({ status: 1 });
monthlyStatementSchema.index({ year: -1, month: -1 });

const MonthlyStatement = mongoose.model('MonthlyStatement', monthlyStatementSchema);

export default MonthlyStatement;
