import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { db, type User } from '@/lib/db';
import { hashPassword } from '@/lib/utils/auth';
import { v4 as uuidv4 } from 'uuid';
import { syncService } from '@/lib/sync';

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
  role: 'admin' | 'user' | null;
  token: string | null;
  lastSync: string | null;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  registerUser: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  setUsername: (username: string) => void;
  setLastSync: (date: string) => void;
  updateAdminCredentials: (newUsername: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      userId: null,
      username: '',
      role: null,
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
              role: result.user.role || 'user',
              token: btoa(`${username.trim()}:${password}`),
              lastSync: result.user.lastLogin,
            });
            setTimeout(() => syncService.syncWithServer(), 500);
            return { success: true };
          }
          return { success: false, error: result.error };
        } catch {
          const hashedPassword = hashPassword(password);
          const user = await db.users.where('username').equals(username.trim()).first();
          if (!user) return { success: false, error: 'Identifiants incorrects' };
          if (user.password !== hashedPassword) return { success: false, error: 'Identifiants incorrects' };
          await db.users.update(user.id, { lastLogin: new Date().toISOString() });
          await clearLocalData();
          set({
            isAuthenticated: true,
            userId: user.id,
            username: user.username,
            role: (user as any).role || 'user',
            token: btoa(`${username.trim()}:${hashedPassword}`),
            lastSync: user.lastLogin,
          });
          setTimeout(() => syncService.syncWithServer(), 500);
          return { success: true };
        }
      },

      register: async (username: string, password: string) => {
        try {
          const response = await fetch('/api/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'register', username: username.trim(), password, role: 'admin' }),
          });
          const result = await response.json();
          if (result.success) {
            await clearLocalData();
            set({
              isAuthenticated: true,
              userId: result.user.id,
              username: result.user.username,
              role: 'admin',
              token: btoa(`${username.trim()}:${password}`),
              lastSync: result.user.createdAt,
            });
            setTimeout(() => syncService.syncWithServer(), 500);
            return { success: true };
          }
          return { success: false, error: result.error };
        } catch {
          const hashedPassword = hashPassword(password);
          const existing = await db.users.where('username').equals(username.trim()).first();
          if (existing) return { success: false, error: 'Nom d\'utilisateur deja pris' };
          const id = uuidv4();
          const now = new Date().toISOString();
          const newUser: User = { id, username: username.trim(), password: hashedPassword, role: 'admin', created_by: null, createdAt: now, lastLogin: null };
          await db.users.add(newUser);
          await clearLocalData();
          set({
            isAuthenticated: true,
            userId: id,
            username: username.trim(),
            role: 'admin',
            token: btoa(`${username.trim()}:${hashedPassword}`),
            lastSync: now,
          });
          setTimeout(() => syncService.syncWithServer(), 500);
          return { success: true };
        }
      },

      registerUser: async (username: string, password: string) => {
        const { role, userId, username: adminUsername } = get();
        if (role !== 'admin') {
          return { success: false, error: 'Seul l\'admin peut inscrire de nouveaux utilisateurs' };
        }
        try {
          const response = await fetch('/api/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'register', username: username.trim(), password, role: 'user', createdBy: userId }),
          });
          const result = await response.json();
          if (result.success) {
            await fetch('/api/activity', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'register_user', details: `Nouvel utilisateur: ${username}` }),
            });
            return { success: true };
          }
          return { success: false, error: result.error };
        } catch {
          return { success: false, error: 'Erreur serveur' };
        }
      },

      updateAdminCredentials: async (newUsername: string, newPassword: string) => {
        const { role, userId } = get();
        if (role !== 'admin' || !userId) {
          return { success: false, error: 'Seul l\'admin peut modifier ses identifiants' };
        }
        try {
          const response = await fetch('/api/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'update_admin', adminId: userId, username: newUsername, password: newPassword }),
          });
          const result = await response.json();
          if (result.success) {
            set({ username: newUsername, token: btoa(`${newUsername}:${newPassword}`) });
            return { success: true };
          }
          return { success: false, error: result.error };
        } catch {
          return { success: false, error: 'Erreur serveur' };
        }
      },

      logout: async () => {
        await clearLocalData();
        set({ isAuthenticated: false, userId: null, username: '', role: null, token: null });
      },

      setUsername: (username) => set({ username }),
      setLastSync: (date) => set({ lastSync: date }),
    }),
    { name: 'hangar-auth' }
  )
);