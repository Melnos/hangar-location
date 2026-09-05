'use client';

import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth';
import { Sidebar, FloatingNav, MobileHeader } from '@/components';

export function AppContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isAuthenticated } = useAuthStore();

  // Public pages (no auth required)
  if (pathname === '/' || pathname === '/admin') {
    return <>{children}</>;
  }

  // Admin-only pages (auth required)
  if (!isAuthenticated) {
    // Redirect to admin login if not authenticated
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
