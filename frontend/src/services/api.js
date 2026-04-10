import axios from 'axios';
import toast from 'react-hot-toast';

// In dev (Vite proxy), use /api — proxy rewrites to http://127.0.0.1:4000
// In production (Electron loads file://), call backend directly
const BASE_URL = window.location.protocol === 'file:'
  ? 'http://127.0.0.1:4000/api'
  : '/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
});

// Re-attach token on every request (in case of page reload)
api.interceptors.request.use((config) => {
  const stored = localStorage.getItem('pizza-auth');
  if (stored) {
    try {
      const { state } = JSON.parse(stored);
      if (state?.token) config.headers['Authorization'] = `Bearer ${state.token}`;
    } catch {}
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg = err.response?.data?.message || err.message || 'Something went wrong';
    if (err.response?.status === 401) {
      localStorage.removeItem('pizza-auth');
      window.location.href = '/login';
    }
    toast.error(msg);
    return Promise.reject(err);
  }
);

export default api;
