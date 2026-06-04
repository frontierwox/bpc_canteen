import api from './axios.instance';

/**
 * Invoice API endpoints for Bill of Supply PDF generation.
 * Uses the auth-protected /api/v1/invoice endpoint.
 */
export const invoiceAPI = {
  /**
   * Generates a Bill of Supply PDF from provided invoice data.
   * Returns a blob response for file download.
   *
   * @param {Object} data - Invoice data
   * @param {string} data.invoiceNo - Invoice number
   * @param {string} data.invoiceDate - Invoice date (DD/MM/YYYY)
   * @param {string} data.billTo - Customer name
   * @param {string} data.placeOfSupply - Place of supply
   * @param {number} [data.receivedAmount] - Amount received (default 0)
   * @param {Array<{name: string, qty: number, rate: number}>} data.items - Line items
   * @returns {Promise} Axios response with blob data
   */
  generate: (data) =>
    api.post('/invoice/generate', data, { responseType: 'blob' }),
};
