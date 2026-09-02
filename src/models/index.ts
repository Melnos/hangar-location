export type StatutVehicule = 'disponible' | 'en_location' | 'en_retard' | 'en_entretien' | 'hors_service';

export interface Vehicule {
  id: string;
  nom: string;
  plaque: string;
  numero_chassis: string;
  couleur: string;
  date_entree: string;
  date_sortie_prevue: string | null;
  date_retour_effective: string | null;
  km_depart: number;
  km_retour: number | null;
  tarif_journalier: number;
  statut: StatutVehicule;
  photos: string[];
  updated_at: string;
}

export interface Locataire {
  id: string;
  nom: string;
  contact: string;
  numero_piece_identite: string;
  numero_permis: string;
  caution_montant: number | null;
  updated_at: string;
}

export interface Contrat {
  id: string;
  vehicule_id: string;
  locataire_id: string;
  date_debut: string;
  date_fin_prevue: string;
  date_retour_reelle: string | null;
  km_depart: number;
  km_retour: number | null;
  prix_total: number;
  penalite_retard: number;
  updated_at: string;
}

export type TypeDocument = 'assurance' | 'visite_technique' | 'carte_grise';

export interface DocumentVehicule {
  id: string;
  vehicule_id: string;
  type: TypeDocument;
  date_expiration: string;
  updated_at: string;
}

export interface Maintenance {
  id: string;
  vehicule_id: string;
  type_entretien: string;
  seuil_km: number;
  seuil_date: string;
  derniere_realisation: string | null;
  updated_at: string;
}

export type TypeNotification = 'retard' | 'document_expire' | 'entretien_a_prevoir';

export interface Notification {
  id: string;
  type: TypeNotification;
  reference_id: string;
  date_declenchement: string;
  lue: boolean;
  updated_at: string;
}
