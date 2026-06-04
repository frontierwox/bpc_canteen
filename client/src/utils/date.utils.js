import { format, formatDistanceToNow, parseISO, isValid } from 'date-fns';

/**
 * Formats a date as DD/MM/YYYY (Indian standard).
 */
export const formatDate = (date) => {
  if (!date) return '';
  const d = typeof date === 'string' ? parseISO(date) : new Date(date);
  return isValid(d) ? format(d, 'dd/MM/yyyy') : '';
};

/**
 * Formats a date with time (DD/MM/YYYY HH:mm).
 */
export const formatDateTime = (date) => {
  if (!date) return '';
  const d = typeof date === 'string' ? parseISO(date) : new Date(date);
  return isValid(d) ? format(d, 'dd/MM/yyyy HH:mm') : '';
};

/**
 * Returns relative time (e.g., "2 hours ago").
 */
export const timeAgo = (date) => {
  if (!date) return '';
  const d = typeof date === 'string' ? parseISO(date) : new Date(date);
  return isValid(d) ? formatDistanceToNow(d, { addSuffix: true }) : '';
};

/**
 * Formats month/year for display (e.g., "April 2026").
 */
export const formatMonthYear = (month, year) => {
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return `${monthNames[month - 1]} ${year}`;
};

/**
 * Returns YYYY-MM-DD for input[type="date"].
 */
export const toInputDate = (date) => {
  if (!date) return '';
  const d = typeof date === 'string' ? parseISO(date) : new Date(date);
  return isValid(d) ? format(d, 'yyyy-MM-dd') : '';
};
