import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  isAuthenticated: boolean;
  isFirstLogin: boolean;
  username: string;
  password: string;
  lastSync: string | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  changeCredentials: (newUsername: string, newPassword: string) => void;
  setLastSync: (date: string) => void;
}

const DEFAULT_USERNAME = 'Admin';
const DEFAULT_PASSWORD = 'admin123';

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      isFirstLogin: true,
      username: '',
      password: '',
      lastSync: null,
      login: (username: string, password: string) => {
        const state = get();
        if (state.isFirstLogin) {
          if (username === DEFAULT_USERNAME && password === DEFAULT_PASSWORD) {
            set({ isAuthenticated: true, username, password });
            return true;
          }
          return false;
        } else {
          if (username === state.username && password === state.password) {
            set({ isAuthenticated: true });
            return true;
          }
          return false;
        }
      },
      logout: () => set({ isAuthenticated: false }),
      changeCredentials: (newUsername: string, newPassword: string) => {
        set({
          username: newUsername,
          password: newPassword,
          isFirstLogin: false,
        });
      },
      setLastSync: (date: string) => set({ lastSync: date }),
    }),
    {
      name: 'hangar-auth',
    }
  )
);
