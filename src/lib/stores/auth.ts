import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { db, type User } from '@/lib/db';
import { hashPassword } from '@/lib/utils/auth';
import { v4 as uuidv4 } from 'uuid';
import { syncService } from '@/lib/sync';

const ADMIN_KEY = 'hangar-admin-registered';

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
  isAdmin: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
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
      isAdmin: false,

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
              isAdmin: true,
            });
            setTimeout(() => syncService.syncWithServer(), 500);
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
            isAdmin: true,
          });
          setTimeout(() => syncService.syncWithServer(), 500);
          return { success: true };
        }
      },

      register: async (username: string, password: string) => {
        // Check if admin already exists
        const adminExists = localStorage.getItem(ADMIN_KEY);
        const userCount = await db.users.count();

        if (adminExists || userCount > 0) {
          return { success: false, error: 'Un administrateur existe deja. Inscription reservee a l\'administrateur.' };
        }

        try {
          const response = await fetch('/api/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'register', username: username.trim(), password }),
          });

          const result = await response.json();

          if (result.success) {
            localStorage.setItem(ADMIN_KEY, 'true');
            await clearLocalData();
            set({
              isAuthenticated: true,
              userId: result.user.id,
              username: result.user.username,
              token: btoa(`${username.trim()}:${password}`),
              lastSync: result.user.createdAt,
              isAdmin: true,
            });
            setTimeout(() => syncService.syncWithServer(), 500);
            return { success: true };
          }

          return { success: false, error: result.error };
        } catch {
          const hashedPassword = hashPassword(password);
          const existing = await db.users.where('username').equals(username.trim()).first();

          if (existing) {
            return { success: false, error: 'Nom d\'utilisateur deja pris' };
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
          localStorage.setItem(ADMIN_KEY, 'true');
          await clearLocalData();

          set({
            isAuthenticated: true,
            userId: id,
            username: username.trim(),
            token: btoa(`${username.trim()}:${hashedPassword}`),
            lastSync: now,
            isAdmin: true,
          });
          setTimeout(() => syncService.syncWithServer(), 500);
          return { success: true };
        }
      },

      logout: async () => {
        await clearLocalData();
        set({ isAuthenticated: false, userId: null, username: '', token: null, isAdmin: false });
      },

      setUsername: (username) => set({ username }),
      setLastSync: (date) => set({ lastSync: date }),
    }),
    {
      name: 'hangar-auth',
    }
  )
);
