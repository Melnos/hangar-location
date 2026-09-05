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
const DELETED_KEY = 'sync-deleted-ids';

const SYNC_TABLES = ['vehicules', 'locataires', 'contrats', 'documents_vehicule', 'maintenances', 'notifications'] as const;
export type SyncTable = typeof SYNC_TABLES[number];
export type DeletedMap = Partial<Record<SyncTable, string[]>>;

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

  // ==== Registre des suppressions (pour propager les deletes aux autres appareils) ====
  getDeleted(): DeletedMap {
    try {
      return JSON.parse(localStorage.getItem(DELETED_KEY) || '{}');
    } catch {
      return {};
    }
  },

  markDeleted(table: SyncTable, id: string): void {
    if (typeof window === 'undefined') return;
    const d = this.getDeleted();
    if (!d[table]) d[table] = [];
    if (!d[table]!.includes(id)) d[table]!.push(id);
    localStorage.setItem(DELETED_KEY, JSON.stringify(d));
  },

  mergeDeleted(serverDeleted?: DeletedMap): void {
    if (typeof window === 'undefined' || !serverDeleted) return;
    const d = this.getDeleted();
    for (const t of Object.keys(serverDeleted) as SyncTable[]) {
      d[t] = Array.from(new Set([...(d[t] || []), ...(serverDeleted[t] || [])]));
    }
    localStorage.setItem(DELETED_KEY, JSON.stringify(d));
  },

  // Pull global data from server (admin only)
  async pullFromServer(): Promise<SyncResult> {
    const { userId, token } = useAuthStore.getState();

    if (!userId || !token) {
      return { success: false, message: 'Non authentifie' };
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
        return { success: false, message: `Synchronisation indisponible (${response.status}) - vos donnees restent locales` };
      }

      const result = await response.json();

      if (result.success && result.data) {
        await this.applyServerData(result.data);
        return { success: true, message: 'Donnees synchronisees depuis le serveur' };
      }

      return { success: false, message: result.error || 'Erreur de synchronisation' };
    } catch (error) {
      return {
        success: false,
        message: 'Hors ligne - vos donnees restent locales',
      };
    }
  },

  // Push local data to server (overwrites global data)
  async pushToServer(): Promise<SyncResult> {
    const { userId, token } = useAuthStore.getState();

    if (!userId || !token) {
      return { success: false, message: 'Non authentifie' };
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
        body: JSON.stringify({ data: { ...localData, deleted: this.getDeleted() } }),
      });

      if (!response.ok) {
        return { success: false, message: `Envoi indisponible (${response.status}) - donnees conservees en local` };
      }

      const result = await response.json();

      if (result.success) {
        return { success: true, message: 'Donnees envoyees au serveur' };
      }

      return { success: false, message: result.error || 'Erreur de synchronisation' };
    } catch (error) {
      return {
        success: false,
        message: 'Hors ligne - donnees conservees en local',
      };
    }
  },

  // Full sync: try pull, then always push local data so it's not blocked
  async syncWithServer(): Promise<SyncResult> {
    await this.pullFromServer();
    const pushResult = await this.pushToServer();

    if (!pushResult.success) {
      return pushResult;
    }

    const syncDate = now();
    await this.saveSyncState({ lastSync: syncDate });

    return { success: true, message: 'Synchronisation complete reussie' };
  },

  // Apply server data to local database (+ applique les suppressions du serveur)
  async applyServerData(data: any): Promise<void> {
    if (data.vehicules) await db.vehicules.bulkPut(data.vehicules);
    if (data.locataires) await db.locataires.bulkPut(data.locataires);
    if (data.contrats) await db.contrats.bulkPut(data.contrats);
    if (data.documents_vehicule) await db.documents_vehicule.bulkPut(data.documents_vehicule);
    if (data.maintenances) await db.maintenances.bulkPut(data.maintenances);
    if (data.notifications) await db.notifications.bulkPut(data.notifications);

    // Supprime localement les enregistrements supprimes par un autre appareil
    const deleted: DeletedMap = data.deleted || {};
    for (const t of SYNC_TABLES) {
      const ids = deleted[t] || [];
      if (ids.length > 0) {
        await (db as any)[t].bulkDelete(ids);
      }
    }
    this.mergeDeleted(deleted);
  },

  // Export all local data for sync
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

  // Import data from external source
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
