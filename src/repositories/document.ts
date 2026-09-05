import { db } from '../lib/db';
import { generateId, now } from '../lib/utils';
import { syncService } from '../lib/sync';
import type { DocumentVehicule, TypeDocument } from '../models';

export interface CreateDocumentInput {
  vehicule_id: string;
  type: TypeDocument;
  date_expiration: string;
}

export interface UpdateDocumentInput {
  type?: TypeDocument;
  date_expiration?: string;
}

export const documentRepository = {
  async getAll(): Promise<DocumentVehicule[]> {
    return db.documents_vehicule.toArray();
  },

  async getById(id: string): Promise<DocumentVehicule | undefined> {
    return db.documents_vehicule.get(id);
  },

  async getByVehiculeId(vehiculeId: string): Promise<DocumentVehicule[]> {
    return db.documents_vehicule.where('vehicule_id').equals(vehiculeId).toArray();
  },

  async getExpirantBientot(jours: number): Promise<DocumentVehicule[]> {
    const limite = new Date();
    limite.setDate(limite.getDate() + jours);
    const limiteStr = limite.toISOString();

    return db.documents_vehicule
      .filter((d) => d.date_expiration <= limiteStr)
      .toArray();
  },

  async create(input: CreateDocumentInput): Promise<DocumentVehicule> {
    const document: DocumentVehicule = {
      id: generateId(),
      vehicule_id: input.vehicule_id,
      type: input.type,
      date_expiration: input.date_expiration,
      updated_at: now(),
    };
    await db.documents_vehicule.add(document);
    return document;
  },

  async update(id: string, input: UpdateDocumentInput): Promise<DocumentVehicule | undefined> {
    const existing = await db.documents_vehicule.get(id);
    if (!existing) return undefined;

    const updated: DocumentVehicule = {
      ...existing,
      ...input,
      id: existing.id,
      updated_at: now(),
    };
    await db.documents_vehicule.put(updated);
    return updated;
  },

  async delete(id: string): Promise<void> {
    await db.documents_vehicule.delete(id);
    syncService.markDeleted('documents_vehicule', id);
  },
};
