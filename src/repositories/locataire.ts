import { db } from '../lib/db';
import { generateId, now } from '../lib/utils';
import { syncService } from '../lib/sync';
import type { Locataire } from '../models';

export interface CreateLocataireInput {
  nom: string;
  contact: string;
  numero_piece_identite: string;
  numero_permis: string;
  caution_montant?: number | null;
}

export interface UpdateLocataireInput {
  nom?: string;
  contact?: string;
  numero_piece_identite?: string;
  numero_permis?: string;
  caution_montant?: number | null;
}

export const locataireRepository = {
  async getAll(): Promise<Locataire[]> {
    return db.locataires.orderBy('nom').toArray();
  },

  async getById(id: string): Promise<Locataire | undefined> {
    return db.locataires.get(id);
  },

  async create(input: CreateLocataireInput): Promise<Locataire> {
    const locataire: Locataire = {
      id: generateId(),
      nom: input.nom,
      contact: input.contact,
      numero_piece_identite: input.numero_piece_identite,
      numero_permis: input.numero_permis,
      caution_montant: input.caution_montant ?? null,
      updated_at: now(),
    };
    await db.locataires.add(locataire);
    return locataire;
  },

  async update(id: string, input: UpdateLocataireInput): Promise<Locataire | undefined> {
    const existing = await db.locataires.get(id);
    if (!existing) return undefined;

    const updated: Locataire = {
      ...existing,
      ...input,
      id: existing.id,
      updated_at: now(),
    };
    await db.locataires.put(updated);
    return updated;
  },

  async delete(id: string): Promise<void> {
    await db.locataires.delete(id);
    syncService.markDeleted('locataires', id);
  },

  async search(query: string): Promise<Locataire[]> {
    const lowerQuery = query.toLowerCase();
    return db.locataires
      .filter(
        (l) =>
          l.nom.toLowerCase().includes(lowerQuery) ||
          l.contact.toLowerCase().includes(lowerQuery) ||
          l.numero_piece_identite.toLowerCase().includes(lowerQuery)
      )
      .toArray();
  },
};
