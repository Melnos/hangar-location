import { db } from '../lib/db';
import { generateId, now } from '../lib/utils';
import type { Vehicule, StatutVehicule } from '../models';

export interface CreateVehiculeInput {
  nom: string;
  plaque: string;
  numero_chassis: string;
  couleur: string;
  km_depart: number;
  tarif_journalier: number;
  photos?: string[];
}

export interface UpdateVehiculeInput {
  nom?: string;
  plaque?: string;
  numero_chassis?: string;
  couleur?: string;
  km_depart?: number;
  km_retour?: number;
  tarif_journalier?: number;
  statut?: StatutVehicule;
  date_sortie_prevue?: string | null;
  date_retour_effective?: string | null;
  photos?: string[];
}

export const vehiculeRepository = {
  async getAll(): Promise<Vehicule[]> {
    return db.vehicules.orderBy('updated_at').reverse().toArray();
  },

  async getById(id: string): Promise<Vehicule | undefined> {
    return db.vehicules.get(id);
  },

  async getByStatut(statut: StatutVehicule): Promise<Vehicule[]> {
    return db.vehicules.where('statut').equals(statut).toArray();
  },

  async create(input: CreateVehiculeInput): Promise<Vehicule> {
    const vehicule: Vehicule = {
      id: generateId(),
      nom: input.nom,
      plaque: input.plaque,
      numero_chassis: input.numero_chassis,
      couleur: input.couleur,
      date_entree: now(),
      date_sortie_prevue: null,
      date_retour_effective: null,
      km_depart: input.km_depart,
      km_retour: null,
      tarif_journalier: input.tarif_journalier,
      statut: 'disponible',
      photos: input.photos ?? [],
      updated_at: now(),
    };
    await db.vehicules.add(vehicule);
    return vehicule;
  },

  async update(id: string, input: UpdateVehiculeInput): Promise<Vehicule | undefined> {
    const existing = await db.vehicules.get(id);
    if (!existing) return undefined;

    const updated: Vehicule = {
      ...existing,
      ...input,
      id: existing.id,
      updated_at: now(),
    };
    await db.vehicules.put(updated);
    return updated;
  },

  async delete(id: string): Promise<void> {
    await db.vehicules.delete(id);
  },

  async search(query: string): Promise<Vehicule[]> {
    const lowerQuery = query.toLowerCase();
    return db.vehicules
      .filter(
        (v) =>
          v.nom.toLowerCase().includes(lowerQuery) ||
          v.plaque.toLowerCase().includes(lowerQuery) ||
          v.numero_chassis.toLowerCase().includes(lowerQuery)
      )
      .toArray();
  },
};
