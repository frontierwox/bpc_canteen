import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
      maxlength: [150, 'Name cannot exceed 150 characters'],
    },
    organization: {
      type: String,
      trim: true,
      maxlength: [200, 'Organization name cannot exceed 200 characters'],
    },
    department: {
      type: String,
      trim: true,
      maxlength: [150, 'Department cannot exceed 150 characters'],
    },
    phone: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    address: {
      type: String,
      trim: true,
      maxlength: [500, 'Address cannot exceed 500 characters'],
    },
    accountType: {
      type: String,
      enum: {
        values: ['immediate', 'monthly_credit'],
        message: 'Account type must be either immediate or monthly_credit',
      },
      default: 'immediate',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    outstandingBalance: {
      type: Number,
      default: 0,
      min: [0, 'Outstanding balance cannot be negative'],
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for search and filtering
customerSchema.index({ name: 'text', organization: 'text' });
customerSchema.index({ accountType: 1, isActive: 1 });
customerSchema.index({ outstandingBalance: -1 });

const Customer = mongoose.model('Customer', customerSchema);

export default Customer;
