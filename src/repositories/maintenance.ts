import { db } from '../lib/db';
import { generateId, now } from '../lib/utils';
import { syncService } from '../lib/sync';
import type { Maintenance } from '../models';

export interface CreateMaintenanceInput {
  vehicule_id: string;
  type_entretien: string;
  seuil_km: number;
  seuil_date: string;
  derniere_realisation?: string | null;
}

export interface UpdateMaintenanceInput {
  type_entretien?: string;
  seuil_km?: number;
  seuil_date?: string;
  derniere_realisation?: string | null;
}

export const maintenanceRepository = {
  async getAll(): Promise<Maintenance[]> {
    return db.maintenances.toArray();
  },

  async getById(id: string): Promise<Maintenance | undefined> {
    return db.maintenances.get(id);
  },

  async getByVehiculeId(vehiculeId: string): Promise<Maintenance[]> {
    return db.maintenances.where('vehicule_id').equals(vehiculeId).toArray();
  },

  async getEcheanceKm(kmActuel: number): Promise<Maintenance[]> {
    return db.maintenances
      .filter((m) => m.seuil_km <= kmActuel)
      .toArray();
  },

  async getEcheanceDate(dateActuelle: string): Promise<Maintenance[]> {
    return db.maintenances
      .filter((m) => m.seuil_date <= dateActuelle)
      .toArray();
  },

  async create(input: CreateMaintenanceInput): Promise<Maintenance> {
    const maintenance: Maintenance = {
      id: generateId(),
      vehicule_id: input.vehicule_id,
      type_entretien: input.type_entretien,
      seuil_km: input.seuil_km,
      seuil_date: input.seuil_date,
      derniere_realisation: input.derniere_realisation ?? null,
      updated_at: now(),
    };
    await db.maintenances.add(maintenance);
    return maintenance;
  },

  async update(id: string, input: UpdateMaintenanceInput): Promise<Maintenance | undefined> {
    const existing = await db.maintenances.get(id);
    if (!existing) return undefined;

    const updated: Maintenance = {
      ...existing,
      ...input,
      id: existing.id,
      updated_at: now(),
    };
    await db.maintenances.put(updated);
    return updated;
  },

  async delete(id: string): Promise<void> {
    await db.maintenances.delete(id);
    syncService.markDeleted('maintenances', id);
  },
};
