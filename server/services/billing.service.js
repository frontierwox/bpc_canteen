import Bill from '../models/Bill.model.js';
import Customer from '../models/Customer.model.js';
import MonthlyStatement from '../models/MonthlyStatement.model.js';
import { generateStatementNumber } from '../utils/invoiceNumber.js';
import { amountInWords } from '../utils/numberToWords.js';

/**
 * Generates (or regenerates) a monthly statement for a customer.
 *
 * Flow:
 *   1. Fetch ALL monthly_credit bills for the customer in the given month.
 *   2. Each bill becomes exactly ONE transaction row:
 *        date = serviceDate  |  particulars = "Tea.5 Biscuits.3 Snack.1"  |  amount = totalAmount
 *   3. Opening balance = previous month's closingBalance (or 0).
 *   4. closingBalance = openingBalance + totalBilled − totalPaid.
 *   5. If a statement already exists for this period and forceRegenerate=true,
 *      delete it first and recreate fresh.
 *
 * @param {string}  customerId      - Customer ObjectId
 * @param {number}  month           - 1-12
 * @param {number}  year            - e.g. 2026
 * @param {string}  generatedBy     - User ObjectId
 * @param {boolean} forceRegenerate - If true, overwrites an existing statement
 */
export const generateMonthlyStatement = async (
  customerId,
  month,
  year,
  generatedBy,
  forceRegenerate = false
) => {
  const periodStart = new Date(year, month - 1, 1);
  const periodEnd   = new Date(year, month, 0, 23, 59, 59, 999); // last ms of last day

  // ── Handle regeneration ────────────────────────────────────────────────────
  if (forceRegenerate) {
    const existing = await MonthlyStatement.findOne({
      customer: customerId,
      month,
      year,
    });
    if (existing) {
      // Reverse any outstanding-balance contribution that was added during original generation
      // (we'll re-add the new amount below)
      await Customer.findByIdAndUpdate(customerId, {
        $inc: { outstandingBalance: -(existing.closingBalance - existing.openingBalance) },
      });
      await MonthlyStatement.deleteOne({ _id: existing._id });
    }
  }

  // ── Fetch all credit bills for this customer in this period ───────────────
  const bills = await Bill.find({
    customer:      customerId,
    billType:      'monthly_credit',
    serviceDate:   { $gte: periodStart, $lte: periodEnd },
    isVoid:        false,
    paymentStatus: { $ne: 'cancelled' },
  })
    .populate('items.menuItem')
    .sort({ serviceDate: 1, createdAt: 1 });

  // ── Build one transaction row per bill ────────────────────────────────────
  const transactions = bills.map((bill) => ({
    date:        bill.serviceDate || bill.billDate,
    billNumber:  bill.billNumber,
    particulars: formatParticulars(bill.items),
    amount:      bill.totalAmount,
  }));

  // ── Opening balance from previous month's statement ───────────────────────
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear  = month === 1 ? year - 1 : year;

  const prevStatement = await MonthlyStatement.findOne({
    customer: customerId,
    month:    prevMonth,
    year:     prevYear,
  });

  const openingBalance = prevStatement?.closingBalance ?? 0;
  const totalBilled    = transactions.reduce((sum, t) => sum + t.amount, 0);
  const totalPaid      = 0; // updated later via markStatementPaid
  const closingBalance = openingBalance + totalBilled - totalPaid;

  // ── Create statement ───────────────────────────────────────────────────────
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
    openingBalance,
    totalBilled,
    totalPaid,
    closingBalance,
    status:         'draft',
    generatedBy,
    amountInWords:  amountInWords(closingBalance),
  });

  // ── Update customer outstanding balance (add new billed amount) ───────────
  if (totalBilled > 0) {
    await Customer.findByIdAndUpdate(customerId, {
      $inc: { outstandingBalance: totalBilled },
    });
  }

  return statement;
};

/**
 * Formats bill items into the exact BPC reference style:
 *   "Tea.5 Biscuits.3 Snack.1"  or  "Tea 5 Biscuits 3 Snack 1"
 *
 * Rules:
 *   - Name shortened to first word (split on space) — keeps it compact
 *   - qty appended with a dot separator matching the handwritten reference
 *   - Multiple items space-separated
 *
 * @param {Array} items - Bill line items
 * @returns {string}
 */
export const formatParticulars = (items) => {
  if (!items || items.length === 0) return '-';

  return items
    .map((item) => {
      // Take first word of name (e.g. "Masala Tea" → "Tea", "Veg Snack" → "Snack")
      const words = item.name.trim().split(/\s+/);
      let shortName;

      if (words.length === 1) {
        // Single word: truncate to 8 chars max
        shortName = words[0].length > 8 ? words[0].substring(0, 7) + '.' : words[0];
      } else {
        // Multi-word: use last meaningful word (usually the item type, e.g. Tea/Snack/Coffee)
        shortName = words[words.length - 1];
      }

      return `${shortName}-${item.quantity}`;
    })
    .join(' ');
};
