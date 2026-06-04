import Category from '../models/Category.model.js';
import MenuItem from '../models/MenuItem.model.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

/**
 * GET /api/v1/categories
 * Returns all categories with optional item counts.
 */
export const getAllCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find()
    .populate('itemCount')
    .sort({ sortOrder: 1, name: 1 })
    .lean();

  res.status(200).json(new ApiResponse(200, categories, 'Categories fetched successfully'));
});

/**
 * POST /api/v1/categories
 * Creates a new category (admin only).
 */
export const createCategory = asyncHandler(async (req, res) => {
  const { name, icon, sortOrder } = req.body;

  const existing = await Category.findOne({ name: { $regex: `^${name}$`, $options: 'i' } });
  if (existing) {
    throw new ApiError(409, 'A category with this name already exists.');
  }

  const category = await Category.create({
    name,
    icon: icon || '',
    sortOrder: sortOrder || 0,
  });

  res.status(201).json(new ApiResponse(201, category, 'Category created successfully'));
});

/**
 * PUT /api/v1/categories/:id
 * Updates a category (admin only).
 */
export const updateCategory = asyncHandler(async (req, res) => {
  const { name, icon, sortOrder, isActive } = req.body;

  const category = await Category.findById(req.params.id);
  if (!category) {
    throw new ApiError(404, 'Category not found');
  }

  if (name && name !== category.name) {
    const existing = await Category.findOne({
      name: { $regex: `^${name}$`, $options: 'i' },
      _id: { $ne: req.params.id },
    });
    if (existing) {
      throw new ApiError(409, 'A category with this name already exists.');
    }
    category.name = name;
  }

  if (icon !== undefined) category.icon = icon;
  if (sortOrder !== undefined) category.sortOrder = sortOrder;
  if (isActive !== undefined) category.isActive = isActive;

  await category.save();

  res.status(200).json(new ApiResponse(200, category, 'Category updated successfully'));
});

/**
 * DELETE /api/v1/categories/:id
 * Deletes a category (admin only). Fails if items exist under it.
 */
export const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) {
    throw new ApiError(404, 'Category not found');
  }

  // Check if any menu items reference this category
  const itemCount = await MenuItem.countDocuments({ category: req.params.id });
  if (itemCount > 0) {
    throw new ApiError(
      400,
      `Cannot delete category. ${itemCount} menu item(s) are assigned to it. Reassign or delete them first.`
    );
  }

  await Category.findByIdAndDelete(req.params.id);

  res.status(200).json(new ApiResponse(200, null, 'Category deleted successfully'));
});
