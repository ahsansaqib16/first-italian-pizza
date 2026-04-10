import api from './api';

export const getSummary    = ()       => api.get('/reports/summary');
export const getDaily      = (date)   => api.get('/reports/daily', { params: { date } });
export const getMonthly    = (year, month) => api.get('/reports/monthly', { params: { year, month } });
export const getTopProducts= (params) => api.get('/reports/top-products', { params });
export const getByCategory = (params) => api.get('/reports/by-category', { params });
