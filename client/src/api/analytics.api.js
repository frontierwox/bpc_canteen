import api from './axios.instance';

export const analyticsAPI = {
  getSummary: () => api.get('/analytics/summary'),
  getMonthlyRevenue: () => api.get('/analytics/monthly-revenue'),
  getTopItems: () => api.get('/analytics/top-items'),
  getPaymentStatus: () => api.get('/analytics/payment-status'),
  getCustomerOutstanding: () => api.get('/analytics/customer-outstanding'),
};
