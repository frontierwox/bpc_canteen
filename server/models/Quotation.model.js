import mongoose from 'mongoose';

// ── Quotation line item ─────────────────────────────────────────────────────
const quotationItemSchema = new mongoose.Schema(
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

// ── Main Quotation schema ─────────────────────────────────────────────────────
const quotationSchema = new mongoose.Schema(
  {
    quotationNumber: {
      type: String,
      unique: true,
      required: [true, 'Quotation number is required'],
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
    quotationDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    validUntil: {
      type: Date,
      required: true,
    },
    items: [quotationItemSchema],

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

    // Quotation-specific fields
    eventLocation: {
      type: String,
      trim: true,
      maxlength: [500, 'Event location cannot exceed 500 characters'],
    },
    serviceVenue: {
      type: String,
      trim: true,
      maxlength: [500, 'Service venue cannot exceed 500 characters'],
    },

    // Metadata
    notes: {
      type: String,
      trim: true,
      maxlength: [2000, 'Notes cannot exceed 2000 characters'],
    },
    termsAndConditions: {
      type: String,
      trim: true,
      maxlength: [3000, 'Terms cannot exceed 3000 characters'],
    },
    status: {
      type: String,
      enum: {
        values: ['draft', 'sent', 'accepted', 'rejected', 'expired'],
        message: 'Invalid quotation status',
      },
      default: 'draft',
    },

    // Track if this quotation was converted to an invoice
    convertedToInvoice: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Invoice',
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ── Indexes ───────────────────────────────────────────────────────────────────
quotationSchema.index({ quotationNumber: 1 });
quotationSchema.index({ customer: 1, quotationDate: -1 });
quotationSchema.index({ createdBy: 1, quotationDate: -1 });
quotationSchema.index({ status: 1 });

const Quotation = mongoose.model('Quotation', quotationSchema);

export default Quotation;
