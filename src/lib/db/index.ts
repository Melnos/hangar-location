import Dexie, { type Table } from 'dexie';
import type {
  Vehicule,
  Locataire,
  Contrat,
  DocumentVehicule,
  Maintenance,
  Notification,
} from '../../models';

export interface User {
  id: string;
  username: string;
  password: string;
  role: 'admin' | 'user';
  created_by: string | null;
  createdAt: string;
  lastLogin: string | null;
}

export class HangarDatabase extends Dexie {
  vehicules!: Table<Vehicule, string>;
  locataires!: Table<Locataire, string>;
  contrats!: Table<Contrat, string>;
  documents_vehicule!: Table<DocumentVehicule, string>;
  maintenances!: Table<Maintenance, string>;
  notifications!: Table<Notification, string>;
  users!: Table<User, string>;

  constructor() {
    super('HangarLocationDB');

    this.version(1).stores({
      vehicules: 'id, plaque, numero_chassis, statut, updated_at',
      locataires: 'id, nom, contact, numero_piece_identite, updated_at',
      contrats: 'id, vehicule_id, locataire_id, date_debut, date_fin_prevue, updated_at',
      documents_vehicule: 'id, vehicule_id, type, date_expiration, updated_at',
      maintenances: 'id, vehicule_id, type_entretien, seuil_date, updated_at',
      notifications: 'id, type, reference_id, date_declenchement, lue, updated_at',
      users: 'id, username, password, role, created_by, createdAt, lastLogin',
    });
  }
}

export const db = new HangarDatabase();