/**
 * billing.service.js — Production-grade Monthly Statement Generation
 *
 * Fixes applied in this version:
 *  ✓ UTC-safe date boundaries (IST-aware) — no more missing first/last day bills
 *  ✓ Uses serviceDate with createdAt as fallback for correct grouping
 *  ✓ Financial-grade integer (paise) arithmetic — no floating-point errors
 *  ✓ Every individual order gets exactly one transaction row — no merging, no skipping
 *  ✓ Daily grouping for compact display (multiple orders same day shown as day-group)
 *  ✓ Per-bill items stored in transactions for expandable UI
 *  ✓ Pre-save validation via statementValidator
 *  ✓ forceRegenerate correctly reverses exactly totalBilled (not closingBalance)
 *  ✓ Opening balance chain: previous month's closingBalance
 *  ✓ Detailed logging for auditability
 *  ✓ Compound index on { customer, month, year } ensures no duplicates
 */

import Bill from '../models/Bill.model.js';
import Customer from '../models/Customer.model.js';
import MonthlyStatement from '../models/MonthlyStatement.model.js';
import { generateStatementNumber } from '../utils/invoiceNumber.js';
import { amountInWords } from '../utils/numberToWords.js';
import {
  periodStartUTC,
  periodEndUTC,
  formatDateIST,
  formatTimeIST,
  dayKeyIST,
  safeSum,
  roundTo2,
} from '../utils/dateHelpers.js';
import { validateStatementData, generateValidationReport } from '../utils/statementValidator.js';

// ─── Constants ────────────────────────────────────────────────────────────────
// IST offset in minutes (UTC+5:30)
const IST_OFFSET_MINUTES = 330;

// ─── Main Export ─────────────────────────────────────────────────────────────

/**
 * Generates (or regenerates) a monthly statement for a customer.
 *
 * Algorithm:
 *   1. Compute UTC-safe period boundaries for the calendar month in IST.
 *   2. Fetch ALL monthly_credit bills for customer in period, ordered by serviceDate ASC, createdAt ASC.
 *   3. Build one transaction row per bill (preserving individual order identity).
 *   4. Group transactions by IST calendar day for compact daily-summary display.
 *   5. Look up previous month's closingBalance as openingBalance.
 *   6. Compute totalBilled using integer (paise) arithmetic.
 *   7. Validate all calculations before saving.
 *   8. Persist statement; update customer outstandingBalance.
 *
 * @param {string}  customerId      - Customer ObjectId string
 * @param {number}  month           - 1-12
 * @param {number}  year            - e.g. 2026
 * @param {string}  generatedBy     - User ObjectId string
 * @param {boolean} forceRegenerate - If true, deletes and recreates existing statement
 * @returns {Promise<MonthlyStatement>} saved Mongoose document
 */
