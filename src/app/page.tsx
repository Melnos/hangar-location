'use client';

import { useState, useEffect } from 'react';
import type { Vehicule } from '@/models';

function PublicVehiculesPage() {
  const [vehicules, setVehicules] = useState<Vehicule[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    const loadVehicules = async () => {
      try {
        const response = await fetch('/api/public');
        const result = await response.json();
        if (result.success && result.vehicules) {
          setVehicules(result.vehicules);
          setLastUpdated(result.lastUpdated);
        }
      } catch (error) {
        console.error('Erreur chargement vehicules:', error);
      } finally {
        setLoading(false);
      }
    };
    loadVehicules();
    const interval = setInterval(loadVehicules, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (statut: string) => {
    switch (statut) {
      case 'disponible': return 'bg-green-100 text-green-800';
      case 'en_location': return 'bg-blue-100 text-blue-800';
      case 'en_retard': return 'bg-red-100 text-red-800';
      case 'en_entretien': return 'bg-yellow-100 text-yellow-800';
      case 'hors_service': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (statut: string) => {
    switch (statut) {
      case 'disponible': return 'Disponible';
      case 'en_location': return 'En location';
      case 'en_retard': return 'En retard';
      case 'en_entretien': return 'En entretien';
      case 'hors_service': return 'Hors service';
      default: return statut;
    }
  };

  const disponibles = vehicules.filter(v => v.statut === 'disponible').length;
  const enLocation = vehicules.filter(v => v.statut === 'en_location').length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f5f5dc' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f5f5dc' }}>
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img src="/icon-192.png" alt="Hangar Location" className="w-12 h-12 rounded-xl" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Hangar Location</h1>
                <p className="text-sm text-gray-500">Notre flotte de vehicules</p>
              </div>
            </div>
            <a href="/admin" className="text-sm text-blue-600 hover:text-blue-800 font-medium">Acces Admin</a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Total vehicules</p>
            <p className="text-2xl font-bold text-gray-900">{vehicules.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Disponibles</p>
            <p className="text-2xl font-bold text-green-600">{disponibles}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">En location</p>
            <p className="text-2xl font-bold text-blue-600">{enLocation}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Tarif journalier min</p>
            <p className="text-2xl font-bold text-gray-900">{vehicules.length > 0 ? `${Math.min(...vehicules.map(v => v.tarif_journalier))}€` : '-'}</p>
          </div>
        </div>

        {vehicules.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 17h.01M16 17h.01M3 11l1.5-5A2 2 0 016.4 4.5h11.2a2 2 0 011.9 1.5L21 11M3 11v6a1 1 0 001 1h1m16-7v6a1 1 0 01-1 1h-1m-16 0h16" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun vehicule disponible</h3>
            <p className="text-gray-500">La flotte est en cours de mise a jour.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vehicules.map((vehicule) => (
              <div key={vehicule.id} className="bg-white rounded-lg shadow overflow-hidden hover:shadow-md transition-shadow">
                <div className="h-48 bg-gray-100 flex items-center justify-center">
                  {vehicule.photos && vehicule.photos.length > 0 ? (
                    <img src={vehicule.photos[0]} alt={vehicule.nom} className="w-full h-full object-cover" />
                  ) : (
                    <svg className="w-20 h-20 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 17h.01M16 17h.01M3 11l1.5-5A2 2 0 016.4 4.5h11.2a2 2 0 011.9 1.5L21 11M3 11v6a1 1 0 001 1h1m16-7v6a1 1 0 01-1 1h-1m-16 0h16" />
                    </svg>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{vehicule.nom}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(vehicule.statut)}`}>
                      {getStatusLabel(vehicule.statut)}
                    </span>
                  </div>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p><span className="font-medium">Plaque:</span> {vehicule.plaque}</p>
                    <p><span className="font-medium">Couleur:</span> {vehicule.couleur}</p>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                    <div>
                      <span className="text-2xl font-bold text-blue-600">{vehicule.tarif_journalier}€</span>
                      <span className="text-sm text-gray-500">/jour</span>
                    </div>
                    {vehicule.statut === 'disponible' && <span className="text-green-600 text-sm font-medium">Disponible</span>}
                    {vehicule.statut === 'en_location' && <span className="text-blue-600 text-sm font-medium">Loue</span>}
                  </div>
                  <p className="mt-3 text-xs text-gray-400 text-center">Contactez-nous pour reserver ce vehicule</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <footer className="mt-12 text-center text-sm text-gray-500">
          <p>© {new Date().getFullYear()} Hangar Location - Tous droits reserves</p>
          <p className="mt-1">Pour toute reservation, contactez-nous directement.</p>
        </footer>
      </main>
    </div>
  );
}

export default PublicVehiculesPage;