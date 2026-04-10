import api from './api';

export const getOrders    = (params) => api.get('/orders', { params });
export const getOrder     = (id)     => api.get(`/orders/${id}`);
export const createOrder  = (data)   => api.post('/orders', data);
export const updateStatus = (id, status) => api.put(`/orders/${id}/status`, { status });
export const cancelOrder  = (id)     => api.put(`/orders/${id}/cancel`);