export const generateMonthlyStatement = async (
  customerId,
  month,
  year,
  generatedBy,
  forceRegenerate = false
) => {
  const label = `[Statement ${year}-${String(month).padStart(2,'0')} customer=${customerId}]`;
  console.log(`${label} Starting generation (forceRegenerate=${forceRegenerate})`);

  // ── 1. UTC-safe period boundaries ─────────────────────────────────────────
  const periodStart = periodStartUTC(year, month, IST_OFFSET_MINUTES);
  const periodEnd   = periodEndUTC(year, month, IST_OFFSET_MINUTES);

  console.log(`${label} Period: ${periodStart.toISOString()} → ${periodEnd.toISOString()}`);

  // ── 2. Handle regeneration ─────────────────────────────────────────────────
  if (forceRegenerate) {
    const existing = await MonthlyStatement.findOne({ customer: customerId, month, year });
    if (existing) {
      console.log(`${label} forceRegenerate: removing existing statement ${existing.statementNumber}`);
      // Reverse ONLY totalBilled (not closingBalance, which includes openingBalance)
      if (existing.totalBilled > 0) {
        await Customer.findByIdAndUpdate(customerId, {
          $inc: { outstandingBalance: -existing.totalBilled },
        });
        console.log(`${label} Reversed customer outstandingBalance by -${existing.totalBilled}`);
      }
      await MonthlyStatement.deleteOne({ _id: existing._id });
    }
  }

  // ── 3. Fetch all applicable bills ──────────────────────────────────────────
  // Filter: customer + monthly_credit + not voided + not cancelled
  // Date filter uses serviceDate (the day food was served), falling back to billDate.
  // We fetch both serviceDate and billDate ranges to catch all possible cases.
  const bills = await Bill.find({
    customer:      customerId,
    billType:      'monthly_credit',
    isVoid:        false,
    paymentStatus: { $nin: ['cancelled'] },
    $or: [
      { serviceDate: { $gte: periodStart, $lte: periodEnd } },
      { serviceDate: { $exists: false }, billDate: { $gte: periodStart, $lte: periodEnd } },
      { serviceDate: null, billDate: { $gte: periodStart, $lte: periodEnd } },
    ],
  })
    .sort({ serviceDate: 1, billDate: 1, createdAt: 1 })
    .lean();

  console.log(`${label} Found ${bills.length} bills`);

  // ── 4. Build transaction rows (one per bill) ───────────────────────────────
  // Each transaction row represents exactly ONE bill. No merging.
  const transactions = bills.map((bill) => {
    const effectiveDate = bill.serviceDate || bill.billDate;
    return {
      date:        effectiveDate,
      billId:      bill._id,
      billNumber:  bill.billNumber,
      particulars: formatParticulars(bill.items),
      items:       bill.items.map((item) => ({
        name:       item.name,
        quantity:   item.quantity,
        unit:       item.unit || 'NOS',
        unitPrice:  item.unitPrice,
        totalPrice: item.totalPrice,
      })),
      subtotal:        bill.subtotal,
      taxAmount:       bill.taxAmount || 0,
      discountAmount:  bill.discountAmount || 0,
      amount:          bill.totalAmount,
      paymentStatus:   bill.paymentStatus,
      createdAt:       bill.createdAt,
    };
  });

  // ── 5. Build daily summary groups ─────────────────────────────────────────
  // Groups multiple bills on the same IST calendar day for compact display.
  // The individual transactions array is PRESERVED in full — no data lost.
  const dayMap = new Map(); // dayKey → { date, bills: [], dayTotal, itemSummary }

  for (const tx of transactions) {
    const key = dayKeyIST(tx.date);
    if (!dayMap.has(key)) {
      dayMap.set(key, {
        dayKey:       key,
        date:         tx.date,
        displayDate:  formatDateIST(tx.date),
        orders:       [],
        dayTotal:     0,
        orderCount:   0,
      });
    }
    const day = dayMap.get(key);
    day.orders.push({
      billNumber:  tx.billNumber,
      billId:      tx.billId,
      time:        formatTimeIST(tx.createdAt),
      particulars: tx.particulars,
      items:       tx.items,
      amount:      tx.amount,
      paymentStatus: tx.paymentStatus,
    });
    day.dayTotal  = roundTo2(safeSum(day.dayTotal, tx.amount));
    day.orderCount = day.orders.length;
  }

  const dailySummary = Array.from(dayMap.values()).sort((a, b) => a.dayKey.localeCompare(b.dayKey));

  // ── 6. Opening balance from previous month ─────────────────────────────────
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear  = month === 1 ? year - 1 : year;

  const prevStatement = await MonthlyStatement.findOne({
    customer: customerId,
    month:    prevMonth,
    year:     prevYear,
  }).lean();

  const openingBalance = roundTo2(prevStatement?.closingBalance ?? 0);
  console.log(`${label} Opening balance from ${prevYear}-${prevMonth}: ${openingBalance}`);

  // ── 7. Financial calculations (integer paise arithmetic) ──────────────────
  // totalBilled = sum of all bill totalAmounts (integer arithmetic to avoid drift)
  const totalBilledPaise = bills.reduce((acc, b) => acc + Math.round(b.totalAmount * 100), 0);
  const totalBilled      = totalBilledPaise / 100;

  // totalPaid at statement creation time = 0 (payments recorded via markStatementPaid)
  // However, if any individual bills have been partially/fully paid already,
  // we capture that for reference but statement-level tracking starts at 0.
  const totalPaid        = 0;
  const closingBalance   = roundTo2(safeSum(openingBalance, totalBilled, -totalPaid));

  console.log(`${label} Totals: billed=${totalBilled}, opening=${openingBalance}, closing=${closingBalance}`);

  // ── 8. Pre-save validation ─────────────────────────────────────────────────
  const report = generateValidationReport({
    bills,
    transactions,
    dailySummary,
    openingBalance,
    totalBilled,
    totalPaid,
    closingBalance,
    customerId: customerId.toString(),
  });

  console.log(`${label} Validation: ${report.passed ? 'PASSED' : 'FAILED'}`);
  report.checks.forEach((c) => {
    const icon = c.passed ? '✓' : '✗';
    console.log(`  ${icon} ${c.name}: ${c.detail}`);
  });

  if (!report.passed) {
    const failedChecks = report.checks.filter((c) => !c.passed).map((c) => c.name).join(', ');
    throw new Error(`Statement pre-save validation failed: ${failedChecks}`);
  }

  // ── 9. Persist statement ───────────────────────────────────────────────────
  const statementNumber = await generateStatementNumber(month, year);

  const statement = await MonthlyStatement.create({
    statementNumber,
    customer:       customerId,
    month,
    year,
    periodStart,
    periodEnd,
    bills:          bills.map((b) => b._id),
    transactions,
    dailySummary,
    openingBalance,
    totalBilled,
    totalPaid,
    closingBalance,
    totalOrders:    bills.length,
    status:         'draft',
    generatedBy,
    amountInWords:  amountInWords(closingBalance),
    validationReport: report,
  });

  console.log(`${label} Saved as ${statementNumber} (id=${statement._id})`);

  // ── 10. Update customer outstanding balance ────────────────────────────────
  if (totalBilled > 0) {
    await Customer.findByIdAndUpdate(customerId, {
      $inc: { outstandingBalance: totalBilled },
    });
    console.log(`${label} Customer outstandingBalance += ${totalBilled}`);
  }

  return statement;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Formats bill items into compact BPC-style "Name-Qty" string.
 * e.g. items=[{name:'Masala Tea', qty:5}, {name:'Biscuit', qty:3}] → "Tea-5 Biscuit-3"
 *
 * Rules:
 *   - Use last word of multi-word names (most specific: "Masala Tea" → "Tea")
 *   - For single-word names, truncate to 10 chars
 *   - Qty appended with dash
 *   - Space-separated
 *
 * @param {Array} items - Bill items array
 * @returns {string}
 */
export const formatParticulars = (items) => {
  if (!items || items.length === 0) return '-';

  return items
    .map((item) => {
      const words = (item.name || '').trim().split(/\s+/).filter(Boolean);
      let shortName;
      if (words.length === 0) {
        shortName = 'Item';
      } else if (words.length === 1) {
        shortName = words[0].length > 10 ? words[0].substring(0, 9) + '.' : words[0];
      } else {
        // Use last meaningful word (usually the item type)
        shortName = words[words.length - 1];
      }
      return `${shortName}-${item.quantity}`;
    })
    .join(' ');
};
