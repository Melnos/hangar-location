'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { executerToutesLesVerifications } from '@/business-rules';
import { useEffect } from 'react';
import { showLocalNotification } from '@/lib/notifications';
import type { Vehicule, Locataire, Contrat, DocumentVehicule, Maintenance, Notification } from '@/models';

export function useVehicules(): Vehicule[] | undefined {
  return useLiveQuery(() => db.vehicules.toArray(), []);
}

export function useVehicule(id: string | null): Vehicule | undefined {
  return useLiveQuery(
    () => (id ? db.vehicules.get(id) : Promise.resolve(undefined)),
    [id]
  ) as Vehicule | undefined;
}

export function useLocataires(): Locataire[] | undefined {
  return useLiveQuery(() => db.locataires.toArray(), []);
}

export function useLocataire(id: string | null): Locataire | undefined {
  return useLiveQuery(
    () => (id ? db.locataires.get(id) : Promise.resolve(undefined)),
    [id]
  ) as Locataire | undefined;
}

export function useContrats(): Contrat[] | undefined {
  return useLiveQuery(() => db.contrats.toArray(), []);
}

export function useContrat(id: string | null): Contrat | undefined {
  return useLiveQuery(
    () => (id ? db.contrats.get(id) : Promise.resolve(undefined)),
    [id]
  ) as Contrat | undefined;
}

export function useNotifications(): Notification[] | undefined {
  return useLiveQuery(() => db.notifications.toArray(), []);
}

export function useNotificationsNonLues(): number | undefined {
  return useLiveQuery(
    () => db.notifications.filter((n) => !n.lue).count(),
    []
  );
}

export function useDocumentsVehicule(vehiculeId: string | null): DocumentVehicule[] | undefined {
  return useLiveQuery(
    async () => (vehiculeId ? db.documents_vehicule.where('vehicule_id').equals(vehiculeId).toArray() : []),
    [vehiculeId]
  ) as DocumentVehicule[] | undefined;
}

export function useMaintenancesVehicule(vehiculeId: string | null): Maintenance[] | undefined {
  return useLiveQuery(
    async () => (vehiculeId ? db.maintenances.where('vehicule_id').equals(vehiculeId).toArray() : []),
    [vehiculeId]
  ) as Maintenance[] | undefined;
}

export function useBusinessRules() {
  useEffect(() => {
    let previousNotificationCount = 0;

    const runVerifications = async () => {
      const result = await executerToutesLesVerifications();

      if (result.notificationsCreees.length > 0 && previousNotificationCount > 0) {
        const newCount = result.notificationsCreees.length;
        if (newCount > 0) {
          showLocalNotification(
            'Hangar Location',
            `${newCount} nouvelle(s) notification(s) - Action requise`,
            { type: 'alert' }
          );
        }
      }

      const allNotifications = await db.notifications.count();
      previousNotificationCount = allNotifications;
    };

    runVerifications();
    const interval = setInterval(runVerifications, 60000);

    return () => clearInterval(interval);
  }, []);
}
