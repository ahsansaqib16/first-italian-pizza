import api from './api';

export const getIngredients  = (params) => api.get('/inventory', { params });
export const createIngredient= (data)   => api.post('/inventory', data);
export const updateIngredient= (id, data) => api.put(`/inventory/${id}`, data);
export const restockIngredient= (id, amount) => api.put(`/inventory/${id}/restock`, { amount });
export const deleteIngredient= (id)     => api.delete(`/inventory/${id}`);
