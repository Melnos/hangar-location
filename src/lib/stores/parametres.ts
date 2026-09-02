import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AdminData {
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  adresse: string;
  nomEntreprise: string;
}

interface ParametresState {
  adminId: string;
  adminData: AdminData;
  syncEnabled: boolean;
  syncServerUrl: string;
  syncInterval: number;
  notificationsEnabled: boolean;
  setAdminId: (id: string) => void;
  setAdminData: (data: Partial<AdminData>) => void;
  setSyncEnabled: (enabled: boolean) => void;
  setSyncServerUrl: (url: string) => void;
  setSyncInterval: (interval: number) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
}

const defaultAdminData: AdminData = {
  nom: 'Admin',
  prenom: 'Principal',
  email: '',
  telephone: '',
  adresse: '',
  nomEntreprise: 'Hangar Location',
};

export const useParametresStore = create<ParametresState>()(
  persist(
    (set) => ({
      adminId: 'ADMIN-001',
      adminData: defaultAdminData,
      syncEnabled: false,
      syncServerUrl: '',
      syncInterval: 30,
      notificationsEnabled: false,
      setAdminId: (id) => set({ adminId: id }),
      setAdminData: (data) => set((state) => ({ adminData: { ...state.adminData, ...data } })),
      setSyncEnabled: (enabled) => set({ syncEnabled: enabled }),
      setSyncServerUrl: (url) => set({ syncServerUrl: url }),
      setSyncInterval: (interval) => set({ syncInterval: interval }),
      setNotificationsEnabled: (enabled) => set({ notificationsEnabled: enabled }),
    }),
    {
      name: 'hangar-parametres',
    }
  )
);
