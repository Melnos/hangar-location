'use client';

import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth';
import { Sidebar, FloatingNav, MobileHeader } from '@/components';

export function AppContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isAuthenticated, role } = useAuthStore();

  if (pathname === '/' || pathname === '/admin' || pathname === '/setup') {
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