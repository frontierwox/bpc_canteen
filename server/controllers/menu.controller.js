import MenuItem from '../models/MenuItem.model.js';
import Category from '../models/Category.model.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import cloudinary from '../config/cloudinary.js';

/**
 * GET /api/v1/menu/public
 * Public endpoint: Returns all available menu items grouped by category.
 */
export const getPublicMenu = asyncHandler(async (req, res) => {
  const categories = await Category.find({ isActive: true }).sort({ sortOrder: 1 }).lean();

  const menuItems = await MenuItem.find({ isAvailable: true })
    .populate('category', 'name icon')
    .sort({ sortOrder: 1, name: 1 })
    .lean();

  // Add effective price to each item
  const itemsWithPrice = menuItems.map((item) => ({
    ...item,
    effectivePrice: getEffectivePrice(item),
    hasSpecialPrice: isSpecialPriceActive(item),
  }));

  res.status(200).json(
    new ApiResponse(200, { categories, items: itemsWithPrice }, 'Public menu fetched successfully')
  );
});

/**
 * GET /api/v1/menu/public/:categoryId
 * Public endpoint: Returns available items for a specific category.
 */
export const getPublicMenuByCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.categoryId);
  if (!category) {
    throw new ApiError(404, 'Category not found');
  }

  const items = await MenuItem.find({
    category: req.params.categoryId,
    isAvailable: true,
  })
    .sort({ sortOrder: 1, name: 1 })
    .lean();

  const itemsWithPrice = items.map((item) => ({
    ...item,
    effectivePrice: getEffectivePrice(item),
    hasSpecialPrice: isSpecialPriceActive(item),
  }));

  res.status(200).json(
    new ApiResponse(200, { category, items: itemsWithPrice }, 'Category menu fetched successfully')
  );
});

/**
 * GET /api/v1/menu
 * Protected: Returns all menu items (including unavailable) for admin/employee.
 */
export const getAllMenuItems = asyncHandler(async (req, res) => {
  const { search, category, isAvailable, isVeg, page = 1, limit = 50 } = req.query;

  const filter = {};

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }

  if (category) filter.category = category;
  if (isAvailable !== undefined) filter.isAvailable = isAvailable === 'true';
  if (isVeg !== undefined) filter.isVeg = isVeg === 'true';

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
    effectivePrice: getEffectivePrice(item),
    hasSpecialPrice: isSpecialPriceActive(item),
  }));

  res.status(200).json(
    new ApiResponse(200, {
      items: itemsWithPrice,
      pagination: {
        total,
        page: Number(page),
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
      effectivePrice: getEffectivePrice(item),
      hasSpecialPrice: isSpecialPriceActive(item),
    }, 'Menu item fetched successfully')
  );
});

/**
 * POST /api/v1/menu
 * Creates a new menu item with optional image upload to Cloudinary.
 */
export const createMenuItem = asyncHandler(async (req, res) => {
  const { name, description, category, basePrice, specialPrice, unit, isVeg, isCombo, isAvailable, tags, sortOrder } = req.body;

  // Verify category exists
  const categoryDoc = await Category.findById(category);
  if (!categoryDoc) {
    throw new ApiError(400, 'Invalid category ID');
  }

  const itemData = {
    name,
    description,
    category,
    basePrice: Number(basePrice),
    unit: unit || 'NOS',
    isVeg: isVeg !== undefined ? isVeg === 'true' || isVeg === true : true,
    isCombo: isCombo !== undefined ? isCombo === 'true' || isCombo === true : false,
    isAvailable: isAvailable !== undefined ? isAvailable === 'true' || isAvailable === true : true,
    tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map((t) => t.trim())) : [],
    sortOrder: sortOrder ? Number(sortOrder) : 0,
  };

  if (specialPrice) {
    let spParsed = typeof specialPrice === 'string' ? JSON.parse(specialPrice) : specialPrice;
    itemData.specialPrice = {
      price: spParsed.price !== undefined ? Number(spParsed.price) : undefined,
      label: spParsed.label || '',
      isActive: spParsed.isActive === true || spParsed.isActive === 'true',
    };
  }

  // Upload image to Cloudinary if provided
  if (req.file) {
    try {
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            upload_preset: 'menushop',
            folder: 'bpc-canteen/menu',
            transformation: [{ width: 800, height: 800, crop: 'limit', quality: 'auto' }],
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        stream.end(req.file.buffer);
      });

      itemData.image = {
        url: result.secure_url,
        publicId: result.public_id,
      };
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      // Continue without image rather than failing the entire creation
    }
  }

  const item = await MenuItem.create(itemData);
  const populatedItem = await MenuItem.findById(item._id).populate('category', 'name icon');

  res.status(201).json(new ApiResponse(201, populatedItem, 'Menu item created successfully'));
});

/**
 * PUT /api/v1/menu/:id
 * Updates a menu item. Handles image replacement on Cloudinary.
 */
