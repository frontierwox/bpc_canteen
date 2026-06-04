import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.model.js';
import Customer from '../models/Customer.model.js';
import Category from '../models/Category.model.js';
import MenuItem from '../models/MenuItem.model.js';
import Bill from '../models/Bill.model.js';
import MonthlyStatement from '../models/MonthlyStatement.model.js';
import Settings from '../models/Settings.model.js';
import { amountInWords } from '../utils/numberToWords.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bpc-canteen';

/**
 * Seeds the database with initial test data.
 * Includes: admin, employee, categories, menu items, customers, bills, statements, settings.
 */
const seed = async () => {
  try {
    console.log('🌱 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await Promise.all([
      User.deleteMany({}),
      Customer.deleteMany({}),
      Category.deleteMany({}),
      MenuItem.deleteMany({}),
      Bill.deleteMany({}),
      MonthlyStatement.deleteMany({}),
      Settings.deleteMany({}),
    ]);

    // ─── Settings ─────────────────────────────────────────────
    console.log('⚙️  Creating settings...');
    const settings = await Settings.create({
      businessName: 'Balaji Perfect Caters',
      tagline: 'High Class Veg & Non Veg Caterers',
      gstin: '33CADPB6649D1Z3',
      fssai: '12424028000583',
      address: "C2/1, Raaj Iswariyam, No.48, Warner's Road, Cantonment, Trichy-620 001.",
      phone1: '99438 73993',
      phone2: '90805 97330',
      email: 'balajiperfectcaters@gmail.com',
      bankDetails: {
        vendorName: 'Balaji Perfect Caters',
        bankName: 'South Indian Bank',
        branch: 'Trichy Main Branch',
        ifscCode: 'SIBL0000082',
        accountNumber: '0082073000002485',
      },
      defaultTaxRate: 0,
      invoicePrefix: 'BPC',
      invoiceCounter: 52,
      statementCounter: 5,
      currency: 'INR',
      currencySymbol: '₹',
    });

    // ─── Users ────────────────────────────────────────────────
    console.log('👥 Creating users...');
    const admin = await User.create({
      name: 'Balaji Admin',
      email: 'admin@bpc.com',
      password: 'Admin@BPC2024',
      role: 'admin',
      phone: '99438 73993',
      isActive: true,
    });

    const employee = await User.create({
      name: 'Ravi Kumar',
      email: 'employee@bpc.com',
      password: 'Employee@BPC2024',
      role: 'employee',
      phone: '90805 97330',
      isActive: true,
      createdBy: admin._id,
    });

    // ─── Categories ───────────────────────────────────────────
    console.log('📂 Creating categories...');
    const categories = await Category.insertMany([
      { name: 'Beverages', icon: '☕', sortOrder: 1 },
      { name: 'Snacks', icon: '🍿', sortOrder: 2 },
      { name: 'Meals', icon: '🍛', sortOrder: 3 },
      { name: 'Combos', icon: '🍱', sortOrder: 4 },
      { name: 'Bakery', icon: '🍰', sortOrder: 5 },
    ]);

    const [beverages, snacks, meals, combos, bakery] = categories;

    // ─── Menu Items ───────────────────────────────────────────
    console.log('🍽️  Creating menu items...');
    const menuItems = await MenuItem.insertMany([
      // Beverages
      { name: 'Tea', category: beverages._id, basePrice: 10, unit: 'CUP', isVeg: true, isAvailable: true, sortOrder: 1, tags: ['hot', 'daily'] },
      { name: 'Coffee', category: beverages._id, basePrice: 15, unit: 'CUP', isVeg: true, isAvailable: true, sortOrder: 2, tags: ['hot', 'daily'] },
      { name: 'Badam Milk', category: beverages._id, basePrice: 25, unit: 'GLASS', isVeg: true, isAvailable: true, sortOrder: 3 },
      { name: 'Buttermilk', category: beverages._id, basePrice: 10, unit: 'GLASS', isVeg: true, isAvailable: true, sortOrder: 4 },
      // Snacks
      { name: 'Biscuits', category: snacks._id, basePrice: 5, unit: 'NOS', isVeg: true, isAvailable: true, sortOrder: 1, tags: ['daily'] },
      { name: 'Snack Plate', category: snacks._id, basePrice: 15, unit: 'PLATE', isVeg: true, isAvailable: true, sortOrder: 2, tags: ['daily'] },
      { name: 'Samosa', category: snacks._id, basePrice: 12, unit: 'NOS', isVeg: true, isAvailable: true, sortOrder: 3 },
      { name: 'Vada', category: snacks._id, basePrice: 10, unit: 'NOS', isVeg: true, isAvailable: true, sortOrder: 4 },
      { name: 'Tissue Paper', category: snacks._id, basePrice: 5, unit: 'NOS', isVeg: true, isAvailable: true, sortOrder: 5, description: 'Tissue paper pack' },
      // Meals
      { name: 'Veg Meals', category: meals._id, basePrice: 80, unit: 'PLATE', isVeg: true, isAvailable: true, sortOrder: 1, description: 'Full South Indian veg meals with rice, sambar, rasam, curd, papad' },
      { name: 'Non-Veg Meals', category: meals._id, basePrice: 120, unit: 'PLATE', isVeg: false, isAvailable: true, sortOrder: 2 },
      { name: 'Chicken Biryani', category: meals._id, basePrice: 150, unit: 'PLATE', isVeg: false, isAvailable: true, sortOrder: 3, tags: ['special'] },
      { name: 'Chapati Set', category: meals._id, basePrice: 50, unit: 'SET', isVeg: true, isAvailable: true, sortOrder: 4, description: '3 chapatis with curry' },
      // Combos
      { name: 'Tea + Snack Combo', category: combos._id, basePrice: 20, unit: 'SET', isVeg: true, isAvailable: true, sortOrder: 1, specialPrice: { price: 18, label: 'Combo Offer', isActive: true } },
      { name: 'Coffee + Biscuit Combo', category: combos._id, basePrice: 18, unit: 'SET', isVeg: true, isAvailable: true, sortOrder: 2 },
      // Bakery
      { name: 'Cake Slice', category: bakery._id, basePrice: 30, unit: 'PIECE', isVeg: true, isAvailable: true, sortOrder: 1 },
      { name: 'Puffs', category: bakery._id, basePrice: 15, unit: 'NOS', isVeg: true, isAvailable: true, sortOrder: 2 },
    ]);

    // ─── Customers ────────────────────────────────────────────
    console.log('🏢 Creating customers...');
    const customers = await Customer.insertMany([
      {
        name: 'The Principal',
        organization: "St. Joseph's College, Trichy-2",
        department: 'Office A/C',
        phone: '0431-2700431',
        accountType: 'monthly_credit',
        notes: 'Monthly billing at end of each month',
      },
      {
        name: 'Dr. A. Rose Venis',
        organization: "St. Joseph's College",
        department: 'Director IQAC',
        phone: '9876543210',
        accountType: 'monthly_credit',
      },
      {
        name: 'Civil Engg Department',
        organization: "St. Joseph's College",
        department: 'Civil Engineering Dept',
        accountType: 'monthly_credit',
      },
      {
        name: 'Walk-in Customer',
        organization: '',
        accountType: 'immediate',
        notes: 'Default walk-in customer for immediate billing',
      },
      {
        name: 'Rajesh Trading Co.',
        organization: 'Rajesh Trading Company',
        phone: '9843212345',
        email: 'rajesh@trading.com',
        address: 'Srirangam, Trichy',
        accountType: 'immediate',
      },
    ]);

    const [principal, drRose, civilDept, walkIn, rajesh] = customers;

    // ─── Bills ────────────────────────────────────────────────
    console.log('🧾 Creating sample bills...');

    const tea = menuItems[0];
    const coffee = menuItems[1];
    const biscuits = menuItems[4];
    const snack = menuItems[5];
    const tissue = menuItems[8];
    const vegMeals = menuItems[9];

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Helper to create a bill
    const createBill = async (data) => {
      const subtotal = data.items.reduce((s, i) => s + i.totalPrice, 0);
      return Bill.create({
        ...data,
        subtotal,
        taxRate: 0,
        taxAmount: 0,
        discountAmount: 0,
        totalAmount: subtotal,
        paidAmount: data.billType === 'immediate' ? subtotal : 0,
        balanceDue: data.billType === 'immediate' ? 0 : subtotal,
        paymentStatus: data.billType === 'immediate' ? 'paid' : 'pending',
        paymentMethod: data.billType === 'immediate' ? 'cash' : 'credit',
        createdBy: employee._id,
      });
    };

    // Monthly credit bills for principal (simulating actual reference bill data)
    const creditBills = [];
    const billDates = [
      { day: 5, month: currentMonth, items: [{ name: 'Tea', qty: 5, price: 10 }, { name: 'Biscuits', qty: 3, price: 5 }, { name: 'Snack Plate', qty: 1, price: 15 }] },
      { day: 6, month: currentMonth, items: [{ name: 'Tea', qty: 3, price: 10 }, { name: 'Biscuits', qty: 1, price: 5 }] },
      { day: 7, month: currentMonth, items: [{ name: 'Tea', qty: 3, price: 10 }, { name: 'Tissue Paper', qty: 1, price: 5 }] },
      { day: 8, month: currentMonth, items: [{ name: 'Tea', qty: 7, price: 10 }] },
      { day: 9, month: currentMonth, items: [{ name: 'Tea', qty: 4, price: 10 }, { name: 'Biscuits', qty: 3, price: 5 }] },
      { day: 1, month: currentMonth, items: [{ name: 'Tea', qty: 2, price: 10 }, { name: 'Snack Plate', qty: 2, price: 15 }] },
      { day: 2, month: currentMonth, items: [{ name: 'Tea', qty: 3, price: 10 }, { name: 'Snack Plate', qty: 2, price: 15 }, { name: 'Biscuits', qty: 1, price: 5 }] },
      { day: 3, month: currentMonth, items: [{ name: 'Tea', qty: 5, price: 10 }, { name: 'Biscuits', qty: 1, price: 5 }, { name: 'Snack Plate', qty: 1, price: 15 }] },
      { day: 4, month: currentMonth, items: [{ name: 'Tea', qty: 1, price: 10 }, { name: 'Biscuits', qty: 2, price: 5 }, { name: 'Coffee', qty: 1, price: 15 }] },
      { day: 10, month: currentMonth, items: [{ name: 'Tea', qty: 3, price: 10 }, { name: 'Snack Plate', qty: 1, price: 15 }, { name: 'Biscuits', qty: 1, price: 5 }] },
      { day: 11, month: currentMonth, items: [{ name: 'Tea', qty: 3, price: 10 }, { name: 'Snack Plate', qty: 1, price: 15 }] },
      { day: 12, month: currentMonth, items: [{ name: 'Tea', qty: 4, price: 10 }, { name: 'Biscuits', qty: 1, price: 5 }, { name: 'Snack Plate', qty: 1, price: 15 }] },
    ];

    let billCounter = 52;
    for (const bd of billDates) {
      billCounter++;
      const serviceDate = new Date(currentYear, bd.month, bd.day);
      const billItems = bd.items.map((i) => ({
        name: i.name,
        quantity: i.qty,
        unit: 'NOS',
        unitPrice: i.price,
        totalPrice: i.qty * i.price,
      }));

      const bill = await createBill({
        billNumber: `BPC${String(billCounter).padStart(3, '0')}`,
        customer: principal._id,
        billType: 'monthly_credit',
        billDate: serviceDate,
        serviceDate,
        items: billItems,
      });

      creditBills.push(bill);
    }

    // Immediate bills
    for (let i = 0; i < 8; i++) {
      billCounter++;
      const date = new Date(currentYear, currentMonth, Math.floor(Math.random() * 28) + 1);
      await createBill({
        billNumber: `BPC${String(billCounter).padStart(3, '0')}`,
        customer: i % 2 === 0 ? walkIn._id : rajesh._id,
        billType: 'immediate',
        billDate: date,
        items: [
          { name: 'Veg Meals', quantity: Math.ceil(Math.random() * 3), unit: 'PLATE', unitPrice: 80, totalPrice: 80 * Math.ceil(Math.random() * 3) },
          { name: 'Coffee', quantity: Math.ceil(Math.random() * 4), unit: 'CUP', unitPrice: 15, totalPrice: 15 * Math.ceil(Math.random() * 4) },
        ],
      });
    }

    // Update outstanding balance for principal
    const totalOutstanding = creditBills.reduce((s, b) => s + b.totalAmount, 0);
    await Customer.findByIdAndUpdate(principal._id, { outstandingBalance: totalOutstanding });

    // ─── Monthly Statement ────────────────────────────────────
    console.log('📊 Creating monthly statements...');
    const transactions = creditBills.map((bill) => ({
      date: bill.serviceDate,
      billNumber: bill.billNumber,
      particulars: bill.items.map((i) => `${i.name.substring(0, 8)}.${i.quantity}`).join(' '),
      amount: bill.totalAmount,
    }));

    const totalBilled = transactions.reduce((s, t) => s + t.amount, 0);
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    await MonthlyStatement.create({
      statementNumber: `BPC-STMT-${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-001`,
      customer: principal._id,
      month: currentMonth + 1,
      year: currentYear,
      periodStart: new Date(currentYear, currentMonth, 1),
      periodEnd: new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999),
      bills: creditBills.map((b) => b._id),
      transactions,
      openingBalance: 0,
      totalBilled,
      totalPaid: 0,
      closingBalance: totalBilled,
      status: 'draft',
      generatedBy: admin._id,
      amountInWords: amountInWords(totalBilled),
    });

    // Update settings counter to match
    await Settings.findByIdAndUpdate(settings._id, { invoiceCounter: billCounter });

    console.log('\n✅ Seed completed successfully!');
    console.log('─'.repeat(40));
    console.log(`👤 Admin:    admin@bpc.com / Admin@BPC2024`);
    console.log(`👤 Employee: employee@bpc.com / Employee@BPC2024`);
    console.log(`📂 Categories: ${categories.length}`);
    console.log(`🍽️  Menu Items: ${menuItems.length}`);
    console.log(`🏢 Customers: ${customers.length}`);
    console.log(`🧾 Bills: ${creditBills.length + 8}`);
    console.log(`📊 Statements: 1`);
    console.log('─'.repeat(40));

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
};

seed();
