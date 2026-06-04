import Settings from '../models/Settings.model.js';

/**
 * Generates a unique, thread-safe invoice number using atomic $inc.
 * Format: BPC001, BPC002, ... BPC999, BPC1000
 *
 * @returns {Promise<string>} The generated invoice number
 */
export const generateInvoiceNumber = async () => {
  const settings = await Settings.findOneAndUpdate(
    {},
    { $inc: { invoiceCounter: 1 } },
    { new: true, upsert: true }
  );

  const counter = settings.invoiceCounter;
  const prefix = settings.invoicePrefix || 'BPC';
  const padLength = Math.max(3, String(counter).length);

  return `${prefix}${String(counter).padStart(padLength, '0')}`;
};

/**
 * Generates a unique statement number.
 * Format: BPC-STMT-2026-04-001
 *
 * @param {number} month - Month number (1-12)
 * @param {number} year - Year (e.g., 2026)
 * @returns {Promise<string>} The generated statement number
 */
export const generateStatementNumber = async (month, year) => {
  const settings = await Settings.findOneAndUpdate(
    {},
    { $inc: { statementCounter: 1 } },
    { new: true, upsert: true }
  );

  const counter = settings.statementCounter;
  const prefix = settings.invoicePrefix || 'BPC';
  const monthStr = String(month).padStart(2, '0');

  return `${prefix}-STMT-${year}-${monthStr}-${String(counter).padStart(3, '0')}`;
};
