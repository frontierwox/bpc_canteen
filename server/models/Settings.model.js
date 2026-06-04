import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema(
  {
    businessName: {
      type: String,
      default: 'Balaji Perfect Caters',
      trim: true,
    },
    tagline: {
      type: String,
      default: 'High Class Veg & Non Veg Caterers',
      trim: true,
    },
    gstin: {
      type: String,
      default: '33CADPB6649D1Z3',
      trim: true,
    },
    fssai: {
      type: String,
      default: '12424028000583',
      trim: true,
    },
    address: {
      type: String,
      default: "C2/1, Raaj Iswariyam, No.48, Warner's Road, Cantonment, Trichy-620 001.",
      trim: true,
    },
    phone1: {
      type: String,
      default: '99438 73993',
      trim: true,
    },
    phone2: {
      type: String,
      default: '90805 97330',
      trim: true,
    },
    email: {
      type: String,
      default: 'balajiperfectcaters@gmail.com',
      trim: true,
      lowercase: true,
    },
    bankDetails: {
      vendorName: {
        type: String,
        default: 'Balaji Perfect Caters',
        trim: true,
      },
      bankName: {
        type: String,
        default: 'South Indian Bank',
        trim: true,
      },
      branch: {
        type: String,
        default: 'Trichy Main Branch',
        trim: true,
      },
      ifscCode: {
        type: String,
        default: 'SIBL0000082',
        trim: true,
      },
      accountNumber: {
        type: String,
        default: '0082073000002485',
        trim: true,
      },
    },
    logoUrl: {
      type: String,
    },
    logoPublicId: {
      type: String,
    },
    defaultTaxRate: {
      type: Number,
      default: 0,
      min: [0, 'Tax rate cannot be negative'],
      max: [100, 'Tax rate cannot exceed 100%'],
    },
    invoicePrefix: {
      type: String,
      default: 'BPC',
      trim: true,
      uppercase: true,
    },
    invoiceCounter: {
      type: Number,
      default: 0,
      min: 0,
    },
    statementCounter: {
      type: Number,
      default: 0,
      min: 0,
    },
    menuQrUrl: {
      type: String,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    currencySymbol: {
      type: String,
      default: '₹',
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Ensures only one settings document exists (singleton pattern).
 * Uses a static method to always get or create the single document.
 */
settingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

const Settings = mongoose.model('Settings', settingsSchema);

export default Settings;
