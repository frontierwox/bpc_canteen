import MenuItem  from '../models/MenuItem.model.js';
import Category  from '../models/Category.model.js';
import ApiError  from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import cloudinary  from '../config/cloudinary.js';
import escapeRegex from '../utils/escapeRegex.js';

// ─── Public Routes ────────────────────────────────────────────────────────────

/**
 * GET /api/v1/menu/public
 * Returns all available menu items grouped by active category.
 * No authentication required — used by the public QR-code menu page.
 */
export const getPublicMenu = asyncHandler(async (req, res) => {
  const categories = await Category.find({ isActive: true }).sort({ sortOrder: 1 }).lean();

  const menuItems = await MenuItem.find({ isAvailable: true })
    .populate('category', 'name icon')
    .sort({ sortOrder: 1, name: 1 })
    .lean();

  const itemsWithPrice = menuItems.map((item) => ({
    ...item,
    effectivePrice:  getEffectivePrice(item),
    hasSpecialPrice: isSpecialPriceActive(item),
  }));

  res.status(200).json(
    new ApiResponse(200, { categories, items: itemsWithPrice }, 'Public menu fetched successfully')
  );
});

/**
 * GET /api/v1/menu/public/:categoryId
 * Returns available items for a specific category.
 * No authentication required.
 */
export const getPublicMenuByCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.categoryId);
  if (!category) {
    throw new ApiError(404, 'Category not found');
  }

  const items = await MenuItem.find({
    category:    req.params.categoryId,
    isAvailable: true,
  })
    .sort({ sortOrder: 1, name: 1 })
    .lean();

  const itemsWithPrice = items.map((item) => ({
    ...item,
    effectivePrice:  getEffectivePrice(item),
    hasSpecialPrice: isSpecialPriceActive(item),
  }));

  res.status(200).json(
    new ApiResponse(200, { category, items: itemsWithPrice }, 'Category menu fetched successfully')
  );
});

// ─── Protected Routes ─────────────────────────────────────────────────────────

/**
 * GET /api/v1/menu
 * Returns all menu items (including unavailable) for admin/employee use.
 */
