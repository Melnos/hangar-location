import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  isAuthenticated: boolean;
  username: string;
  password: string;
  lastSync: string | null;
  setUsername: (username: string) => void;
  setPassword: (password: string) => void;
  logout: () => void;
  setLastSync: (date: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: true,
      username: 'Admin',
      password: '',
      lastSync: null,
      setUsername: (username) => set({ username }),
      setPassword: (password) => set({ password }),
      logout: () => set({ isAuthenticated: false }),
      setLastSync: (date) => set({ lastSync: date }),
    }),
    {
      name: 'hangar-auth',
    }
  )
);
