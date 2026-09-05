'use client';

import { useEffect } from 'react';
import { db } from '@/lib/db';
import { useAuthStore } from '@/lib/stores/auth';
import { syncService } from '@/lib/sync';

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Synchronise automatiquement les données :
 * - À chaque modification locale (ajout/édit/suppression) → push vers le serveur
 * - Périodiquement → pull depuis le serveur pour voir les changements des autres appareils
 */
export function useAutoSync(intervalSeconds: number = 30) {
  const { isAuthenticated, token } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated || !token) return;

    const onChange = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        if (navigator.onLine) {
          syncService.pushToServer();
        }
      }, 1500);
    };

    db.on('changes', onChange);

    // Pull périodique pour récupérer les changements des autres appareils
    const pullInterval = setInterval(() => {
      if (navigator.onLine) {
        syncService.pullFromServer();
      }
    }, intervalSeconds * 1000);

    return () => {
      db.on('changes').unsubscribe(onChange);
      if (debounceTimer) clearTimeout(debounceTimer);
      clearInterval(pullInterval);
    };
  }, [isAuthenticated, token, intervalSeconds]);
}