export const getAllMenuItems = asyncHandler(async (req, res) => {
  const { search, category, isAvailable, isVeg, page = 1, limit = 50 } = req.query;

  const filter = {};

  if (search) {
    const safe = escapeRegex(search);
    filter.$or = [
      { name:        { $regex: safe, $options: 'i' } },
      { description: { $regex: safe, $options: 'i' } },
    ];
  }

  if (category)               filter.category    = category;
  if (isAvailable !== undefined) filter.isAvailable = isAvailable === 'true';
  if (isVeg       !== undefined) filter.isVeg       = isVeg === 'true';

  const skip = (Number(page) - 1) * Number(limit);

  const [items, total] = await Promise.all([
    MenuItem.find(filter)
      .populate('category', 'name icon')
      .sort({ sortOrder: 1, name: 1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    MenuItem.countDocuments(filter),
  ]);

  const itemsWithPrice = items.map((item) => ({
    ...item,
    effectivePrice:  getEffectivePrice(item),
    hasSpecialPrice: isSpecialPriceActive(item),
  }));

  res.status(200).json(
    new ApiResponse(200, {
      items: itemsWithPrice,
      pagination: {
        total,
        page:  Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    }, 'Menu items fetched successfully')
  );
});

/**
 * GET /api/v1/menu/:id
 * Returns a single menu item by ID.
 */
export const getMenuItemById = asyncHandler(async (req, res) => {
  const item = await MenuItem.findById(req.params.id)
    .populate('category', 'name icon')
    .lean();

  if (!item) {
    throw new ApiError(404, 'Menu item not found');
  }

  res.status(200).json(
    new ApiResponse(200, {
      ...item,
      effectivePrice:  getEffectivePrice(item),
      hasSpecialPrice: isSpecialPriceActive(item),
    }, 'Menu item fetched successfully')
  );
});

/**
 * POST /api/v1/menu
 * Creates a new menu item with optional image upload to Cloudinary.
 * Admin only.
 */
export const createMenuItem = asyncHandler(async (req, res) => {
  const {
    name, description, category, basePrice,
    specialPrice, unit, isVeg, isCombo, isAvailable, tags, sortOrder,
  } = req.body;

  const categoryDoc = await Category.findById(category);
  if (!categoryDoc) {
    throw new ApiError(400, 'Invalid category ID');
  }

  const itemData = {
    name,
    description,
    category,
    basePrice:   Number(basePrice),
    unit:        unit || 'NOS',
    isVeg:       isVeg       !== undefined ? (isVeg === 'true'       || isVeg === true)       : true,
    isCombo:     isCombo     !== undefined ? (isCombo === 'true'     || isCombo === true)     : false,
    isAvailable: isAvailable !== undefined ? (isAvailable === 'true' || isAvailable === true) : true,
    tags:        tags ? (Array.isArray(tags) ? tags : tags.split(',').map((t) => t.trim())) : [],
    sortOrder:   sortOrder ? Number(sortOrder) : 0,
  };

  if (specialPrice) {
    const spParsed = typeof specialPrice === 'string' ? JSON.parse(specialPrice) : specialPrice;
    itemData.specialPrice = {
      price:      spParsed.price    !== undefined ? Number(spParsed.price) : undefined,
      label:      spParsed.label    || '',
      isActive:   spParsed.isActive === true || spParsed.isActive === 'true',
      validFrom:  spParsed.validFrom  ? new Date(spParsed.validFrom) : null,
      validUntil: spParsed.validUntil ? new Date(spParsed.validUntil) : null,
    };
  }

  // Upload image to Cloudinary if provided — verify magic bytes first
  if (req.file) {
    try {
      await verifyImageBuffer(req.file.buffer);

      const result = await uploadToCloudinary(req.file.buffer, 'bpc-canteen/menu');
      itemData.image = {
        url:      result.secure_url,
        publicId: result.public_id,
      };
    } catch (error) {
      // Re-throw validation errors; swallow Cloudinary upload errors gracefully
      if (error.statusCode) throw error;
      console.error('Cloudinary upload error:', error.message);
    }
  }

  const item          = await MenuItem.create(itemData);
  const populatedItem = await MenuItem.findById(item._id).populate('category', 'name icon');

  res.status(201).json(new ApiResponse(201, populatedItem, 'Menu item created successfully'));
});

/**
 * PUT /api/v1/menu/:id
 * Updates a menu item. Handles image replacement via Cloudinary.
 * Admin only.
 */
export const updateMenuItem = asyncHandler(async (req, res) => {
  const item = await MenuItem.findById(req.params.id);
  if (!item) {
    throw new ApiError(404, 'Menu item not found');
  }

  const {
    name, description, category, basePrice,
    specialPrice, unit, isVeg, isCombo, isAvailable, tags, sortOrder,
  } = req.body;

  if (name        !== undefined) item.name        = name;
  if (description !== undefined) item.description = description;

  if (category !== undefined) {
    const categoryDoc = await Category.findById(category);
    if (!categoryDoc) throw new ApiError(400, 'Invalid category ID');
    item.category = category;
  }

  if (basePrice   !== undefined) item.basePrice   = Number(basePrice);
  if (unit        !== undefined) item.unit        = unit;
  if (isVeg       !== undefined) item.isVeg       = isVeg === 'true'       || isVeg === true;
  if (isCombo     !== undefined) item.isCombo     = isCombo === 'true'     || isCombo === true;
  if (isAvailable !== undefined) item.isAvailable = isAvailable === 'true' || isAvailable === true;
  if (tags        !== undefined) item.tags        = Array.isArray(tags) ? tags : tags.split(',').map((t) => t.trim());
  if (sortOrder   !== undefined) item.sortOrder   = Number(sortOrder);

  if (specialPrice !== undefined) {
    const spParsed = typeof specialPrice === 'string' ? JSON.parse(specialPrice) : specialPrice;
    item.specialPrice = {
      price:      spParsed.price      !== undefined ? Number(spParsed.price) : item.specialPrice?.price,
      label:      spParsed.label      !== undefined ? spParsed.label : item.specialPrice?.label,
      isActive:   spParsed.isActive   !== undefined ? (spParsed.isActive === true || spParsed.isActive === 'true') : item.specialPrice?.isActive,
      validFrom:  spParsed.validFrom  !== undefined ? (spParsed.validFrom ? new Date(spParsed.validFrom) : null) : item.specialPrice?.validFrom,
      validUntil: spParsed.validUntil !== undefined ? (spParsed.validUntil ? new Date(spParsed.validUntil) : null) : item.specialPrice?.validUntil,
    };
  }

  // Handle image update with magic-byte verification
  if (req.file) {
    try {
      await verifyImageBuffer(req.file.buffer);

      // Delete old image from Cloudinary before uploading new one
      if (item.image?.publicId) {
        await cloudinary.uploader.destroy(item.image.publicId).catch((err) => {
          console.error('Failed to delete old Cloudinary image:', err.message);
        });
      }

      const result = await uploadToCloudinary(req.file.buffer, 'bpc-canteen/menu');
      item.image = {
        url:      result.secure_url,
        publicId: result.public_id,
      };
    } catch (error) {
      if (error.statusCode) throw error;
      console.error('Cloudinary upload error:', error.message);
    }
  }

  await item.save();
  const populatedItem = await MenuItem.findById(item._id).populate('category', 'name icon');

  res.status(200).json(new ApiResponse(200, populatedItem, 'Menu item updated successfully'));
});

/**
 * DELETE /api/v1/menu/:id
 * Hard-deletes a menu item and its Cloudinary image. Admin only.
 */
export const deleteMenuItem = asyncHandler(async (req, res) => {
  const item = await MenuItem.findById(req.params.id);
  if (!item) {
    throw new ApiError(404, 'Menu item not found');
  }

  if (item.image?.publicId) {
    await cloudinary.uploader.destroy(item.image.publicId).catch((err) => {
      console.error('Cloudinary delete error:', err.message);
    });
  }

  await item.deleteOne();

  res.status(200).json(new ApiResponse(200, null, 'Menu item deleted successfully'));
});

/**
 * PUT /api/v1/menu/:id/special-price
 * Sets or updates the special price for a menu item. Admin only.
 */
export const setSpecialPrice = asyncHandler(async (req, res) => {
  const { price, label, isActive, validFrom, validUntil } = req.body;

  const item = await MenuItem.findById(req.params.id);
  if (!item) {
    throw new ApiError(404, 'Menu item not found');
  }

  item.specialPrice = {
    price:     price     !== undefined ? Number(price)    : item.specialPrice?.price,
    label:     label     !== undefined ? label            : item.specialPrice?.label || '',
    isActive:  isActive  !== undefined ? isActive         : true,
    validFrom: validFrom  ? new Date(validFrom)           : item.specialPrice?.validFrom,
    validUntil:validUntil ? new Date(validUntil)          : item.specialPrice?.validUntil,
  };

  await item.save();
  const populatedItem = await MenuItem.findById(item._id).populate('category', 'name icon');

  res.status(200).json(new ApiResponse(200, populatedItem, 'Special price updated successfully'));
});

/**
 * PUT /api/v1/menu/:id/toggle-availability
 * Toggles the availability status of a menu item. Admin and employee.
 */
export const toggleAvailability = asyncHandler(async (req, res) => {
  const item = await MenuItem.findById(req.params.id);
  if (!item) {
    throw new ApiError(404, 'Menu item not found');
  }

  item.isAvailable = !item.isAvailable;
  await item.save();

  res.status(200).json(
    new ApiResponse(
      200,
      { isAvailable: item.isAvailable },
      `Item ${item.isAvailable ? 'enabled' : 'disabled'} successfully`
    )
  );
});

// ─── Private Helpers ──────────────────────────────────────────────────────────

/**
 * Returns the effective selling price for a menu item.
 * Prefers special price when active and within its valid date range.
 */
function getEffectivePrice(item) {
  if (item.specialPrice?.isActive && item.specialPrice?.price != null) {
    const now   = new Date();
    const from  = item.specialPrice.validFrom;
    const until = item.specialPrice.validUntil;
    if ((!from || now >= new Date(from)) && (!until || now <= new Date(until))) {
      return item.specialPrice.price;
    }
  }
  return item.basePrice;
}

/**
 * Checks if a special price is currently active and in date range.
 */
function isSpecialPriceActive(item) {
  if (!item.specialPrice?.isActive || item.specialPrice?.price == null) return false;
  const now   = new Date();
  const from  = item.specialPrice.validFrom;
  const until = item.specialPrice.validUntil;
  return (!from || now >= new Date(from)) && (!until || now <= new Date(until));
}

/**
 * Verifies that an uploaded file buffer is a real image by checking magic bytes.
 * Prevents disguised file uploads (e.g., .php renamed to .jpg).
 *
 * @param {Buffer} buffer - The file buffer from multer memory storage
 * @throws {ApiError} 400 if the buffer is not a recognised image format
 */
async function verifyImageBuffer(buffer) {
  // Magic byte signatures for allowed image formats
  const signatures = [
    { mime: 'image/jpeg', bytes: [0xFF, 0xD8, 0xFF] },
    { mime: 'image/png',  bytes: [0x89, 0x50, 0x4E, 0x47] },
    { mime: 'image/webp', bytes: [0x52, 0x49, 0x46, 0x46] }, // RIFF....WEBP
    { mime: 'image/gif',  bytes: [0x47, 0x49, 0x46, 0x38] }, // GIF8
  ];

  const header = buffer.slice(0, 8);

  const isValid = signatures.some(({ bytes }) =>
    bytes.every((byte, index) => header[index] === byte)
  );

  // Additional WebP check — must also have 'WEBP' at offset 8
  const isWebp =
    header[0] === 0x52 && header[1] === 0x49 && header[2] === 0x46 && header[3] === 0x46 &&
    buffer.length > 12 &&
    buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50;

  if (!isValid && !isWebp) {
    throw new ApiError(400, 'Uploaded file is not a valid image. Only JPEG, PNG, WebP, and GIF are allowed.');
  }
}

/**
 * Uploads a buffer to Cloudinary and returns the result.
 *
 * @param {Buffer} buffer - File buffer
 * @param {string} folder - Cloudinary folder path
 * @returns {Promise<Object>} Cloudinary upload result
 */
function uploadToCloudinary(buffer, folder) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        transformation: [{ width: 800, height: 800, crop: 'limit', quality: 'auto' }],
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    stream.end(buffer);
  });
}
