import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { db, type User } from '@/lib/db';
import { hashPassword } from '@/lib/utils/auth';
import { v4 as uuidv4 } from 'uuid';

async function clearLocalData() {
  await db.vehicules.clear();
  await db.locataires.clear();
  await db.contrats.clear();
  await db.documents_vehicule.clear();
  await db.maintenances.clear();
  await db.notifications.clear();
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
          const response = await fetch('/api/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'login', username: username.trim(), password }),
          });

          const result = await response.json();

          if (result.success) {
            await clearLocalData();
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
        } catch {
          const hashedPassword = hashPassword(password);
          const user = await db.users.where('username').equals(username.trim()).first();

          if (!user) {
            return { success: false, error: 'Identifiants incorrects' };
          }

          if (user.password !== hashedPassword) {
            return { success: false, error: 'Identifiants incorrects' };
          }

          await db.users.update(user.id, { lastLogin: new Date().toISOString() });
          await clearLocalData();

          set({
            isAuthenticated: true,
            userId: user.id,
            username: user.username,
            token: btoa(`${username.trim()}:${hashedPassword}`),
            lastSync: user.lastLogin,
          });
          return { success: true };
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
            await clearLocalData();
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
        } catch {
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
          await clearLocalData();

          set({
            isAuthenticated: true,
            userId: id,
            username: username.trim(),
            token: btoa(`${username.trim()}:${hashedPassword}`),
            lastSync: now,
          });
          return { success: true };
        }
      },

      logout: () => {
        clearLocalData();
        set({ isAuthenticated: false, userId: null, username: '', token: null });
      },

      setUsername: (username) => set({ username }),
      setLastSync: (date) => set({ lastSync: date }),
    }),
    {
      name: 'hangar-auth',
    }
  )
);
