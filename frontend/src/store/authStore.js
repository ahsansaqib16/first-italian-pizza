import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../services/api';

export const useAuthStore = create(
  persist(
    (set) => ({
      token: null,
      user:  null,

      login: async (email, password) => {
        const { data } = await api.post('/auth/login', { email, password });
        api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
        set({ token: data.token, user: data.user });
        return data;
      },

      logout: () => {
        delete api.defaults.headers.common['Authorization'];
        set({ token: null, user: null });
      },

      setUser: (user) => set({ user }),
    }),
    {
      name: 'pizza-auth',
      onRehydrateStorage: () => (state) => {
        // Re-attach token after hydration
        if (state?.token) {
          api.defaults.headers.common['Authorization'] = `Bearer ${state.token}`;
        }
      },
    }
  )
);
