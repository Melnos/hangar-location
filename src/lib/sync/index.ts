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

export interface SyncState {
  lastSync: string | null;
  pendingChanges: SyncChange[];
}

export interface SyncResult {
  success: boolean;
  message: string;
  changesApplied?: number;
}

const SYNC_STATE_KEY = 'sync-state';

export const syncService = {
  async getSyncState(): Promise<SyncState> {
    const state = localStorage.getItem(SYNC_STATE_KEY);
    if (state) {
      return JSON.parse(state);
    }
    return { lastSync: null, pendingChanges: [] };
  },

  async saveSyncState(state: SyncState): Promise<void> {
    localStorage.setItem(SYNC_STATE_KEY, JSON.stringify(state));
  },

  async addChange(change: Omit<SyncChange, 'id' | 'timestamp'>): Promise<void> {
    const state = await this.getSyncState();
    const newChange: SyncChange = {
      ...change,
      id: crypto.randomUUID(),
      timestamp: now(),
    };
    state.pendingChanges.push(newChange);
    await this.saveSyncState(state);
  },

  async testConnection(serverUrl: string): Promise<SyncResult> {
    try {
      const { username, password } = useAuthStore.getState();

      const response = await fetch(`${serverUrl}/ping`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${btoa(`${username}:${password}`)}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        return { success: true, message: 'Connexion au serveur réussie' };
      }

      if (response.status === 401) {
        return { success: false, message: 'Identifiants incorrects' };
      }

      return { success: false, message: `Erreur serveur: ${response.status}` };
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        return { success: false, message: 'Serveur injoignable - vérifiez l\'URL' };
      }
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Erreur de connexion',
      };
    }
  },

  async syncWithServer(serverUrl: string): Promise<SyncResult> {
    try {
      const state = await this.getSyncState();
      const { username, password } = useAuthStore.getState();

      if (!serverUrl) {
        return { success: false, message: 'URL du serveur non configurée' };
      }

      const response = await fetch(`${serverUrl}/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${btoa(`${username}:${password}`)}`,
        },
        body: JSON.stringify({
          lastSync: state.lastSync,
          changes: state.pendingChanges,
          username,
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          return { success: false, message: 'Identifiants incorrects' };
        }
        throw new Error(`Erreur serveur: ${response.status}`);
      }

      const result = await response.json();

      let changesApplied = 0;
      if (result.changes && result.changes.length > 0) {
        for (const change of result.changes) {
          await this.applyRemoteChange(change);
          changesApplied++;
        }
      }

      const syncDate = now();
      state.lastSync = syncDate;
      state.pendingChanges = [];
      await this.saveSyncState(state);
      useAuthStore.getState().setLastSync(syncDate);

      return {
        success: true,
        message: `Synchronisation réussie (${changesApplied} changement(s) appliqué(s))`,
        changesApplied,
      };
    } catch (error) {
      console.error('Erreur de synchronisation:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Erreur inconnue',
      };
    }
  },

  async applyRemoteChange(change: SyncChange): Promise<void> {
    const table = db[change.table as keyof typeof db] as any;
    if (!table) return;

    switch (change.operation) {
      case 'create':
      case 'update':
        await table.put(change.data);
        break;
      case 'delete':
        await table.delete(change.recordId);
        break;
    }
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

  async uploadToServer(serverUrl: string): Promise<SyncResult> {
    try {
      const { username, password } = useAuthStore.getState();
      const data = await this.exportLocalData();

      const response = await fetch(`${serverUrl}/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${btoa(`${username}:${password}`)}`,
        },
        body: JSON.stringify({ username, data }),
      });

      if (!response.ok) {
        throw new Error(`Erreur serveur: ${response.status}`);
      }

      return { success: true, message: 'Données uploadées avec succès' };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Erreur inconnue',
      };
    }
  },

  async downloadFromServer(serverUrl: string): Promise<SyncResult> {
    try {
      const { username, password } = useAuthStore.getState();

      const response = await fetch(`${serverUrl}/download?username=${username}`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${btoa(`${username}:${password}`)}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Erreur serveur: ${response.status}`);
      }

      const result = await response.json();
      await this.importData(result.data);

      return { success: true, message: 'Données téléchargées avec succès' };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Erreur inconnue',
      };
    }
  },
};

let syncIntervalId: ReturnType<typeof setInterval> | null = null;

export function startAutoSync(serverUrl: string, intervalSeconds: number): void {
  stopAutoSync();

  if (!serverUrl) return;

  syncIntervalId = setInterval(async () => {
    const online = navigator.onLine;
    if (online) {
      await syncService.syncWithServer(serverUrl);
    }
  }, intervalSeconds * 1000);
}

export function stopAutoSync(): void {
  if (syncIntervalId) {
    clearInterval(syncIntervalId);
    syncIntervalId = null;
  }
}
