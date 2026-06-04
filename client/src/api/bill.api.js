import api from './axios.instance';

export const billAPI = {
  getAll: (params) => api.get('/bills', { params }),
  getById: (id) => api.get(`/bills/${id}`),
  getPDF: (id) => api.get(`/bills/${id}/pdf`, { responseType: 'blob' }),
  getCustomerBills: (customerId, params) => api.get(`/bills/customer/${customerId}`, { params }),
  create: (data) => api.post('/bills', data),
  update: (id, data) => api.put(`/bills/${id}`, data),
  recordPayment: (id, data) => api.put(`/bills/${id}/payment`, data),
  void: (id, data) => api.delete(`/bills/${id}/void`, { data }),
};
