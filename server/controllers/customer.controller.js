import Customer        from '../models/Customer.model.js';
import Bill            from '../models/Bill.model.js';
import MonthlyStatement from '../models/MonthlyStatement.model.js';
import ApiError        from '../utils/ApiError.js';
import ApiResponse     from '../utils/ApiResponse.js';
import asyncHandler    from '../utils/asyncHandler.js';
import escapeRegex     from '../utils/escapeRegex.js';

// ─── GET /api/v1/customers ────────────────────────────────────────────────────
/**
 * Returns paginated customers with optional search, account type, and active filters.
 */
export const getAllCustomers = asyncHandler(async (req, res) => {
  const {
    search, accountType, isActive,
    page = 1, limit = 20,
    sortBy = 'name', order = 'asc',
  } = req.query;

  const filter = {};

  if (search) {
    const safe = escapeRegex(search);
    filter.$or = [
      { name:         { $regex: safe, $options: 'i' } },
      { organization: { $regex: safe, $options: 'i' } },
      { department:   { $regex: safe, $options: 'i' } },
      { phone:        { $regex: safe, $options: 'i' } },
    ];
  }

  if (accountType)          filter.accountType = accountType;
  if (isActive !== undefined) filter.isActive   = isActive === 'true';

  const skip      = (Number(page) - 1) * Number(limit);
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
        page:  Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    }, 'Customers fetched successfully')
  );
});

// ─── GET /api/v1/customers/:id ────────────────────────────────────────────────
/**
 * Returns a single customer with aggregated bill statistics.
 */
export const getCustomerById = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.params.id).lean();

  if (!customer) {
    throw new ApiError(404, 'Customer not found');
  }

  const billStats = await Bill.aggregate([
    { $match: { customer: customer._id, isVoid: false } },
    {
      $group: {
        _id:         null,
        totalBills:  { $sum: 1 },
        totalAmount: { $sum: '$totalAmount' },
        totalPaid:   { $sum: '$paidAmount' },
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

// ─── GET /api/v1/customers/:id/balance ───────────────────────────────────────
/**
 * Returns the real-time outstanding balance for a customer,
 * calculated from open bills (cross-checked against the stored field).
 */
export const getCustomerBalance = asyncHandler(async (req, res) => {
  const customer = await Customer
    .findById(req.params.id)
    .select('name organization outstandingBalance')
    .lean();

  if (!customer) {
    throw new ApiError(404, 'Customer not found');
  }

  const pendingBills = await Bill.aggregate([
    {
      $match: {
        customer:      customer._id,
        isVoid:        false,
        paymentStatus: { $in: ['pending', 'partial'] },
      },
    },
    {
      $group: {
        _id:       null,
        totalDue:  { $sum: '$balanceDue' },
        billCount: { $sum: 1 },
      },
    },
  ]);

  res.status(200).json(
    new ApiResponse(200, {
      customer:           customer.name,
      organization:       customer.organization,
      outstandingBalance: customer.outstandingBalance,
      pendingBills:       pendingBills[0] || { totalDue: 0, billCount: 0 },
    }, 'Balance fetched successfully')
  );
});

// ─── POST /api/v1/customers ───────────────────────────────────────────────────
/**
 * Creates a new customer. Accessible by admins and employees.
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

// ─── PUT /api/v1/customers/:id ────────────────────────────────────────────────
/**
 * Updates an existing customer. Admin only.
 */
export const updateCustomer = asyncHandler(async (req, res) => {
  const {
    name, organization, department, phone, email,
    address, accountType, isActive, notes,
  } = req.body;

  const customer = await Customer.findById(req.params.id);
  if (!customer) {
    throw new ApiError(404, 'Customer not found');
  }

  if (name                !== undefined) customer.name         = name;
  if (organization        !== undefined) customer.organization = organization;
  if (department          !== undefined) customer.department   = department;
  if (phone               !== undefined) customer.phone        = phone;
  if (email               !== undefined) customer.email        = email;
  if (address             !== undefined) customer.address      = address;
  if (accountType         !== undefined) customer.accountType  = accountType;
  if (isActive            !== undefined) customer.isActive     = isActive;
  if (notes               !== undefined) customer.notes        = notes;

  await customer.save();

  res.status(200).json(new ApiResponse(200, customer, 'Customer updated successfully'));
});

// ─── DELETE /api/v1/customers/:id ────────────────────────────────────────────
/**
 * Hard-deletes a customer and all their associated bills and statements.
 * BLOCKED if the customer has an outstanding balance — prevents accidental
 * destruction of financial records with unresolved dues.
 */
export const deleteCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer) {
    throw new ApiError(404, 'Customer not found');
  }

  // Guard: do not allow deletion while there are unresolved dues
  if (customer.outstandingBalance > 0) {
    throw new ApiError(
      400,
      `Cannot delete customer with an outstanding balance of ₹${customer.outstandingBalance}. ` +
      `Settle all dues or zero the balance before deleting.`
    );
  }

  // Cascade-delete all related records atomically
  await Promise.all([
    MonthlyStatement.deleteMany({ customer: req.params.id }),
    Bill.deleteMany({ customer: req.params.id }),
  ]);

  await customer.deleteOne();

  res.status(200).json(
    new ApiResponse(200, null, 'Customer and all associated records deleted successfully')
  );
});
