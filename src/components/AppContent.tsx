'use client';

import { Sidebar, FloatingNav, MobileHeader } from '@/components';

export function AppContent({ children }: { children: React.ReactNode }) {
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
