'use client';

import { useEffect, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { useAuthStore } from '@/lib/stores/auth';
import { syncService } from '@/lib/sync';

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

function schedulePush() {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      syncService.pushToServer();
    }
  }, 1500);
}

/**
 * Synchronisation automatique entre appareils :
 * - Detecte les changements locaux (signature des tables) → push vers le serveur
 * - Pull periodique pour recuperer les changements des autres appareils
 */
export function useAutoSync(intervalSeconds: number = 30) {
  const { isAuthenticated, token } = useAuthStore();

  // Signature des donnees locales : compte + date de derniere modification par table.
  // Toute ecriture (ajout/modif) change cette signature et declenche un push.
  const changeSignature = useLiveQuery(async () => {
    const tables = [db.vehicules, db.locataires, db.contrats, db.documents_vehicule, db.maintenances, db.notifications];
    const parts: string[] = [];
    for (const t of tables) {
      const arr = await t.toArray();
      let max = '';
      for (const r of arr as Array<{ updated_at?: string }>) {
        if (r?.updated_at && r.updated_at > max) max = r.updated_at;
      }
      parts.push(`${arr.length}:${max}`);
    }
    return parts.join('|');
  }, []);

  const lastSignature = useRef<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !token) return;
    if (!changeSignature) return;
    if (changeSignature === lastSignature.current) return;
    lastSignature.current = changeSignature;
    schedulePush();
  }, [changeSignature, isAuthenticated, token]);

  // Pull periodique pour voir les changements des autres appareils
  useEffect(() => {
    if (!isAuthenticated || !token) return;
    const pullInterval = setInterval(() => {
      if (navigator.onLine) {
        syncService.pullFromServer();
      }
    }, intervalSeconds * 1000);
    return () => clearInterval(pullInterval);
  }, [isAuthenticated, token, intervalSeconds]);
}