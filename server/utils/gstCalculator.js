/**
 * gstCalculator.js — Centralized GST Calculation Utility
 *
 * Single source of truth for all CGST/SGST calculations across the application.
 * Uses integer paise arithmetic (×100) to prevent floating-point cumulative errors.
 *
 * IMPORTANT: Never duplicate this logic elsewhere. Always import from here.
 *
 * @module utils/gstCalculator
 */

import { roundTo2 } from './dateHelpers.js';

/**
 * Calculates CGST, SGST, total tax, and grand total from a subtotal.
 *
 * @param {number} subtotal  - Pre-tax sum of all line items (in rupees)
 * @param {number} cgstRate  - CGST percentage (e.g., 2.5 for 2.5%)
 * @param {number} sgstRate  - SGST percentage (e.g., 2.5 for 2.5%)
 * @param {number} [discount=0] - Discount amount to subtract (in rupees)
 * @returns {{
 *   subtotal:    number,
 *   cgstRate:    number,
 *   sgstRate:    number,
 *   cgstAmount:  number,
 *   sgstAmount:  number,
 *   taxRate:     number,
 *   taxAmount:   number,
 *   discount:    number,
 *   totalAmount: number
 * }}
 */
export function calculateGST(subtotal, cgstRate = 2.5, sgstRate = 2.5, discount = 0) {
  const safeSubtotal = Math.max(0, Number(subtotal) || 0);
  const safeCGST     = Math.max(0, Math.min(50, Number(cgstRate) || 0));
  const safeSGST     = Math.max(0, Math.min(50, Number(sgstRate) || 0));
  const safeDiscount = Math.max(0, Number(discount) || 0);

  // Integer paise arithmetic to avoid floating-point drift
  const subtotalPaise  = Math.round(safeSubtotal * 100);
  const cgstPaise      = Math.round(subtotalPaise * safeCGST / 100);
  const sgstPaise      = Math.round(subtotalPaise * safeSGST / 100);
  const taxPaise       = cgstPaise + sgstPaise;
  const discountPaise  = Math.round(safeDiscount * 100);
  const totalPaise     = subtotalPaise + taxPaise - discountPaise;

  return {
    subtotal:    roundTo2(subtotalPaise / 100),
    cgstRate:    safeCGST,
    sgstRate:    safeSGST,
    cgstAmount:  roundTo2(cgstPaise / 100),
    sgstAmount:  roundTo2(sgstPaise / 100),
    taxRate:     roundTo2(safeCGST + safeSGST),
    taxAmount:   roundTo2(taxPaise / 100),
    discount:    roundTo2(discountPaise / 100),
    totalAmount: roundTo2(Math.max(0, totalPaise) / 100),
  };
}

/**
 * Validates that GST rates are within acceptable bounds.
 *
 * @param {number} cgstRate
 * @param {number} sgstRate
 * @returns {{ valid: boolean, message?: string }}
 */
export function validateGSTRates(cgstRate, sgstRate) {
  const cgst = Number(cgstRate);
  const sgst = Number(sgstRate);

  if (isNaN(cgst) || isNaN(sgst)) {
    return { valid: false, message: 'GST rates must be valid numbers.' };
  }
  if (cgst < 0 || cgst > 50) {
    return { valid: false, message: 'CGST rate must be between 0 and 50%.' };
  }
  if (sgst < 0 || sgst > 50) {
    return { valid: false, message: 'SGST rate must be between 0 and 50%.' };
  }
  if (cgst + sgst > 100) {
    return { valid: false, message: 'Combined GST rate cannot exceed 100%.' };
  }

  return { valid: true };
}
