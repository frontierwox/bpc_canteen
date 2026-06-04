import api from './axios.instance';

export const menuAPI = {
  getPublicMenu: () => api.get('/menu/public'),
  getPublicMenuByCategory: (categoryId) => api.get(`/menu/public/${categoryId}`),
  getAll: (params) => api.get('/menu', { params }),
  getById: (id) => api.get(`/menu/${id}`),
  create: (formData) => api.post('/menu', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, formData) => api.put(`/menu/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id) => api.delete(`/menu/${id}`),
  setSpecialPrice: (id, data) => api.put(`/menu/${id}/special-price`, data),
  toggleAvailability: (id) => api.put(`/menu/${id}/toggle-availability`),
};

export const categoryAPI = {
  getAll: () => api.get('/categories'),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`),
};
