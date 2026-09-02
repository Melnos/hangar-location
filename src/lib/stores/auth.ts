import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  isAuthenticated: boolean;
  username: string;
  lastSync: string | null;
  setUsername: (username: string) => void;
  logout: () => void;
  setLastSync: (date: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: true,
      username: 'Admin',
      lastSync: null,
      setUsername: (username) => set({ username }),
      logout: () => set({ isAuthenticated: true }),
      setLastSync: (date) => set({ lastSync: date }),
    }),
    {
      name: 'hangar-auth',
    }
  )
);
