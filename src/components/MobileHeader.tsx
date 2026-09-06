'use client';

import { useAuthStore } from '@/lib/stores/auth';
import { useParametresStore } from '@/lib/stores/parametres';
import { usePathname } from 'next/navigation';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { LogOut } from 'lucide-react';

const pageTitles: Record<string, string> = {
  '/dashboard': 'Tableau de bord',
  '/vehicules': 'Vehicules',
  '/contrats': 'Contrats',
  '/rapports': 'Rapports',
  '/parametres': 'Parametres',
  '/locataires': 'Locataires',
  '/admin-panel': 'Admin Panel',
};

export function MobileHeader() {
  const { username, logout } = useAuthStore();
  const { adminData } = useParametresStore();
  const pathname = usePathname();
  const { isOnline } = useNetworkStatus();

  const getTitle = () => {
    for (const [path, title] of Object.entries(pageTitles)) {
      if (pathname === path || pathname.startsWith(`${path}/`)) {
        return title;
      }
    }
    return adminData.nomEntreprise;
  };

  return (
    <header className="md:hidden fixed top-0 left-0 right-0 z-40 bg-[#f5f5dc]/90 backdrop-blur-md border-b border-gray-200">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <img src={adminData.logoUrl || '/icon-192.png'} alt={adminData.nomEntreprise} className="w-8 h-8 rounded-lg object-cover" />
          <span className="font-bold text-gray-900">{getTitle()}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-sm text-gray-600">{username}</span>
          <button type="button" onClick={() => logout()} className="rounded-lg p-2 text-gray-600 hover:bg-gray-200" aria-label="Se déconnecter" title="Se déconnecter">
            <LogOut className="h-4 w-4" />
          </button>
          <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-medium">
              {username.charAt(0).toUpperCase()}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
