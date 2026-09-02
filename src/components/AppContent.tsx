'use client';

import { useAuthStore } from '@/lib/stores/auth';
import { Sidebar, FloatingNav, MobileHeader } from '@/components';
import LoginScreen from '@/components/LoginScreen';

export function AppContent({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <LoginScreen />;
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
