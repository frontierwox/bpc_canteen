import api from './axios.instance';

/**
 * Invoice API endpoints for standalone Invoice Generator.
 * Uses the auth-protected /api/v1/invoices endpoint.
 */
export const invoiceAPI = {
  getAll: (params) => api.get('/invoices', { params }),
  getById: (id) => api.get(`/invoices/${id}`),
  create: (data) => api.post('/invoices', data),
  getPDF: (id) => api.get(`/invoices/${id}/pdf`, { responseType: 'blob' }),
  delete: (id) => api.delete(`/invoices/${id}`),

  // Legacy Bill of Supply generation (kept for backward compatibility)
  generate: (data) =>
    api.post('/invoice/generate', data, { responseType: 'blob' }),
};
