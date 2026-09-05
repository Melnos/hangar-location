'use client';

import { useState } from 'react';
import { useVehicules, useContrats, useNotifications, useBusinessRules, useLocataires } from '@/hooks/useDatabase';
import { Header, StatCard, Button } from '@/components';
import { executerToutesLesVerifications } from '@/business-rules';
import { useParametresStore } from '@/lib/stores/parametres';
import { useAuthStore } from '@/lib/stores/auth';
import { syncService } from '@/lib/sync';
import Link from 'next/link';

export default function DashboardPage() {
  useBusinessRules();
  const vehicules = useVehicules();
  const contrats = useContrats();
  const notifications = useNotifications();
  const locataires = useLocataires();
  const [loading, setLoading] = useState(false);
  const [syncState, setSyncState] = useState('');
  const { adminId } = useParametresStore();
  const { username, role } = useAuthStore();
  const isAdmin = role === 'admin';

  const handleVerifier = async () => {
    setLoading(true);
    await executerToutesLesVerifications();
    setLoading(false);
  };

  const handleSync = async () => {
    setSyncState('Synchronisation...');
    const result = await syncService.syncWithServer();
    setSyncState(result.message);
    setTimeout(() => setSyncState(''), 4000);
  };

  const stats = {
    total: vehicules?.length ?? 0,
    disponibles: vehicules?.filter((v) => v.statut === 'disponible').length ?? 0,
    enLocation: vehicules?.filter((v) => v.statut === 'en_location').length ?? 0,
    enRetard: vehicules?.filter((v) => v.statut === 'en_retard').length ?? 0,
    enEntretien: vehicules?.filter((v) => v.statut === 'en_entretien').length ?? 0,
    contratsActifs: contrats?.filter((c) => !c.date_retour_reelle).length ?? 0,
    totalLocataires: locataires?.length ?? 0,
    notificationsNonLues: notifications?.filter((n) => !n.lue).length ?? 0,
  };

  const alertes = notifications?.filter((n) => !n.lue).slice(0, 5) ?? [];
  const contratsRecents = contrats?.slice(0, 5) ?? [];

  return (
    <div>
      <Header
        title={isAdmin ? `Tableau de bord - Directeur` : `Tableau de bord - ${username || adminId}`}
        action={
          <div className="flex items-center gap-2">
            {syncState && <span className="text-xs text-gray-500">{syncState}</span>}
            <Button onClick={handleSync} size="sm" variant="secondary">
              Synchroniser
            </Button>
            <Button onClick={handleVerifier} loading={loading} size="sm">
              Vérifier les alertes
            </Button>
          </div>
        }
      />

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Total véhicules"
            value={stats.total}
            color="blue"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 17h.01M16 17h.01M3 11l1.5-5A2 2 0 016.4 4.5h11.2a2 2 0 011.9 1.5L21 11M3 11v6a1 1 0 001 1h1m16-7v6a1 1 0 01-1 1h-1m-16 0h16"
                />
              </svg>
            }
          />
          <StatCard
            title="Disponibles"
            value={stats.disponibles}
            color="green"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            }
          />
          <StatCard
            title="En location"
            value={stats.enLocation}
            color="blue"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            }
          />
          <StatCard
            title="En retard"
            value={stats.enRetard}
            color="red"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            }
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="En entretien"
            value={stats.enEntretien}
            color="yellow"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            }
          />
          <StatCard
            title="Contrats actifs"
            value={stats.contratsActifs}
            color="blue"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            }
          />
          <StatCard
            title="Locataires"
            value={stats.totalLocataires}
            color="green"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                />
              </svg>
            }
          />
          <StatCard
            title="Alertes"
            value={stats.notificationsNonLues}
            color="red"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
            }
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[#f5f5dc] rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Alertes récentes</h2>
              {stats.notificationsNonLues > 0 && (
                <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                  {stats.notificationsNonLues} non lues
                </span>
              )}
            </div>
            {alertes.length === 0 ? (
              <p className="text-gray-500 text-sm">Aucune alerte en cours</p>
            ) : (
              <ul className="space-y-3">
                {alertes.map((notification) => (
                  <li
                    key={notification.id}
                    className="flex items-center gap-3 p-3 bg-[#e8e8c8] rounded-lg"
                  >
                    <div
                      className={`w-2 h-2 rounded-full ${
                        notification.type === 'retard'
                          ? 'bg-red-500'
                          : notification.type === 'document_expire'
                          ? 'bg-yellow-500'
                          : 'bg-blue-500'
                      }`}
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {notification.type === 'retard'
                          ? 'Retour en retard'
                          : notification.type === 'document_expire'
                          ? 'Document expirant bientôt'
                          : 'Entretien à prévoir'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(notification.date_declenchement).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="bg-[#f5f5dc] rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Contrats récents</h2>
            {contratsRecents.length === 0 ? (
              <p className="text-gray-500 text-sm">Aucun contrat</p>
            ) : (
              <ul className="space-y-3">
                {contratsRecents.map((contrat) => (
                  <li
                    key={contrat.id}
                    className="flex justify-between items-center p-3 bg-[#e8e8c8] rounded-lg"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(contrat.date_debut).toLocaleDateString('fr-FR')}
                      </p>
                      <p className="text-xs text-gray-500">
                        Retour prévu: {new Date(contrat.date_fin_prevue).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded ${
                        contrat.date_retour_reelle
                          ? 'bg-green-100 text-green-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {contrat.date_retour_reelle ? 'Clôturé' : 'En cours'}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="mt-6">
          <div className="bg-[#f5f5dc] rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions rapides</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Link href="/vehicules/nouveau">
                <div className="p-4 border border-gray-200 rounded-lg hover:bg-[#e8e8c8] cursor-pointer transition-colors">
                  <svg
                    className="w-8 h-8 text-primary-600 mb-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                  <p className="text-sm font-medium text-gray-900">Nouveau véhicule</p>
                </div>
              </Link>
              <Link href="/contrats">
                <div className="p-4 border border-gray-200 rounded-lg hover:bg-[#e8e8c8] cursor-pointer transition-colors">
                  <svg
                    className="w-8 h-8 text-primary-600 mb-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <p className="text-sm font-medium text-gray-900">Contrats</p>
                </div>
              </Link>
              <Link href="/locataires">
                <div className="p-4 border border-gray-200 rounded-lg hover:bg-[#e8e8c8] cursor-pointer transition-colors">
                  <svg
                    className="w-8 h-8 text-primary-600 mb-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                    />
                  </svg>
                  <p className="text-sm font-medium text-gray-900">Locataires</p>
                </div>
              </Link>
              <Link href="/vehicules">
                <div className="p-4 border border-gray-200 rounded-lg hover:bg-[#e8e8c8] cursor-pointer transition-colors">
                  <svg
                    className="w-8 h-8 text-primary-600 mb-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                  <p className="text-sm font-medium text-gray-900">Voir tout</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
