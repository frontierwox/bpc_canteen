import Settings from '../models/Settings.model.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import cloudinary from '../config/cloudinary.js';
import { generateMenuQR } from '../services/qr.service.js';

/**
 * GET /api/v1/settings
 * Returns the system settings (singleton).
 */
export const getSettings = asyncHandler(async (req, res) => {
  const settings = await Settings.getSettings();
  res.status(200).json(new ApiResponse(200, settings, 'Settings fetched successfully'));
});

/**
 * PUT /api/v1/settings
 * Updates system settings (admin only).
 */
export const updateSettings = asyncHandler(async (req, res) => {
  const {
    businessName, tagline, gstin, fssai, address,
    phone1, phone2, email, bankDetails,
    defaultTaxRate, invoicePrefix, currency, currencySymbol,
  } = req.body;

  const settings = await Settings.getSettings();

  if (businessName) settings.businessName = businessName;
  if (tagline) settings.tagline = tagline;
  if (gstin) settings.gstin = gstin;
  if (fssai) settings.fssai = fssai;
  if (address) settings.address = address;
  if (phone1) settings.phone1 = phone1;
  if (phone2) settings.phone2 = phone2;
  if (email) settings.email = email;
  if (defaultTaxRate !== undefined) settings.defaultTaxRate = Number(defaultTaxRate);
  if (invoicePrefix) settings.invoicePrefix = invoicePrefix;
  if (currency) settings.currency = currency;
  if (currencySymbol) settings.currencySymbol = currencySymbol;

  if (bankDetails) {
    settings.bankDetails = {
      ...settings.bankDetails.toObject?.() || settings.bankDetails,
      ...bankDetails,
    };
  }

  await settings.save();

  res.status(200).json(new ApiResponse(200, settings, 'Settings updated successfully'));
});

/**
 * GET /api/v1/settings/qr
 * Generates and returns the QR code for the public menu URL.
 */
export const getMenuQR = asyncHandler(async (req, res) => {
  const settings = await Settings.getSettings();
  
  // Try to use provided baseUrl (from frontend window.location.origin), fallback to CLIENT_URL or localhost
  const clientUrl = req.query.baseUrl || process.env.CLIENT_URL || 'http://localhost:5173';
  const menuUrl = settings.menuQrUrl || `${clientUrl}/menu`;
  
  const qrDataUrl = await generateMenuQR(menuUrl);

  res.status(200).json(
    new ApiResponse(200, { qrCode: qrDataUrl, menuUrl }, 'QR code generated successfully')
  );
});

/**
 * POST /api/v1/settings/logo
 * Uploads/replaces the BPC logo to Cloudinary.
 */
export const uploadLogo = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, 'Logo image file is required.');
  }

  const settings = await Settings.getSettings();

  // Delete old logo from Cloudinary if exists
  if (settings.logoPublicId) {
    try {
      await cloudinary.uploader.destroy(settings.logoPublicId);
    } catch (error) {
      console.error('Failed to delete old logo:', error.message);
    }
  }

  // Upload new logo
  const result = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        upload_preset: 'menushop',
        folder: 'bpc-canteen',
        public_id: 'bpc-logo',
        transformation: [{ width: 500, height: 500, crop: 'limit', quality: 'auto:best' }],
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    stream.end(req.file.buffer);
  });

  settings.logoUrl = result.secure_url;
  settings.logoPublicId = result.public_id;
  await settings.save();

  res.status(200).json(
    new ApiResponse(200, { logoUrl: result.secure_url }, 'Logo uploaded successfully')
  );
});
