import api from './axios.instance';

export const statementAPI = {
  getAll:              (params) => api.get('/statements', { params }),
  getById:             (id)     => api.get(`/statements/${id}`),
  getPDF:              (id)     => api.get(`/statements/${id}/pdf`, { responseType: 'blob' }),
  getCustomerStatements: (customerId) => api.get(`/statements/customer/${customerId}`),
  generate:            (data)   => api.post('/statements/generate', data),
  regenerate:          (id)     => api.post(`/statements/${id}/regenerate`),
  markPaid:            (id, data) => api.put(`/statements/${id}/mark-paid`, data),
  validate:            (id)     => api.get(`/statements/${id}/validate`),
  delete:              (id)     => api.delete(`/statements/${id}`),
};
