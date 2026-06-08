/**
 * escapeRegex.js — Sanitises user-supplied strings for safe MongoDB $regex usage.
 *
 * Without escaping, a search term like "((((" or ".*" can cause catastrophic
 * backtracking in the regex engine (ReDoS attack). This helper escapes every
 * special regex character so the string is treated as a literal search term.
 *
 * Usage:
 *   import escapeRegex from '../utils/escapeRegex.js';
 *   filter.name = { $regex: escapeRegex(req.query.search), $options: 'i' };
 *
 * @param {string} str - Raw user input
 * @returns {string} Escaped string safe for use in RegExp / MongoDB $regex
 */
const escapeRegex = (str) =>
  String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export default escapeRegex;
