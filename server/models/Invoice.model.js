import mongoose from 'mongoose';

// ── Invoice line item ─────────────────────────────────────────────────────────
const invoiceItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Item name is required'],
      trim: true,
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
    },
    unit: {
      type: String,
      default: 'NOS',
      trim: true,
    },
    unitPrice: {
      type: Number,
      required: [true, 'Unit price is required'],
      min: [0, 'Price cannot be negative'],
    },
    totalPrice: {
      type: Number,
      required: [true, 'Total price is required'],
      min: [0, 'Total cannot be negative'],
    },
  },
  { _id: true }
);

// ── Settlement details (who actually pays) ────────────────────────────────────
const settlementDetailsSchema = new mongoose.Schema(
  {
    settledByName: {
      type: String,
      trim: true,
      maxlength: [150, 'Name cannot exceed 150 characters'],
    },
    settledByPhone: {
      type: String,
      trim: true,
    },
    settledByCompany: {
      type: String,
      trim: true,
      maxlength: [200, 'Company name cannot exceed 200 characters'],
    },
    settledByCustomerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
    },
  },
  { _id: false }
);

// ── Main Invoice schema ───────────────────────────────────────────────────────
const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      unique: true,
      required: [true, 'Invoice number is required'],
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: [true, 'Customer is required'],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Creator is required'],
    },
    invoiceDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    items: [invoiceItemSchema],

    // Financial breakdown
    subtotal: {
      type: Number,
      required: [true, 'Subtotal is required'],
      min: [0, 'Subtotal cannot be negative'],
    },
    cgst: {
      type: Number,
      default: 2.5,
      min: [0, 'CGST rate cannot be negative'],
      max: [50, 'CGST rate cannot exceed 50%'],
    },
    sgst: {
      type: Number,
      default: 2.5,
      min: [0, 'SGST rate cannot be negative'],
      max: [50, 'SGST rate cannot exceed 50%'],
    },
    cgstAmount: {
      type: Number,
      default: 0,
      min: [0, 'CGST amount cannot be negative'],
    },
    sgstAmount: {
      type: Number,
      default: 0,
      min: [0, 'SGST amount cannot be negative'],
    },
    taxAmount: {
      type: Number,
      default: 0,
      min: [0, 'Tax amount cannot be negative'],
    },
    discountAmount: {
      type: Number,
      default: 0,
      min: [0, 'Discount cannot be negative'],
    },
    totalAmount: {
      type: Number,
      required: [true, 'Total amount is required'],
      min: [0, 'Total cannot be negative'],
    },

    // Settlement
    settlementDetails: settlementDetailsSchema,

    // Metadata
    notes: {
      type: String,
      trim: true,
      maxlength: [2000, 'Notes cannot exceed 2000 characters'],
    },
    placeOfSupply: {
      type: String,
      default: 'Tamil Nadu',
      trim: true,
    },
    status: {
      type: String,
      enum: {
        values: ['draft', 'sent', 'paid'],
        message: 'Invalid invoice status',
      },
      default: 'draft',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ── Indexes ───────────────────────────────────────────────────────────────────
invoiceSchema.index({ invoiceNumber: 1 });
invoiceSchema.index({ customer: 1, invoiceDate: -1 });
invoiceSchema.index({ createdBy: 1, invoiceDate: -1 });
invoiceSchema.index({ status: 1 });

const Invoice = mongoose.model('Invoice', invoiceSchema);

export default Invoice;
