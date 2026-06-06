import Customer from '../models/Customer.model.js';
import Bill from '../models/Bill.model.js';
import MonthlyStatement from '../models/MonthlyStatement.model.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

/**
 * GET /api/v1/customers
 * Returns all customers with search, filter, pagination.
 */
export const getAllCustomers = asyncHandler(async (req, res) => {
  const { search, accountType, isActive, page = 1, limit = 20, sortBy = 'name', order = 'asc' } = req.query;

  const filter = {};

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { organization: { $regex: search, $options: 'i' } },
      { department: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
    ];
  }

  if (accountType) filter.accountType = accountType;
  if (isActive !== undefined) filter.isActive = isActive === 'true';

  const skip = (Number(page) - 1) * Number(limit);
  const sortOrder = order === 'desc' ? -1 : 1;

  const [customers, total] = await Promise.all([
    Customer.find(filter)
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Customer.countDocuments(filter),
  ]);

  res.status(200).json(
    new ApiResponse(200, {
      customers,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    }, 'Customers fetched successfully')
  );
});

/**
 * GET /api/v1/customers/:id
 * Returns a single customer with recent bill summary.
 */
export const getCustomerById = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.params.id).lean();

  if (!customer) {
    throw new ApiError(404, 'Customer not found');
  }

  // Fetch recent bills count
  const billStats = await Bill.aggregate([
    { $match: { customer: customer._id, isVoid: false } },
    {
      $group: {
        _id: null,
        totalBills: { $sum: 1 },
        totalAmount: { $sum: '$totalAmount' },
        totalPaid: { $sum: '$paidAmount' },
      },
    },
  ]);

  res.status(200).json(
    new ApiResponse(200, {
      ...customer,
      stats: billStats[0] || { totalBills: 0, totalAmount: 0, totalPaid: 0 },
    }, 'Customer fetched successfully')
  );
});

/**
 * GET /api/v1/customers/:id/balance
 * Returns the outstanding balance for a customer.
 */
export const getCustomerBalance = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.params.id).select('name organization outstandingBalance').lean();

  if (!customer) {
    throw new ApiError(404, 'Customer not found');
  }

  // Calculate real-time balance from pending bills
  const pendingBills = await Bill.aggregate([
    {
      $match: {
        customer: customer._id,
        isVoid: false,
        paymentStatus: { $in: ['pending', 'partial'] },
      },
    },
    {
      $group: {
        _id: null,
        totalDue: { $sum: '$balanceDue' },
        billCount: { $sum: 1 },
      },
    },
  ]);

  res.status(200).json(
    new ApiResponse(200, {
      customer: customer.name,
      organization: customer.organization,
      outstandingBalance: customer.outstandingBalance,
      pendingBills: pendingBills[0] || { totalDue: 0, billCount: 0 },
    }, 'Balance fetched successfully')
  );
});

/**
 * POST /api/v1/customers
 * Creates a new customer. Accessible by admin and employee.
 */
export const createCustomer = asyncHandler(async (req, res) => {
  const { name, organization, department, phone, email, address, accountType, notes } = req.body;

  const customer = await Customer.create({
    name,
    organization,
    department,
    phone,
    email,
    address,
    accountType: accountType || 'immediate',
    notes,
  });

  res.status(201).json(new ApiResponse(201, customer, 'Customer created successfully'));
});

/**
 * PUT /api/v1/customers/:id
 * Updates a customer (admin only).
 */
export const updateCustomer = asyncHandler(async (req, res) => {
  const { name, organization, department, phone, email, address, accountType, isActive, notes } = req.body;

  const customer = await Customer.findById(req.params.id);
  if (!customer) {
    throw new ApiError(404, 'Customer not found');
  }

  if (name) customer.name = name;
  if (organization !== undefined) customer.organization = organization;
  if (department !== undefined) customer.department = department;
  if (phone !== undefined) customer.phone = phone;
  if (email !== undefined) customer.email = email;
  if (address !== undefined) customer.address = address;
  if (accountType) customer.accountType = accountType;
  if (isActive !== undefined) customer.isActive = isActive;
  if (notes !== undefined) customer.notes = notes;

  await customer.save();

  res.status(200).json(new ApiResponse(200, customer, 'Customer updated successfully'));
});

/**
 * DELETE /api/v1/customers/:id
 * Cascading hard-deletes a customer, their bills, and statements (admin only).
 */
export const deleteCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer) {
    throw new ApiError(404, 'Customer not found');
  }

  // Cascading hard delete
  await Promise.all([
    MonthlyStatement.deleteMany({ customer: req.params.id }),
    Bill.deleteMany({ customer: req.params.id }),
  ]);

  await customer.deleteOne();

  res.status(200).json(new ApiResponse(200, null, 'Customer and all associated records deleted successfully'));
});
