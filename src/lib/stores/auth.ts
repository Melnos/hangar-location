import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  isAuthenticated: boolean;
  userId: string | null;
  username: string;
  token: string | null;
  lastSync: string | null;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  setUsername: (username: string) => void;
  setLastSync: (date: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      userId: null,
      username: '',
      token: null,
      lastSync: null,

      login: async (username: string, password: string) => {
        try {
          const response = await fetch('/api/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'login', username: username.trim(), password }),
          });

          const result = await response.json();

          if (result.success) {
            set({
              isAuthenticated: true,
              userId: result.user.id,
              username: result.user.username,
              token: btoa(`${username.trim()}:${password}`),
              lastSync: result.user.lastLogin,
            });
            return { success: true };
          }

          return { success: false, error: result.error };
        } catch (error) {
          return { success: false, error: 'Erreur de connexion' };
        }
      },

      register: async (username: string, password: string) => {
        try {
          const response = await fetch('/api/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'register', username: username.trim(), password }),
          });

          const result = await response.json();

          if (result.success) {
            set({
              isAuthenticated: true,
              userId: result.user.id,
              username: result.user.username,
              token: btoa(`${username.trim()}:${password}`),
              lastSync: result.user.createdAt,
            });
            return { success: true };
          }

          return { success: false, error: result.error };
        } catch (error) {
          return { success: false, error: 'Erreur de connexion' };
        }
      },

      logout: () => set({ isAuthenticated: false, userId: null, username: '', token: null }),

      setUsername: (username) => set({ username }),
      setLastSync: (date) => set({ lastSync: date }),
    }),
    {
      name: 'hangar-auth',
    }
  )
);
