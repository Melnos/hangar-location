import { db } from '../db';
import { now } from '../utils';
import { useAuthStore } from '../stores/auth';

export interface SyncChange {
  id: string;
  table: string;
  recordId: string;
  operation: 'create' | 'update' | 'delete';
  data: unknown;
  timestamp: string;
}

export interface SyncResult {
  success: boolean;
  message: string;
  changesApplied?: number;
}

const SYNC_STATE_KEY = 'sync-state';

export const syncService = {
  async getSyncState(): Promise<{ lastSync: string | null }> {
    const state = localStorage.getItem(SYNC_STATE_KEY);
    if (state) {
      return JSON.parse(state);
    }
    return { lastSync: null };
  },

  async saveSyncState(state: { lastSync: string | null }): Promise<void> {
    localStorage.setItem(SYNC_STATE_KEY, JSON.stringify(state));
  },

  async pullFromServer(): Promise<SyncResult> {
    const { userId, token } = useAuthStore.getState();

    if (!userId || !token) {
      return { success: false, error: 'Non authentifié' } as any;
    }

    try {
      const response = await fetch('/api/sync', {
        method: 'GET',
        headers: {
          'x-user-id': userId,
          'Authorization': `Basic ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return { success: false, message: 'Synchronisation serveur non disponible' };
        }
        throw new Error(`Erreur serveur: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        await this.applyServerData(result.data);
        return { success: true, message: 'Données synchronisées depuis le serveur' };
      }

      return { success: false, message: result.error || 'Erreur de synchronisation' };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Erreur inconnue',
      };
    }
  },

  async pushToServer(): Promise<SyncResult> {
    const { userId, token } = useAuthStore.getState();

    if (!userId || !token) {
      return { success: false, error: 'Non authentifié' } as any;
    }

    try {
      const localData = await this.exportLocalData();

      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
          'Authorization': `Basic ${token}`,
        },
        body: JSON.stringify({ data: localData }),
      });

      if (!response.ok) {
        if (response.status === 404) {
          return { success: false, message: 'Synchronisation serveur non disponible' };
        }
        throw new Error(`Erreur serveur: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        return { success: true, message: 'Données envoyées au serveur' };
      }

      return { success: false, message: result.error || 'Erreur de synchronisation' };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Erreur inconnue',
      };
    }
  },

  async syncWithServer(): Promise<SyncResult> {
    const pullResult = await this.pullFromServer();
    if (!pullResult.success) {
      return pullResult;
    }

    const pushResult = await this.pushToServer();
    if (!pushResult.success) {
      return pushResult;
    }

    const syncDate = now();
    await this.saveSyncState({ lastSync: syncDate });
    useAuthStore.getState().setUsername(useAuthStore.getState().username);

    return { success: true, message: 'Synchronisation complète réussie' };
  },

  async applyServerData(data: any): Promise<void> {
    if (data.vehicules) await db.vehicules.bulkPut(data.vehicules);
    if (data.locataires) await db.locataires.bulkPut(data.locataires);
    if (data.contrats) await db.contrats.bulkPut(data.contrats);
    if (data.documents_vehicule) await db.documents_vehicule.bulkPut(data.documents_vehicule);
    if (data.maintenances) await db.maintenances.bulkPut(data.maintenances);
    if (data.notifications) await db.notifications.bulkPut(data.notifications);
  },

  async exportLocalData(): Promise<Record<string, unknown[]>> {
    const data: Record<string, unknown[]> = {};
    data.vehicules = await db.vehicules.toArray();
    data.locataires = await db.locataires.toArray();
    data.contrats = await db.contrats.toArray();
    data.documents_vehicule = await db.documents_vehicule.toArray();
    data.maintenances = await db.maintenances.toArray();
    data.notifications = await db.notifications.toArray();
    return data;
  },

  async importData(data: Record<string, unknown[]>): Promise<void> {
    if (data.vehicules) await db.vehicules.bulkPut(data.vehicules as any);
    if (data.locataires) await db.locataires.bulkPut(data.locataires as any);
    if (data.contrats) await db.contrats.bulkPut(data.contrats as any);
    if (data.documents_vehicule) await db.documents_vehicule.bulkPut(data.documents_vehicule as any);
    if (data.maintenances) await db.maintenances.bulkPut(data.maintenances as any);
    if (data.notifications) await db.notifications.bulkPut(data.notifications as any);
  },
};

let syncIntervalId: ReturnType<typeof setInterval> | null = null;

export function startAutoSync(intervalSeconds: number): void {
  stopAutoSync();

  syncIntervalId = setInterval(async () => {
    const online = navigator.onLine;
    if (online) {
      await syncService.syncWithServer();
    }
  }, intervalSeconds * 1000);
}

export function stopAutoSync(): void {
  if (syncIntervalId) {
    clearInterval(syncIntervalId);
    syncIntervalId = null;
  }
}
