'use client';

import type { Vehicule } from '@/models';
import { BadgeStatut } from './BadgeStatut';
import Link from 'next/link';

interface CarteVehiculeProps {
  vehicule: Vehicule;
}

export function CarteVehicule({ vehicule }: CarteVehiculeProps) {
  return (
    <Link href={`/vehicules/${vehicule.id}`}>
      <div className="bg-[#f5f5dc] rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-semibold text-gray-900">{vehicule.nom}</h3>
          <BadgeStatut statut={vehicule.statut} />
        </div>
        <div className="space-y-1 text-sm text-gray-600">
          <p>
            <span className="font-medium">Plaque:</span> {vehicule.plaque}
          </p>
          <p>
            <span className="font-medium">Couleur:</span> {vehicule.couleur}
          </p>
          <p>
            <span className="font-medium">Km:</span> {vehicule.km_depart.toLocaleString()} km
          </p>
          <p>
            <span className="font-medium">Tarif:</span> {vehicule.tarif_journalier.toLocaleString()} / jour
          </p>
        </div>
      </div>
    </Link>
  );
}
