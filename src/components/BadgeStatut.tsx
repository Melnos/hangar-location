'use client';

import type { StatutVehicule } from '@/models';
import clsx from 'clsx';

const statutConfig: Record<StatutVehicule, { label: string; className: string }> = {
  disponible: {
    label: 'Disponible',
    className: 'bg-green-100 text-green-800 border-green-200',
  },
  en_location: {
    label: 'En location',
    className: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  en_retard: {
    label: 'En retard',
    className: 'bg-red-100 text-red-800 border-red-200',
  },
  en_entretien: {
    label: 'En entretien',
    className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  },
  hors_service: {
    label: 'Hors service',
    className: 'bg-gray-100 text-gray-800 border-gray-200',
  },
};

interface BadgeStatutProps {
  statut: StatutVehicule;
  className?: string;
}

export function BadgeStatut({ statut, className }: BadgeStatutProps) {
  const config = statutConfig[statut];
  return (
    <span
      className={clsx(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
