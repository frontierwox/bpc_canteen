import Settings   from '../models/Settings.model.js';
import ApiError   from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import cloudinary  from '../config/cloudinary.js';
import { generateMenuQR } from '../services/qr.service.js';

// ─── GET /api/v1/settings ─────────────────────────────────────────────────────
/**
 * Returns the singleton settings document.
 * Creates it with defaults on first access if it doesn't exist.
 */
export const getSettings = asyncHandler(async (req, res) => {
  const settings = await Settings.getSettings();
  res.status(200).json(new ApiResponse(200, settings, 'Settings fetched successfully'));
});

// ─── PUT /api/v1/settings ─────────────────────────────────────────────────────
/**
 * Updates the singleton settings document. Admin only.
 * Only fields explicitly provided in the body are updated.
 */
export const updateSettings = asyncHandler(async (req, res) => {
  const {
    businessName, tagline, gstin, fssai, address,
    phone1, phone2, email, bankDetails,
    defaultTaxRate, defaultCGSTRate, defaultSGSTRate, invoicePrefix, currency, currencySymbol,
  } = req.body;

  const settings = await Settings.getSettings();

  if (businessName   !== undefined) settings.businessName   = businessName;
  if (tagline        !== undefined) settings.tagline        = tagline;
  if (gstin          !== undefined) settings.gstin          = gstin;
  if (fssai          !== undefined) settings.fssai          = fssai;
  if (address        !== undefined) settings.address        = address;
  if (phone1         !== undefined) settings.phone1         = phone1;
  if (phone2         !== undefined) settings.phone2         = phone2;
  if (email          !== undefined) settings.email          = email;
  if (currency       !== undefined) settings.currency       = currency;
  if (currencySymbol !== undefined) settings.currencySymbol = currencySymbol;
  if (invoicePrefix  !== undefined) settings.invoicePrefix  = invoicePrefix;

  if (defaultTaxRate !== undefined) {
    const rate = Number(defaultTaxRate);
    if (isNaN(rate) || rate < 0 || rate > 100) {
      throw new ApiError(400, 'Tax rate must be a number between 0 and 100.');
    }
    settings.defaultTaxRate = rate;
  }

  if (defaultCGSTRate !== undefined) {
    const rate = Number(defaultCGSTRate);
    if (isNaN(rate) || rate < 0 || rate > 50) {
      throw new ApiError(400, 'CGST rate must be a number between 0 and 50.');
    }
    settings.defaultCGSTRate = rate;
  }

  if (defaultSGSTRate !== undefined) {
    const rate = Number(defaultSGSTRate);
    if (isNaN(rate) || rate < 0 || rate > 50) {
      throw new ApiError(400, 'SGST rate must be a number between 0 and 50.');
    }
    settings.defaultSGSTRate = rate;
  }

  if (bankDetails) {
    settings.bankDetails = {
      ...(settings.bankDetails?.toObject?.() ?? settings.bankDetails),
      ...bankDetails,
    };
  }

  await settings.save();

  res.status(200).json(new ApiResponse(200, settings, 'Settings updated successfully'));
});

// ─── GET /api/v1/settings/qr ──────────────────────────────────────────────────
/**
 * Generates and returns the QR code data URL for the public menu URL.
 * Accepts an optional baseUrl query param (window.location.origin from the client).
 */
export const getMenuQR = asyncHandler(async (req, res) => {
  const settings  = await Settings.getSettings();
  const clientUrl = req.query.baseUrl || process.env.CLIENT_URL || 'http://localhost:5173';
  const menuUrl   = settings.menuQrUrl || `${clientUrl}/menu`;

  const qrDataUrl = await generateMenuQR(menuUrl);

  res.status(200).json(
    new ApiResponse(200, { qrCode: qrDataUrl, menuUrl }, 'QR code generated successfully')
  );
});

// ─── POST /api/v1/settings/logo ───────────────────────────────────────────────
/**
 * Uploads or replaces the BPC logo on Cloudinary. Admin only.
 * Verifies image integrity via magic bytes before uploading.
 */
export const uploadLogo = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, 'Logo image file is required.');
  }

  // Verify the uploaded file is actually an image (magic-byte check)
  await verifyImageBuffer(req.file.buffer);

  const settings = await Settings.getSettings();

  // Delete the old logo from Cloudinary if one exists
  if (settings.logoPublicId) {
    await cloudinary.uploader.destroy(settings.logoPublicId).catch((err) => {
      console.error('Failed to delete old logo from Cloudinary:', err.message);
    });
  }

  // Upload the new logo
  const result = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder:         'bpc-canteen',
        public_id:      'bpc-logo',
        transformation: [{ width: 500, height: 500, crop: 'limit', quality: 'auto:best' }],
      },
      (error, res) => {
        if (error) reject(error);
        else resolve(res);
      }
    );
    stream.end(req.file.buffer);
  });

  settings.logoUrl      = result.secure_url;
  settings.logoPublicId = result.public_id;
  await settings.save();

  res.status(200).json(
    new ApiResponse(200, { logoUrl: result.secure_url }, 'Logo uploaded successfully')
  );
});

// ─── Private Helpers ──────────────────────────────────────────────────────────

/**
 * Verifies that a file buffer is a genuine image by inspecting magic bytes.
 * Prevents disguised file uploads (e.g., a PHP file renamed to .jpg).
 *
 * @param {Buffer} buffer
 * @throws {ApiError} 400 if buffer is not a recognised image
 */
async function verifyImageBuffer(buffer) {
  const header = buffer.slice(0, 12);

  const isJpeg = header[0] === 0xFF && header[1] === 0xD8 && header[2] === 0xFF;
  const isPng  = header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4E && header[3] === 0x47;
  const isGif  = header[0] === 0x47 && header[1] === 0x49 && header[2] === 0x46 && header[3] === 0x38;
  const isWebp =
    header[0] === 0x52 && header[1] === 0x49 && header[2] === 0x46 && header[3] === 0x46 &&
    header[8] === 0x57 && header[9] === 0x45 && header[10] === 0x42 && header[11] === 0x50;

  if (!isJpeg && !isPng && !isGif && !isWebp) {
    throw new ApiError(400, 'Uploaded file is not a valid image. Only JPEG, PNG, WebP, and GIF are allowed.');
  }
}
