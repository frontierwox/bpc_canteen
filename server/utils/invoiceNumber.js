import Settings from '../models/Settings.model.js';

/**
 * Generates a unique, thread-safe invoice number using atomic $inc.
 * Format: BPC001, BPC002, ... BPC999, BPC1000
 *
 * Uses setDefaultsOnInsert to prevent duplicate-key race conditions
 * when two concurrent requests both attempt to upsert the Settings
 * document for the first time.
 *
 * @returns {Promise<string>} The generated invoice number
 */
export const generateInvoiceNumber = async () => {
  let settings;

  try {
    settings = await Settings.findOneAndUpdate(
      {},
      { $inc: { invoiceCounter: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
  } catch (error) {
    // Handle duplicate key error from concurrent upserts —
    // the document now exists, so a plain $inc will succeed.
    if (error.code === 11000) {
      settings = await Settings.findOneAndUpdate(
        {},
        { $inc: { invoiceCounter: 1 } },
        { new: true }
      );
    } else {
      throw error;
    }
  }

  const counter   = settings.invoiceCounter;
  const prefix    = settings.invoicePrefix || 'BPC';
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
  let settings;

  try {
    settings = await Settings.findOneAndUpdate(
      {},
      { $inc: { statementCounter: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
  } catch (error) {
    if (error.code === 11000) {
      settings = await Settings.findOneAndUpdate(
        {},
        { $inc: { statementCounter: 1 } },
        { new: true }
      );
    } else {
      throw error;
    }
  }

  const counter  = settings.statementCounter;
  const prefix   = settings.invoicePrefix || 'BPC';
  const monthStr = String(month).padStart(2, '0');

  return `${prefix}-STMT-${year}-${monthStr}-${String(counter).padStart(3, '0')}`;
};
