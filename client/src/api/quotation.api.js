import api from './axios.instance';

/**
 * Quotation API endpoints for the Quotation Generator.
 * Uses the auth-protected /api/v1/quotations endpoint.
 */
export const quotationAPI = {
  getAll: (params) => api.get('/quotations', { params }),
  getById: (id) => api.get(`/quotations/${id}`),
  create: (data) => api.post('/quotations', data),
  getPDF: (id) => api.get(`/quotations/${id}/pdf`, { responseType: 'blob' }),
  convertToInvoice: (id) => api.post(`/quotations/${id}/convert`),
  updateStatus: (id, status) => api.patch(`/quotations/${id}/status`, { status }),
  delete: (id) => api.delete(`/quotations/${id}`),
};
