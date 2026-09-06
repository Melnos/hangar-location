'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/stores/auth';
import { formatFCFA } from '@/lib/utils';

interface PublicVehicule {
  id: string;
  nom: string;
  plaque: string;
  couleur: string;
  statut: string;
  tarif_journalier: number;
  photos?: string[];
}

interface Entreprise {
  nomEntreprise?: string;
  telephone?: string;
  email?: string;
  adresse?: string;
  logoUrl?: string;
}

export default function PublicPage() {
  const [vehicules, setVehicules] = useState<PublicVehicule[]>([]);
  const [entreprise, setEntreprise] = useState<Entreprise | null>(null);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated, role } = useAuthStore();

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/public');
        const result = await res.json();
        if (result.success && result.vehicules) {
          setVehicules(result.vehicules);
          setEntreprise(result.entreprise || null);
        }
      } catch {}
      setLoading(false);
    };
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  const statusInfo = (statut: string) => {
    switch (statut) {
      case 'disponible': return { label: 'Disponible', cls: 'bg-green-100 text-green-800' };
      case 'en_location': return { label: 'En location', cls: 'bg-blue-100 text-blue-800' };
      case 'en_retard': return { label: 'En retard', cls: 'bg-red-100 text-red-800' };
      case 'en_entretien': return { label: 'En entretien', cls: 'bg-yellow-100 text-yellow-800' };
      default: return { label: 'Hors service', cls: 'bg-gray-100 text-gray-800' };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f5f5dc' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const disponibles = vehicules.filter(v => v.statut === 'disponible').length;
  const enLocation = vehicules.filter(v => v.statut === 'en_location').length;

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f5f5dc' }}>
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={entreprise?.logoUrl || '/icon-192.png'} alt={entreprise?.nomEntreprise || 'Entreprise'} className="w-11 h-11 rounded-xl object-cover" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">{entreprise?.nomEntreprise || 'Hangar Location'}</h1>
              <p className="text-xs text-gray-500">Notre flotte de vehicules</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <a href="/dashboard" className="text-sm font-medium bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                  Tableau de bord
                </a>
                {role === 'admin' && (
                  <a href="/admin-panel" className="text-sm font-medium text-purple-700 hover:underline">Admin</a>
                )}
              </>
            ) : (
              <a href="/admin" className="text-sm font-medium text-blue-600 hover:underline">Connexion</a>
            )}
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
            <p className="text-2xl font-bold text-gray-900">
              {vehicules.length > 0 ? formatFCFA(Math.min(...vehicules.map(v => v.tarif_journalier))) : '-'}
            </p>
          </div>
        </div>

        {vehicules.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun vehicule disponible</h3>
            <p className="text-gray-500">La flotte est en cours de mise a jour.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vehicules.map((v) => {
              const st = statusInfo(v.statut);
              return (
                <div key={v.id} className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="h-44 bg-gray-100 flex items-center justify-center">
                    {v.photos && v.photos.length > 0 ? (
                      <img src={v.photos[0]} alt={v.nom} className="w-full h-full object-cover" />
                    ) : null}
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{v.nom}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${st.cls}`}>{st.label}</span>
                    </div>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p><span className="font-medium">Plaque:</span> {v.plaque}</p>
                      <p><span className="font-medium">Couleur:</span> {v.couleur}</p>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                      <span className="text-2xl font-bold text-blue-600">{formatFCFA(v.tarif_journalier)}<span className="text-sm text-gray-500">/jour</span></span>
                      {v.statut === 'disponible' && <span className="text-green-600 text-sm font-medium">Disponible</span>}
                      {v.statut === 'en_location' && <span className="text-blue-600 text-sm font-medium">Loue</span>}
                    </div>
                    <p className="mt-3 text-xs text-gray-400 text-center">Contactez-nous pour reserver ce vehicule</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <footer className="mt-12 text-center text-sm text-gray-500">
          {entreprise?.telephone && <p className="mb-1">Contact : {entreprise.telephone}</p>}
          {entreprise?.email && <p className="mb-1">{entreprise.email}</p>}
          {entreprise?.adresse && <p className="mb-1">{entreprise.adresse}</p>}
          <p>© {new Date().getFullYear()} {entreprise?.nomEntreprise || 'Hangar Location'} - Tous droits reserves</p>
        </footer>
      </main>
    </div>
  );
}