import mongoose from 'mongoose';

const menuItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Menu item name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required'],
    },
    basePrice: {
      type: Number,
      required: [true, 'Base price is required'],
      min: [0, 'Price cannot be negative'],
    },
    specialPrice: {
      price: { type: Number, min: 0 },
      label: { type: String, trim: true },
      isActive: { type: Boolean, default: false },
      validFrom: { type: Date },
      validUntil: { type: Date },
    },
    image: {
      url: { type: String },
      publicId: { type: String },
    },
    unit: {
      type: String,
      default: 'NOS',
      enum: ['NOS', 'KG', 'PLATE', 'PIECE', 'LITRE', 'CUP', 'GLASS', 'BOWL', 'SET'],
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    isVeg: {
      type: Boolean,
      default: true,
    },
    isCombo: {
      type: Boolean,
      default: false,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/**
 * Virtual: Returns the effective price considering active special pricing.
 * Checks if special price is active and within valid date range.
 */
menuItemSchema.virtual('effectivePrice').get(function () {
  if (
    this.specialPrice &&
    this.specialPrice.isActive &&
    this.specialPrice.price != null
  ) {
    const now = new Date();
    const validFrom = this.specialPrice.validFrom;
    const validUntil = this.specialPrice.validUntil;

    const isWithinRange =
      (!validFrom || now >= validFrom) && (!validUntil || now <= validUntil);

    if (isWithinRange) {
      return this.specialPrice.price;
    }
  }
  return this.basePrice;
});

// Indexes
menuItemSchema.index({ category: 1, isAvailable: 1 });
menuItemSchema.index({ name: 'text', description: 'text' });
menuItemSchema.index({ sortOrder: 1 });

const MenuItem = mongoose.model('MenuItem', menuItemSchema);

export default MenuItem;
