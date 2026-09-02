'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';

const navigation = [
  { name: 'Accueil', href: '/dashboard', icon: 'home' },
  { name: 'Véhicules', href: '/vehicules', icon: 'car' },
  { name: 'Contrats', href: '/contrats', icon: 'document' },
  { name: 'Rapports', href: '/rapports', icon: 'chart' },
  { name: 'Plus', href: '/parametres', icon: 'menu' },
];

function getIcon(icon: string, isActive: boolean) {
  const color = isActive ? '#2563eb' : '#6b7280';
  switch (icon) {
    case 'home':
      return (
        <svg className="w-6 h-6" fill={isActive ? color : 'none'} stroke={color} viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={isActive ? 2.5 : 2}
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
          />
        </svg>
      );
    case 'car':
      return (
        <svg className="w-6 h-6" fill={isActive ? color : 'none'} stroke={color} viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={isActive ? 2.5 : 2}
            d="M8 17h.01M16 17h.01M3 11l1.5-5A2 2 0 016.4 4.5h11.2a2 2 0 011.9 1.5L21 11M3 11v6a1 1 0 001 1h1m16-7v6a1 1 0 01-1 1h-1m-16 0h16"
          />
        </svg>
      );
    case 'document':
      return (
        <svg className="w-6 h-6" fill={isActive ? color : 'none'} stroke={color} viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={isActive ? 2.5 : 2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      );
    case 'chart':
      return (
        <svg className="w-6 h-6" fill={isActive ? color : 'none'} stroke={color} viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={isActive ? 2.5 : 2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      );
    case 'menu':
      return (
        <svg className="w-6 h-6" fill="none" stroke={color} viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      );
    default:
      return null;
  }
}

export function FloatingNav() {
  const pathname = usePathname();

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none md:hidden">
        <div
          className="pointer-events-auto mb-5 px-3 py-2 flex items-center gap-1"
          style={{
            background: 'rgba(245, 245, 220, 0.75)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            borderRadius: 999,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.4)',
            border: '1px solid rgba(255, 255, 255, 0.5)',
          }}
        >
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={clsx(
                  'flex flex-col items-center justify-center px-4 py-2 rounded-full transition-all duration-200 min-w-[56px]',
                  isActive
                    ? 'bg-primary-600/10'
                    : 'hover:bg-gray-500/10'
                )}
              >
                {getIcon(item.icon, isActive)}
                <span
                  className={clsx(
                    'text-[10px] font-medium mt-0.5 transition-colors',
                    isActive ? 'text-primary-600' : 'text-gray-500'
                  )}
                >
                  {item.name}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="h-20 md:hidden" />
    </>
  );
}
