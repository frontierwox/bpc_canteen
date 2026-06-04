/**
 * Formats a number as Indian Rupees (INR).
 * @param {number} amount - The amount to format
 * @returns {string} Formatted currency string (e.g., "₹1,234")
 */
export const formatINR = (amount) => {
  if (amount == null || isNaN(amount)) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

/**
 * Formats a number with Indian comma system (no currency symbol).
 * @param {number} amount
 * @returns {string}
 */
export const formatNumber = (amount) => {
  if (amount == null || isNaN(amount)) return '0';
  return new Intl.NumberFormat('en-IN').format(amount);
};
