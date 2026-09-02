import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { db, type User } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

function hashPassword(password: string): string {
  if (typeof window !== 'undefined' && window.crypto?.subtle) {
    return btoa(password);
  }
  return typeof btoa === 'function' ? btoa(password) : password;
}

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
          const hashedPassword = hashPassword(password);
          const user = await db.users.where('username').equals(username.trim()).first();

          if (!user) {
            return { success: false, error: 'Identifiants incorrects' };
          }

          if (user.password !== hashedPassword) {
            return { success: false, error: 'Identifiants incorrects' };
          }

          await db.users.update(user.id, { lastLogin: new Date().toISOString() });

          set({
            isAuthenticated: true,
            userId: user.id,
            username: user.username,
            token: btoa(`${username.trim()}:${hashedPassword}`),
            lastSync: user.lastLogin,
          });
          return { success: true };
        } catch (error) {
          return { success: false, error: 'Erreur de connexion' };
        }
      },

      register: async (username: string, password: string) => {
        try {
          const hashedPassword = hashPassword(password);
          const existing = await db.users.where('username').equals(username.trim()).first();

          if (existing) {
            return { success: false, error: 'Nom d\'utilisateur déjà pris' };
          }

          const id = uuidv4();
          const now = new Date().toISOString();
          const newUser: User = {
            id,
            username: username.trim(),
            password: hashedPassword,
            createdAt: now,
            lastLogin: null,
          };

          await db.users.add(newUser);

          set({
            isAuthenticated: true,
            userId: id,
            username: username.trim(),
            token: btoa(`${username.trim()}:${hashedPassword}`),
            lastSync: now,
          });
          return { success: true };
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
