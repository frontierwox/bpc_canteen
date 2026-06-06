/**
 * dateHelpers.js — UTC-safe date boundary utilities
 *
 * All billing date operations must use these helpers to avoid:
 *   - Timezone boundary bugs (IST midnight ≠ UTC midnight)
 *   - Month-end overflow (e.g., Feb 30 rolling to Mar 2)
 *   - Missing records at period edges
 *
 * Strategy: All dates stored in MongoDB are UTC. When a user selects
 * "June 2026" (IST), we want records whose serviceDate falls within
 * 2026-06-01 00:00:00.000 IST to 2026-06-30 23:59:59.999 IST.
 * In UTC this is: 2026-05-31T18:30:00.000Z to 2026-06-30T18:29:59.999Z.
 *
 * The helpers below handle this correctly by accepting an explicit
 * UTC-offset string (default: '+05:30' for IST).
 */

/**
 * Returns the inclusive UTC start of a calendar month in the given timezone.
 *
 * @param {number} year  - e.g. 2026
 * @param {number} month - 1-12
 * @param {string} tzOffsetMinutes - timezone offset in minutes from UTC (default 330 = IST +5:30)
 * @returns {Date} UTC Date representing 00:00:00.000 on day 1 of that month in the given TZ
 */
export function periodStartUTC(year, month, tzOffsetMinutes = 330) {
  // Local midnight on 1st of month = UTC midnight minus TZ offset
  const localMidnightMs = Date.UTC(year, month - 1, 1, 0, 0, 0, 0);
  return new Date(localMidnightMs - tzOffsetMinutes * 60 * 1000);
}

/**
 * Returns the inclusive UTC end of a calendar month in the given timezone.
 *
 * @param {number} year  - e.g. 2026
 * @param {number} month - 1-12
 * @param {string} tzOffsetMinutes - timezone offset in minutes from UTC (default 330 = IST +5:30)
 * @returns {Date} UTC Date representing 23:59:59.999 on the last day of that month in the given TZ
 */
export function periodEndUTC(year, month, tzOffsetMinutes = 330) {
  // Last ms of last day: start of next month minus 1ms, in local time
  const nextMonthStartMs = Date.UTC(year, month, 1, 0, 0, 0, 0); // first day of next month (UTC naive)
  const lastMsOfMonth = nextMonthStartMs - 1; // 23:59:59.999 of last day
  return new Date(lastMsOfMonth - tzOffsetMinutes * 60 * 1000);
}

/**
 * Formats a Date to DD-MMM-YYYY (e.g. 05-Jun-2026) in IST.
 * @param {Date} date
 * @returns {string}
 */
export function formatDateIST(date) {
  if (!date) return '';
  const d = new Date(date);
  const day = String(d.getUTCDate()).padStart(2, '0');
  // Adjust for IST (+5:30)
  const istMs = d.getTime() + 330 * 60 * 1000;
  const istDate = new Date(istMs);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${String(istDate.getUTCDate()).padStart(2,'0')}-${months[istDate.getUTCMonth()]}-${istDate.getUTCFullYear()}`;
}

/**
 * Formats a Date to DD/MM/YYYY in IST.
 * @param {Date} date
 * @returns {string}
 */
export function formatDateSlashIST(date) {
  if (!date) return '';
  const istMs = new Date(date).getTime() + 330 * 60 * 1000;
  const d = new Date(istMs);
  return `${String(d.getUTCDate()).padStart(2,'0')}/${String(d.getUTCMonth()+1).padStart(2,'0')}/${d.getUTCFullYear()}`;
}

/**
 * Formats a Date to HH:mm in IST (24h).
 * @param {Date} date
 * @returns {string}
 */
export function formatTimeIST(date) {
  if (!date) return '';
  const istMs = new Date(date).getTime() + 330 * 60 * 1000;
  const d = new Date(istMs);
  return `${String(d.getUTCHours()).padStart(2,'0')}:${String(d.getUTCMinutes()).padStart(2,'0')}`;
}

/**
 * Returns a zero-padded IST date key "YYYYMMDD" for grouping bills by day.
 * @param {Date} date
 * @returns {string} e.g. "20260605"
 */
export function dayKeyIST(date) {
  if (!date) return '00000000';
  const istMs = new Date(date).getTime() + 330 * 60 * 1000;
  const d = new Date(istMs);
  return `${d.getUTCFullYear()}${String(d.getUTCMonth()+1).padStart(2,'0')}${String(d.getUTCDate()).padStart(2,'0')}`;
}

/**
 * Financial-grade integer addition: converts to paise (×100), sums, divides back.
 * Prevents floating-point cumulative errors.
 * @param {...number} amounts - amounts in rupees (can be decimals)
 * @returns {number} sum rounded to 2dp
 */
export function safeSum(...amounts) {
  const paiseSum = amounts.reduce((acc, val) => acc + Math.round(Number(val || 0) * 100), 0);
  return paiseSum / 100;
}

/**
 * Rounds to 2 decimal places (banker's rounding NOT used — standard .5 round-up).
 * Only call this at final display stage.
 * @param {number} n
 * @returns {number}
 */
export function roundTo2(n) {
  return Math.round(Number(n || 0) * 100) / 100;
}
