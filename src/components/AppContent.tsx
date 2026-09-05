'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth';
import { Sidebar, FloatingNav, MobileHeader } from '@/components';
import { useAutoSync } from '@/hooks/useAutoSync';

export function AppContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isAuthenticated, role, token, username } = useAuthStore();

  // Synchronisation automatique dès qu'un utilisateur est connecté
  useAutoSync(30);

  // Au démarrage : garantir que le compte admin existe côté serveur pour la sync
  useEffect(() => {
    if (!isAuthenticated || !token) return;

    let decodedUser = username;
    let decodedPass = '';
    try {
      const decoded = atob(token);
      const parts = decoded.split(':');
      if (parts.length >= 2) {
        decodedUser = parts[0];
        decodedPass = parts.slice(1).join(':');
      }
    } catch {}

    // Si le compte est "admin" (par défaut ou local), s'assurer qu'il existe côté serveur
    if (role === 'admin') {
      fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reset_admin',
          username: decodedUser,
          password: decodedPass || 'admin123',
        }),
      })
        .then(() => fetch('/api/sync', {
          method: 'GET',
          headers: { 'x-user-id': decodedUser, 'Authorization': `Basic ${token}` },
        }))
        .catch(() => {});
    }
  }, [isAuthenticated, token, role, username]);

  if (pathname === '/' || pathname === '/admin' || pathname === '/setup' || pathname === '/reset-admin') {
    return <>{children}</>;
  }

  if (!isAuthenticated) {
    if (typeof window !== 'undefined') {
      window.location.href = '/admin';
    }
    return null;
  }

  return (
    <>
      <div className="hidden md:block">
        <Sidebar />
      </div>
      <MobileHeader />
      <main className="md:ml-64 pt-16 md:pt-0">
        {children}
      </main>
      <FloatingNav />
    </>
  );
}