export const updateMenuItem = asyncHandler(async (req, res) => {
  const item = await MenuItem.findById(req.params.id);
  if (!item) {
    throw new ApiError(404, 'Menu item not found');
  }

  const { name, description, category, basePrice, specialPrice, unit, isVeg, isCombo, isAvailable, tags, sortOrder } = req.body;

  if (name) item.name = name;
  if (description !== undefined) item.description = description;
  if (category) {
    const categoryDoc = await Category.findById(category);
    if (!categoryDoc) throw new ApiError(400, 'Invalid category ID');
    item.category = category;
  }
  if (basePrice !== undefined) item.basePrice = Number(basePrice);
  if (unit) item.unit = unit;
  if (isVeg !== undefined) item.isVeg = isVeg === 'true' || isVeg === true;
  if (isCombo !== undefined) item.isCombo = isCombo === 'true' || isCombo === true;
  if (isAvailable !== undefined) item.isAvailable = isAvailable === 'true' || isAvailable === true;
  if (tags) item.tags = Array.isArray(tags) ? tags : tags.split(',').map((t) => t.trim());
  if (sortOrder !== undefined) item.sortOrder = Number(sortOrder);

  if (specialPrice !== undefined) {
    let spParsed = typeof specialPrice === 'string' ? JSON.parse(specialPrice) : specialPrice;
    item.specialPrice = {
      price: spParsed.price !== undefined ? Number(spParsed.price) : item.specialPrice?.price,
      label: spParsed.label !== undefined ? spParsed.label : item.specialPrice?.label,
      isActive: spParsed.isActive !== undefined ? (spParsed.isActive === true || spParsed.isActive === 'true') : item.specialPrice?.isActive,
    };
  }

  // Handle image update
  if (req.file) {
    try {
      // Delete old image from Cloudinary
      if (item.image?.publicId) {
        await cloudinary.uploader.destroy(item.image.publicId);
      }

      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            upload_preset: 'menushop',
            folder: 'bpc-canteen/menu',
            transformation: [{ width: 800, height: 800, crop: 'limit', quality: 'auto' }],
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        stream.end(req.file.buffer);
      });

      item.image = {
        url: result.secure_url,
        publicId: result.public_id,
      };
    } catch (error) {
      console.error('Cloudinary upload error:', error);
    }
  }

  await item.save();
  const populatedItem = await MenuItem.findById(item._id).populate('category', 'name icon');

  res.status(200).json(new ApiResponse(200, populatedItem, 'Menu item updated successfully'));
});

/**
 * DELETE /api/v1/menu/:id
 * Hard-deletes a menu item from database and Cloudinary.
 */
export const deleteMenuItem = asyncHandler(async (req, res) => {
  const item = await MenuItem.findById(req.params.id);
  if (!item) {
    throw new ApiError(404, 'Menu item not found');
  }

  if (item.image?.publicId) {
    try {
      await cloudinary.uploader.destroy(item.image.publicId);
    } catch (error) {
      console.error('Cloudinary delete error:', error);
    }
  }

  await item.deleteOne();

  res.status(200).json(new ApiResponse(200, null, 'Menu item deleted successfully'));
});

/**
 * PUT /api/v1/menu/:id/special-price
 * Sets or updates the special price for a menu item.
 */
export const setSpecialPrice = asyncHandler(async (req, res) => {
  const { price, label, isActive, validFrom, validUntil } = req.body;

  const item = await MenuItem.findById(req.params.id);
  if (!item) {
    throw new ApiError(404, 'Menu item not found');
  }

  item.specialPrice = {
    price: price !== undefined ? Number(price) : item.specialPrice?.price,
    label: label || item.specialPrice?.label || '',
    isActive: isActive !== undefined ? isActive : true,
    validFrom: validFrom ? new Date(validFrom) : item.specialPrice?.validFrom,
    validUntil: validUntil ? new Date(validUntil) : item.specialPrice?.validUntil,
  };

  await item.save();
  const populatedItem = await MenuItem.findById(item._id).populate('category', 'name icon');

  res.status(200).json(new ApiResponse(200, populatedItem, 'Special price updated successfully'));
});

/**
 * PUT /api/v1/menu/:id/toggle-availability
 * Toggles the availability status of a menu item.
 */
export const toggleAvailability = asyncHandler(async (req, res) => {
  const item = await MenuItem.findById(req.params.id);
  if (!item) {
    throw new ApiError(404, 'Menu item not found');
  }

  item.isAvailable = !item.isAvailable;
  await item.save();

  res.status(200).json(
    new ApiResponse(200, { isAvailable: item.isAvailable }, `Item ${item.isAvailable ? 'enabled' : 'disabled'} successfully`)
  );
});

// ─── Helper Functions ───────────────────────────────────────────

/**
 * Calculates the effective price considering active special pricing.
 */
function getEffectivePrice(item) {
  if (item.specialPrice?.isActive && item.specialPrice?.price != null) {
    const now = new Date();
    const from = item.specialPrice.validFrom;
    const until = item.specialPrice.validUntil;
    const inRange = (!from || now >= new Date(from)) && (!until || now <= new Date(until));
    if (inRange) return item.specialPrice.price;
  }
  return item.basePrice;
}

/**
 * Checks if special price is currently active.
 */
function isSpecialPriceActive(item) {
  if (!item.specialPrice?.isActive || item.specialPrice?.price == null) return false;
  const now = new Date();
  const from = item.specialPrice.validFrom;
  const until = item.specialPrice.validUntil;
  return (!from || now >= new Date(from)) && (!until || now <= new Date(until));
}
