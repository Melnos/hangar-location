'use client';

import { useAuthStore } from '@/lib/stores/auth';
import { usePathname } from 'next/navigation';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

const pageTitles: Record<string, string> = {
  '/dashboard': 'Tableau de bord',
  '/vehicules': 'Véhicules',
  '/contrats': 'Contrats',
  '/rapports': 'Rapports',
  '/parametres': 'Paramètres',
  '/locataires': 'Locataires',
};

export function MobileHeader() {
  const { username } = useAuthStore();
  const pathname = usePathname();
  const { isOnline } = useNetworkStatus();

  const getTitle = () => {
    for (const [path, title] of Object.entries(pageTitles)) {
      if (pathname === path || pathname.startsWith(`${path}/`)) {
        return title;
      }
    }
    return 'Hangar Location';
  };

  return (
    <header className="md:hidden fixed top-0 left-0 right-0 z-40 bg-[#f5f5dc]/90 backdrop-blur-md border-b border-gray-200">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <img src="/icon-192.png" alt="Hangar Location" className="w-8 h-8 rounded-lg" />
          <span className="font-bold text-gray-900">{getTitle()}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-sm text-gray-600">{username}</span>
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
