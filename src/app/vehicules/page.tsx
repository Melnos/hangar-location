'use client';

import { useState } from 'react';
import { useVehicules } from '@/hooks/useDatabase';
import { Header, CarteVehicule, Input, BadgeStatut } from '@/components';
import { vehiculeRepository } from '@/repositories';
import { Button } from '@/components';
import { Modal } from '@/components';
import type { StatutVehicule } from '@/models';
import Link from 'next/link';

export default function VehiculesPage() {
  const vehicules = useVehicules();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatut, setFilterStatut] = useState<StatutVehicule | 'tous'>('tous');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredVehicules = vehicules?.filter((v) => {
    const matchesSearch =
      searchQuery === '' ||
      v.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.plaque.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatut = filterStatut === 'tous' || v.statut === filterStatut;
    return matchesSearch && matchesStatut;
  });

  return (
    <div>
      <Header
        title="Véhicules"
        action={
          <Link href="/vehicules/nouveau">
            <Button>Nouveau véhicule</Button>
          </Link>
        }
      />

      <div className="p-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <Input
              label=""
              placeholder="Rechercher par nom ou plaque..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="w-full sm:w-48">
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm bg-[#f5f5dc] focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={filterStatut}
              onChange={(e) => setFilterStatut(e.target.value as StatutVehicule | 'tous')}
            >
              <option value="tous">Tous les statuts</option>
              <option value="disponible">Disponible</option>
              <option value="en_location">En location</option>
              <option value="en_retard">En retard</option>
              <option value="en_entretien">En entretien</option>
              <option value="hors_service">Hors service</option>
            </select>
          </div>
        </div>

        {filteredVehicules && filteredVehicules.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredVehicules.map((vehicule) => (
              <CarteVehicule key={vehicule.id} vehicule={vehicule} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 17h.01M16 17h.01M3 11l1.5-5A2 2 0 016.4 4.5h11.2a2 2 0 011.9 1.5L21 11M3 11v6a1 1 0 001 1h1m16-7v6a1 1 0 01-1 1h-1m-16 0h16"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun véhicule</h3>
            <p className="mt-1 text-sm text-gray-500">
              Commencez par ajouter un nouveau véhicule.
            </p>
            <div className="mt-6">
              <Link href="/vehicules/nouveau">
                <Button>Nouveau véhicule</Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
