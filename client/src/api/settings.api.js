import api from './axios.instance';

export const settingsAPI = {
  get: () => api.get('/settings'),
  update: (data) => api.put('/settings', data),
  getQR: (baseUrl) => api.get('/settings/qr', { params: { baseUrl } }),
  uploadLogo: (formData) => api.post('/settings/logo', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
};
