/**
 * Auth Store — Zustand
 * Manages authentication state.
 */
import { create } from 'zustand';
import { api } from '@/api/client';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'staff' | 'client' | 'guest';
  department?: string;
  rank?: string;
  level?: number;
  lpBalance?: number;
  avatar?: string;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: false,

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const res = await api.post<{ token: string; user: AuthUser }>('/admin/auth/login', { email, password });
      localStorage.setItem('loop_token', res.token);
      localStorage.setItem('loop_user', JSON.stringify(res.user));
      set({ user: res.user, token: res.token, isLoading: false });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  logout: () => {
    localStorage.removeItem('loop_token');
    localStorage.removeItem('loop_user');
    set({ user: null, token: null });
  },

  checkAuth: async () => {
    const token = localStorage.getItem('loop_token');
    const savedUser = localStorage.getItem('loop_user');
    if (!token) return;

    if (savedUser) {
      try {
        set({ user: JSON.parse(savedUser), token });
        const res = await api.get<{ user: AuthUser }>('/admin/auth/me');
        localStorage.setItem('loop_user', JSON.stringify(res.user));
        set({ user: res.user });
      } catch {
        get().logout();
      }
    }
  },
}));
