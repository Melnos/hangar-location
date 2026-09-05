'use client';

import { useState, useEffect } from 'react';
import { Header, Button, Input } from '@/components';
import { useNotifications } from '@/hooks/useDatabase';
import { notificationRepository } from '@/repositories';
import { useParametresStore, type AdminData } from '@/lib/stores/parametres';
import { useAuthStore } from '@/lib/stores/auth';
import { redirect } from 'next/navigation';
import { syncService, startAutoSync, stopAutoSync } from '@/lib/sync';
import { notificationService } from '@/lib/notifications';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { db } from '@/lib/db';

export default function ParametresPage() {
  const notifications = useNotifications();
  const [isClearing, setIsClearing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string>('');
  const [syncStatusType, setSyncStatusType] = useState<'success' | 'error' | 'info'>('info');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [isSavingAdmin, setIsSavingAdmin] = useState(false);
  const [adminSaved, setAdminSaved] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<'granted' | 'denied' | 'default'>('default');

  const {
    syncEnabled,
    syncServerUrl,
    syncInterval,
    notificationsEnabled,
    adminData,
    setSyncEnabled,
    setSyncServerUrl,
    setSyncInterval,
    setNotificationsEnabled,
    setAdminData,
  } = useParametresStore();

  const { username, role, lastSync, logout } = useAuthStore();
  const { isOnline } = useNetworkStatus();

  const [localAdminData, setLocalAdminData] = useState<AdminData>(adminData);

  useEffect(() => {
    setLocalAdminData(adminData);
  }, [adminData]);

  useEffect(() => {
    if (syncEnabled) {
      startAutoSync(syncInterval);
    } else {
      stopAutoSync();
    }
    return () => stopAutoSync();
  }, [syncEnabled, syncInterval]);

  useEffect(() => {
    notificationService.getPermissionStatus().then((status) => {
      if (status.granted) setNotificationPermission('granted');
      else if (status.denied) setNotificationPermission('denied');
      else setNotificationPermission('default');
    });
  }, []);

  const handleMarkAllRead = async () => {
    await notificationRepository.marquerToutesLues();
  };

  const handleClearAll = async () => {
    setIsClearing(true);
    await db.notifications.clear();
    setIsClearing(false);
  };

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncStatus('Synchronisation en cours...');
    setSyncStatusType('info');
    const result = await syncService.syncWithServer();
    setSyncStatus(result.message);
    setSyncStatusType(result.success ? 'success' : 'error');
    setIsSyncing(false);
  };

  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    setSyncStatus('Test de connexion...');
    setSyncStatusType('info');
    const result = await syncService.pullFromServer();
    setSyncStatus(result.message);
    setSyncStatusType(result.success ? 'success' : 'error');
    setIsTestingConnection(false);
  };

  const handleExport = async () => {
    setIsExporting(true);
    const data = await syncService.exportLocalData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hangar-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setIsExporting(false);
  };

  const handleEnableNotifications = async () => {
    const result = await notificationService.requestPermission();
    if (result.granted) {
      setNotificationPermission('granted');
      setNotificationsEnabled(true);
    } else {
      setNotificationPermission('denied');
      setNotificationsEnabled(false);
    }
  };

  const handleAdminDataChange = (field: keyof AdminData, value: string) => {
    setLocalAdminData((prev) => ({ ...prev, [field]: value }));
    setAdminSaved(false);
  };

  const handleSaveAdminData = () => {
    setIsSavingAdmin(true);
    setAdminData(localAdminData);
    setTimeout(async () => {
      await syncService.syncWithServer();
      setIsSavingAdmin(false);
      setAdminSaved(true);
      setTimeout(() => setAdminSaved(false), 3000);
    }, 500);
  };

  const handleLogout = () => {
    logout();
  };

  if (role !== 'admin') {
    redirect('/dashboard');
  }

  return (
    <div>
      <Header title="Paramètres" />

      <div className="p-6 max-w-2xl space-y-6">
        <div className="bg-[#f5f5dc] rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Mon compte</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Connecté en tant que</p>
              <p className="text-lg font-medium text-gray-900">{username}</p>
            </div>
            {lastSync && (
              <div>
                <p className="text-sm text-gray-500">Dernière synchronisation</p>
                <p className="text-sm font-medium text-gray-700">
                  {new Date(lastSync).toLocaleString('fr-FR')}
                </p>
              </div>
            )}
            <Button variant="danger" onClick={handleLogout}>
              Se déconnecter
            </Button>
          </div>
        </div>

        <div className="bg-[#f5f5dc] rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Données administrateur</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Nom"
                value={localAdminData.nom}
                onChange={(e) => handleAdminDataChange('nom', e.target.value)}
                placeholder="Votre nom"
              />
              <Input
                label="Prénom"
                value={localAdminData.prenom}
                onChange={(e) => handleAdminDataChange('prenom', e.target.value)}
                placeholder="Votre prénom"
              />
            </div>
            <Input
              label="Email"
              type="email"
              value={localAdminData.email}
              onChange={(e) => handleAdminDataChange('email', e.target.value)}
              placeholder="votre@email.com"
            />
            <Input
              label="Téléphone"
              type="tel"
              value={localAdminData.telephone}
              onChange={(e) => handleAdminDataChange('telephone', e.target.value)}
              placeholder="+225 07 00 00 00"
            />
            <Input
              label="Adresse"
              value={localAdminData.adresse}
              onChange={(e) => handleAdminDataChange('adresse', e.target.value)}
              placeholder="Votre adresse complète"
            />
            <Input
              label="Nom de l'entreprise"
              value={localAdminData.nomEntreprise}
              onChange={(e) => handleAdminDataChange('nomEntreprise', e.target.value)}
              placeholder="Nom de votre entreprise"
            />
            <Input
              label="URL du logo"
              type="url"
              value={localAdminData.logoUrl}
              onChange={(e) => handleAdminDataChange('logoUrl', e.target.value)}
              placeholder="https://exemple.com/logo.png"
              helperText="Le logo sera utilisé sur la page publique et dans l'application."
            />
            <div className="flex items-center gap-3">
              <Button onClick={handleSaveAdminData} loading={isSavingAdmin}>
                Enregistrer
              </Button>
              {adminSaved && (
                <span className="text-sm text-green-600 font-medium">
                  Données enregistrées avec succès
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="bg-[#f5f5dc] rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Notifications</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">Notifications non lues</p>
                <p className="text-sm text-gray-500">
                  {notifications?.filter((n) => !n.lue).length ?? 0} notification(s) non lue(s)
                </p>
              </div>
              <Button size="sm" variant="secondary" onClick={handleMarkAllRead}>
                Tout marquer comme lu
              </Button>
            </div>
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">Effacer toutes les notifications</p>
                <p className="text-sm text-gray-500">
                  Supprime définitivement toutes les notifications
                </p>
              </div>
              <Button size="sm" variant="danger" onClick={handleClearAll} loading={isClearing}>
                Effacer tout
              </Button>
            </div>
            <div className="border-t border-gray-200 pt-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">Notifications push</p>
                  <p className="text-sm text-gray-500">
                    {notificationPermission === 'granted'
                      ? 'Activées - vous recevrez des alertes'
                      : 'Recevez des alertes pour les retards, documents expirés et maintenances'}
                  </p>
                </div>
                {notificationPermission !== 'granted' ? (
                  <Button size="sm" variant="primary" onClick={handleEnableNotifications}>
                    Activer
                  </Button>
                ) : (
                  <span className="text-sm text-green-600 font-medium">Activées</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#f5f5dc] rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Synchronisation</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm font-medium">
                {isOnline ? 'En ligne' : 'Hors ligne'}
              </span>
            </div>
            <p className="text-sm text-gray-500">
              La synchronisation sauvegarde vos données sur le serveur. Connectez-vous pour synchroniser automatiquement entre vos appareils.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button onClick={handleSync} loading={isSyncing}>
                Synchroniser maintenant
              </Button>
              <Button
                onClick={handleTestConnection}
                loading={isTestingConnection}
                variant="secondary"
              >
                Tester la connexion
              </Button>
            </div>
            {syncStatus && (
              <p className={`text-sm font-medium ${
                syncStatusType === 'success' ? 'text-green-600' :
                syncStatusType === 'error' ? 'text-red-600' :
                'text-blue-600'
              }`}>
                {syncStatus}
              </p>
            )}
          </div>
        </div>

        <div className="bg-[#f5f5dc] rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Sauvegarde locale</h2>
          <p className="text-sm text-gray-500 mb-4">
            Exportez toutes vos données en fichier JSON pour sauvegarde ou migration.
          </p>
          <Button onClick={handleExport} loading={isExporting} variant="secondary">
            Exporter les données
          </Button>
        </div>

        <div className="bg-[#f5f5dc] rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">À propos</h2>
          <div className="text-sm text-gray-500 space-y-2">
            <p>
              <span className="font-medium text-gray-700">Application:</span> Hangar Location
            </p>
            <p>
              <span className="font-medium text-gray-700">Version:</span> 1.0.0
            </p>
            <p>
              <span className="font-medium text-gray-700">Utilisateur:</span> {username}
            </p>
            <p>
              <span className="font-medium text-gray-700">Entreprise:</span> {adminData.nomEntreprise}
            </p>
            <p>
              <span className="font-medium text-gray-700">Description:</span> Gestion de hangar de
              location de véhicules
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
