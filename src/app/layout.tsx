import type { Metadata, Viewport } from 'next';
import { AppContent, ServiceWorkerRegistration } from '@/components';
import './globals.css';

export const metadata: Metadata = {
  title: 'Hangar Location - Gestion de flotte',
  description: 'Application de gestion de hangar de location de véhicules',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Hangar Location',
  },
  icons: {
    icon: '/icon-192.png',
    apple: '/icon-192.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#2563eb',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className="min-h-screen" style={{ backgroundColor: '#f5f5dc' }}>
        <ServiceWorkerRegistration />
        <AppContent>{children}</AppContent>
      </body>
    </html>
  );
}
