import { db } from '../lib/db';
import { generateId, now } from '../lib/utils';
import { syncService } from '../lib/sync';
import type { Contrat } from '../models';

export interface CreateContratInput {
  vehicule_id: string;
  locataire_id: string;
  date_debut: string;
  date_fin_prevue: string;
  km_depart: number;
}

export interface UpdateContratInput {
  date_retour_reelle?: string | null;
  km_retour?: number | null;
  prix_total?: number;
  penalite_retard?: number;
}

export const contratRepository = {
  async getAll(): Promise<Contrat[]> {
    return db.contrats.orderBy('date_debut').reverse().toArray();
  },

  async getById(id: string): Promise<Contrat | undefined> {
    return db.contrats.get(id);
  },

  async getByVehiculeId(vehiculeId: string): Promise<Contrat[]> {
    return db.contrats.where('vehicule_id').equals(vehiculeId).toArray();
  },

  async getByLocataireId(locataireId: string): Promise<Contrat[]> {
    return db.contrats.where('locataire_id').equals(locataireId).toArray();
  },

  async getActifs(): Promise<Contrat[]> {
    return db.contrats.filter((c) => c.date_retour_reelle === null).toArray();
  },

  async create(input: CreateContratInput): Promise<Contrat> {
    const contrat: Contrat = {
      id: generateId(),
      vehicule_id: input.vehicule_id,
      locataire_id: input.locataire_id,
      date_debut: input.date_debut,
      date_fin_prevue: input.date_fin_prevue,
      date_retour_reelle: null,
      km_depart: input.km_depart,
      km_retour: null,
      prix_total: 0,
      penalite_retard: 0,
      updated_at: now(),
    };
    await db.contrats.add(contrat);
    return contrat;
  },

  async update(id: string, input: UpdateContratInput): Promise<Contrat | undefined> {
    const existing = await db.contrats.get(id);
    if (!existing) return undefined;

    const updated: Contrat = {
      ...existing,
      ...input,
      id: existing.id,
      updated_at: now(),
    };
    await db.contrats.put(updated);
    return updated;
  },

  async delete(id: string): Promise<void> {
    await db.contrats.delete(id);
    syncService.markDeleted('contrats', id);
  },
};
