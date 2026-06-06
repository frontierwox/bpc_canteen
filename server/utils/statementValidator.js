/**
 * statementValidator.js — Pre-save validation & reconciliation for monthly statements.
 *
 * Before any statement is persisted, this module verifies:
 *   ✓ Total orders count matches bills array length
 *   ✓ Daily totals sum to monthly total
 *   ✓ Monthly total matches sum of all transaction amounts
 *   ✓ Grand total formula: openingBalance + totalBilled - totalPaid = closingBalance
 *   ✓ No duplicate bill IDs in the statement
 *   ✓ No bill belongs to a different customer
 *
 * Throws descriptive errors if any check fails, so problems are caught
 * before they reach the database.
 */

import { safeSum, roundTo2 } from './dateHelpers.js';

/**
 * Validates the computed statement data before saving to MongoDB.
 *
 * @param {Object} params
 * @param {Array}  params.bills        - Mongoose Bill documents
 * @param {Array}  params.transactions - Computed transaction rows
 * @param {Array}  params.dailySummary - Computed daily summary groups
 * @param {number} params.openingBalance
 * @param {number} params.totalBilled
 * @param {number} params.totalPaid
 * @param {number} params.closingBalance
 * @param {string} params.customerId   - Expected customer ObjectId string
 * @throws {Error} if any validation fails
 */
export function validateStatementData({
  bills,
  transactions,
  dailySummary,
  openingBalance,
  totalBilled,
  totalPaid,
  closingBalance,
  customerId,
}) {
  const errors = [];

  // ── 1. No duplicate bill IDs ───────────────────────────────────────
  const billIds = bills.map((b) => b._id.toString());
  const uniqueIds = new Set(billIds);
  if (uniqueIds.size !== billIds.length) {
    errors.push(`Duplicate bills detected: ${billIds.length - uniqueIds.size} duplicates`);
  }

  // ── 2. All bills belong to the correct customer ────────────────────
  const wrongCustomer = bills.filter((b) => b.customer.toString() !== customerId.toString());
  if (wrongCustomer.length > 0) {
    errors.push(`${wrongCustomer.length} bill(s) do not belong to customer ${customerId}: ${wrongCustomer.map(b => b.billNumber).join(', ')}`);
  }

  // ── 3. Transaction count matches bills count ───────────────────────
  if (transactions.length !== bills.length) {
    errors.push(`Transaction count (${transactions.length}) does not match bill count (${bills.length})`);
  }

  // ── 4. Sum of transaction amounts = totalBilled ────────────────────
  const txSum = roundTo2(transactions.reduce((acc, t) => safeSum(acc, t.amount), 0));
  const expectedTotalBilled = roundTo2(bills.reduce((acc, b) => safeSum(acc, b.totalAmount), 0));

  if (Math.abs(txSum - expectedTotalBilled) > 0.01) {
    errors.push(`Transaction sum (${txSum}) ≠ expected total billed (${expectedTotalBilled})`);
  }

  if (Math.abs(totalBilled - expectedTotalBilled) > 0.01) {
    errors.push(`Declared totalBilled (${totalBilled}) ≠ calculated (${expectedTotalBilled})`);
  }

  // ── 5. Daily summary totals sum to totalBilled ─────────────────────
  if (dailySummary && dailySummary.length > 0) {
    const dailySum = roundTo2(dailySummary.reduce((acc, d) => safeSum(acc, d.dayTotal), 0));
    if (Math.abs(dailySum - totalBilled) > 0.01) {
      errors.push(`Daily totals sum (${dailySum}) ≠ totalBilled (${totalBilled})`);
    }
  }

  // ── 6. Closing balance formula ─────────────────────────────────────
  const expectedClosing = roundTo2(safeSum(openingBalance, totalBilled, -totalPaid));
  if (Math.abs(closingBalance - expectedClosing) > 0.01) {
    errors.push(`closingBalance (${closingBalance}) ≠ openingBalance(${openingBalance}) + totalBilled(${totalBilled}) - totalPaid(${totalPaid}) = ${expectedClosing}`);
  }

  // ── 7. Non-negative amounts ────────────────────────────────────────
  if (totalBilled < 0) errors.push('totalBilled cannot be negative');
  if (totalPaid < 0) errors.push('totalPaid cannot be negative');
  if (openingBalance < 0) errors.push('openingBalance cannot be negative');

  if (errors.length > 0) {
    throw new Error(`Statement validation failed:\n  • ${errors.join('\n  • ')}`);
  }

  return true;
}

/**
 * Generates a validation report for logging/debugging.
 * Non-throwing version of validateStatementData.
 *
 * @param {Object} params - same as validateStatementData
 * @returns {{ passed: boolean, checks: Array<{name: string, passed: boolean, detail: string}> }}
 */
export function generateValidationReport({
  bills,
  transactions,
  dailySummary,
  openingBalance,
  totalBilled,
  totalPaid,
  closingBalance,
  customerId,
}) {
  const checks = [];

  const addCheck = (name, condition, detail) => {
    checks.push({ name, passed: condition, detail });
  };

  const billIds = bills.map((b) => b._id.toString());
  const uniqueIds = new Set(billIds);
  addCheck('No duplicate bills', uniqueIds.size === billIds.length, `${bills.length} bills, ${uniqueIds.size} unique`);

  const wrongCustomer = bills.filter((b) => b.customer.toString() !== customerId.toString());
  addCheck('All bills belong to customer', wrongCustomer.length === 0, `${wrongCustomer.length} mismatches`);

  addCheck('Transaction count = bill count', transactions.length === bills.length, `${transactions.length} tx, ${bills.length} bills`);

  const txSum = roundTo2(transactions.reduce((acc, t) => safeSum(acc, t.amount), 0));
  const expectedBilled = roundTo2(bills.reduce((acc, b) => safeSum(acc, b.totalAmount), 0));
  addCheck('Transaction sum = expected total', Math.abs(txSum - expectedBilled) <= 0.01, `tx sum=${txSum}, expected=${expectedBilled}`);

  addCheck('Declared totalBilled correct', Math.abs(totalBilled - expectedBilled) <= 0.01, `declared=${totalBilled}, calc=${expectedBilled}`);

  const expectedClosing = roundTo2(safeSum(openingBalance, totalBilled, -totalPaid));
  addCheck('Closing balance formula', Math.abs(closingBalance - expectedClosing) <= 0.01, `${openingBalance}+${totalBilled}-${totalPaid}=${expectedClosing}, declared=${closingBalance}`);

  if (dailySummary && dailySummary.length > 0) {
    const dailySum = roundTo2(dailySummary.reduce((acc, d) => safeSum(acc, d.dayTotal), 0));
    addCheck('Daily totals sum = totalBilled', Math.abs(dailySum - totalBilled) <= 0.01, `daily sum=${dailySum}, totalBilled=${totalBilled}`);
  }

  const passed = checks.every((c) => c.passed);
  return { passed, checks };
}
