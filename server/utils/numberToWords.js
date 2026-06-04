/**
 * Converts a number to Indian English words representation.
 * Supports numbers up to crores (99,99,99,999).
 * Used for bill totals: "Seven Hundred Seventy Seven Rupees Only"
 *
 * @param {number} num - The number to convert
 * @returns {string} Number expressed in words
 */
export const numberToWords = (num) => {
  if (num === 0) return 'Zero';
  if (num < 0) return 'Minus ' + numberToWords(Math.abs(num));

  // Round to 2 decimal places
  num = Math.round(num * 100) / 100;

  const intPart = Math.floor(num);
  const decPart = Math.round((num - intPart) * 100);

  let result = convertIntegerToWords(intPart);

  if (decPart > 0) {
    result += ' and ' + convertIntegerToWords(decPart) + ' Paise';
  }

  return result;
};

/**
 * Converts an integer to words using Indian numbering (Lakhs, Crores).
 * @param {number} num - Integer to convert
 * @returns {string} Words representation
 */
const convertIntegerToWords = (num) => {
  if (num === 0) return '';

  const ones = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven',
    'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen',
    'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen',
  ];

  const tens = [
    '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty',
    'Sixty', 'Seventy', 'Eighty', 'Ninety',
  ];

  if (num < 20) return ones[num];

  if (num < 100) {
    return tens[Math.floor(num / 10)] + (num % 10 !== 0 ? ' ' + ones[num % 10] : '');
  }

  if (num < 1000) {
    return (
      ones[Math.floor(num / 100)] +
      ' Hundred' +
      (num % 100 !== 0 ? ' ' + convertIntegerToWords(num % 100) : '')
    );
  }

  // Indian numbering: Thousands (1,000 - 99,999)
  if (num < 100000) {
    return (
      convertIntegerToWords(Math.floor(num / 1000)) +
      ' Thousand' +
      (num % 1000 !== 0 ? ' ' + convertIntegerToWords(num % 1000) : '')
    );
  }

  // Lakhs (1,00,000 - 99,99,999)
  if (num < 10000000) {
    return (
      convertIntegerToWords(Math.floor(num / 100000)) +
      ' Lakh' +
      (num % 100000 !== 0 ? ' ' + convertIntegerToWords(num % 100000) : '')
    );
  }

  // Crores (1,00,00,000+)
  return (
    convertIntegerToWords(Math.floor(num / 10000000)) +
    ' Crore' +
    (num % 10000000 !== 0 ? ' ' + convertIntegerToWords(num % 10000000) : '')
  );
};

/**
 * Formats amount as "Seven Hundred Seventy Seven Rupees Only"
 * @param {number} amount - The amount
 * @returns {string} Formatted string
 */
export const amountInWords = (amount) => {
  const words = numberToWords(Math.abs(amount));
  return words + ' Rupees Only';
};

/**
 * Formats amount as "Seven Hundred Seventy Seven Rupees"
 * (without "Only" — used in Bill of Supply PDFs).
 * @param {number} amount - The amount
 * @returns {string} Formatted string
 */
export const amountInWordsSimple = (amount) => {
  const words = numberToWords(Math.abs(amount));
  return words + ' Rupees';
};
