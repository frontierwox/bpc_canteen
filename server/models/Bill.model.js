import mongoose from 'mongoose';

const billItemSchema = new mongoose.Schema(
  {
    menuItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MenuItem',
    },
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

const billSchema = new mongoose.Schema(
  {
    billNumber: {
      type: String,
      unique: true,
      required: [true, 'Bill number is required'],
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
    billType: {
      type: String,
      enum: {
        values: ['immediate', 'monthly_credit'],
        message: 'Bill type must be either immediate or monthly_credit',
      },
      required: [true, 'Bill type is required'],
    },
    billDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    serviceDate: {
      type: Date,
    },
    items: [billItemSchema],
    subtotal: {
      type: Number,
      required: [true, 'Subtotal is required'],
      min: [0, 'Subtotal cannot be negative'],
    },
    taxRate: {
      type: Number,
      default: 0,
      min: [0, 'Tax rate cannot be negative'],
      max: [100, 'Tax rate cannot exceed 100%'],
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
    paymentStatus: {
      type: String,
      enum: {
        values: ['paid', 'pending', 'partial', 'cancelled'],
        message: 'Invalid payment status',
      },
      default: 'paid',
    },
    paidAmount: {
      type: Number,
      default: 0,
      min: [0, 'Paid amount cannot be negative'],
    },
    balanceDue: {
      type: Number,
      default: 0,
      min: [0, 'Balance cannot be negative'],
    },
    paymentMethod: {
      type: String,
      enum: {
        values: ['cash', 'upi', 'bank_transfer', 'credit', 'other'],
        message: 'Invalid payment method',
      },
      default: 'cash',
    },
    monthlyStatement: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MonthlyStatement',
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
    },
    isVoid: {
      type: Boolean,
      default: false,
    },
    voidReason: {
      type: String,
      trim: true,
    },
    voidedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    voidedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for efficient queries
billSchema.index({ billNumber: 1 });
billSchema.index({ customer: 1, billDate: -1 });
billSchema.index({ createdBy: 1, billDate: -1 });
billSchema.index({ billType: 1, paymentStatus: 1 });
billSchema.index({ serviceDate: 1 });
billSchema.index({ isVoid: 1 });
billSchema.index({ monthlyStatement: 1 });

/**
 * Pre-save: Calculate balance due from total minus paid amount.
 */
billSchema.pre('save', function (next) {
  if (this.isModified('paidAmount') || this.isModified('totalAmount')) {
    this.balanceDue = Math.max(0, this.totalAmount - this.paidAmount);

    if (this.balanceDue === 0 && this.totalAmount > 0) {
      this.paymentStatus = 'paid';
    } else if (this.paidAmount > 0 && this.balanceDue > 0) {
      this.paymentStatus = 'partial';
    }
  }
  next();
});

const Bill = mongoose.model('Bill', billSchema);

export default Bill;
