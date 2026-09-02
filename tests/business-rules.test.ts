import {
  calculerContrat,
  verifierRetard,
  verifierEcheanceMaintenance,
  verifierDocumentExpirant,
  verifierKmRetourIncoherent,
} from '../src/business-rules/calculations';
import type { Vehicule, Contrat, Maintenance, DocumentVehicule } from '../src/models';

describe('calculerContrat', () => {
  const vehicule: Vehicule = {
    id: '1',
    nom: 'Test',
    plaque: 'AB-123',
    numero_chassis: 'CH001',
    couleur: 'Blanc',
    date_entree: '2024-01-01',
    date_sortie_prevue: null,
    date_retour_effective: null,
    km_depart: 10000,
    km_retour: null,
    tarif_journalier: 25000,
    statut: 'en_location',
    photos: [],
    updated_at: '2024-01-01',
  };

  it('calcul correctement le prix total sans retard', () => {
    const contrat: Contrat = {
      id: '1',
      vehicule_id: '1',
      locataire_id: '1',
      date_debut: '2024-01-01',
      date_fin_prevue: '2024-01-11',
      date_retour_reelle: '2024-01-10',
      km_depart: 10000,
      km_retour: 10500,
      prix_total: 0,
      penalite_retard: 0,
      updated_at: '2024-01-01',
    };

    const result = calculerContrat(contrat, vehicule);

    expect(result.jours_location).toBe(10);
    expect(result.prix_total).toBe(250000);
    expect(result.km_parcourus).toBe(500);
    expect(result.penalite_retard).toBe(0);
  });

  it('calcule correctement la pénalité de retard', () => {
    const contrat: Contrat = {
      id: '1',
      vehicule_id: '1',
      locataire_id: '1',
      date_debut: '2024-01-01',
      date_fin_prevue: '2024-01-11',
      date_retour_reelle: '2024-01-14',
      km_depart: 10000,
      km_retour: 11000,
      prix_total: 0,
      penalite_retard: 0,
      updated_at: '2024-01-01',
    };

    const result = calculerContrat(contrat, vehicule);

    expect(result.jours_retard).toBe(3);
    expect(result.penalite_retard).toBe(112500);
  });
});

describe('verifierRetard', () => {
  it('retourne true si le véhicule est en retard', () => {
    const vehicule: Vehicule = {
      id: '1',
      nom: 'Test',
      plaque: 'AB-123',
      numero_chassis: 'CH001',
      couleur: 'Blanc',
      date_entree: '2024-01-01',
      date_sortie_prevue: '2024-01-10',
      date_retour_effective: null,
      km_depart: 10000,
      km_retour: null,
      tarif_journalier: 25000,
      statut: 'en_location',
      photos: [],
      updated_at: '2024-01-01',
    };

    expect(verifierRetard(vehicule, '2024-01-11')).toBe(true);
  });

  it('retourne false si le véhicule nest pas en retard', () => {
    const vehicule: Vehicule = {
      id: '1',
      nom: 'Test',
      plaque: 'AB-123',
      numero_chassis: 'CH001',
      couleur: 'Blanc',
      date_entree: '2024-01-01',
      date_sortie_prevue: '2024-01-15',
      date_retour_effective: null,
      km_depart: 10000,
      km_retour: null,
      tarif_journalier: 25000,
      statut: 'en_location',
      photos: [],
      updated_at: '2024-01-01',
    };

    expect(verifierRetard(vehicule, '2024-01-10')).toBe(false);
  });

  it('retourne false si le véhicule nest pas en location', () => {
    const vehicule: Vehicule = {
      id: '1',
      nom: 'Test',
      plaque: 'AB-123',
      numero_chassis: 'CH001',
      couleur: 'Blanc',
      date_entree: '2024-01-01',
      date_sortie_prevue: '2024-01-10',
      date_retour_effective: null,
      km_depart: 10000,
      km_retour: null,
      tarif_journalier: 25000,
      statut: 'disponible',
      photos: [],
      updated_at: '2024-01-01',
    };

    expect(verifierRetard(vehicule, '2024-01-11')).toBe(false);
  });
});

describe('verifierEcheanceMaintenance', () => {
  const maintenance: Maintenance = {
    id: '1',
    vehicule_id: '1',
    type_entretien: 'Vidange',
    seuil_km: 50000,
    seuil_date: '2024-06-01',
    derniere_realisation: null,
    updated_at: '2024-01-01',
  };

  it('retourne true si le seuil km est atteint', () => {
    expect(verifierEcheanceMaintenance(maintenance, 50000, '2024-01-01')).toBe(true);
  });

  it('retourne true si le seuil date est atteint', () => {
    expect(verifierEcheanceMaintenance(maintenance, 40000, '2024-06-01')).toBe(true);
  });

  it('retourne false si aucun seuil nest atteint', () => {
    expect(verifierEcheanceMaintenance(maintenance, 40000, '2024-05-01')).toBe(false);
  });
});

describe('verifierDocumentExpirant', () => {
  const document: DocumentVehicule = {
    id: '1',
    vehicule_id: '1',
    type: 'assurance',
    date_expiration: '2024-03-01',
    updated_at: '2024-01-01',
  };

  it('retourne true si le document expire dans moins de 15 jours', () => {
    expect(verifierDocumentExpirant(document, '2024-02-15', 15)).toBe(true);
  });

  it('retourne false si le document expire dans plus de 15 jours', () => {
    expect(verifierDocumentExpirant(document, '2024-02-01', 15)).toBe(false);
  });
});

describe('verifierKmRetourIncoherent', () => {
  it('retourne true si km_retour < km_depart', () => {
    expect(verifierKmRetourIncoherent(9000, 10000)).toBe(true);
  });

  it('retourne false si km_retour >= km_depart', () => {
    expect(verifierKmRetourIncoherent(11000, 10000)).toBe(false);
  });

  it('retourne false si km_retour est null', () => {
    expect(verifierKmRetourIncoherent(null, 10000)).toBe(false);
  });
});
