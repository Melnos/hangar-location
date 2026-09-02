import type { Vehicule, Contrat, Maintenance, DocumentVehicule } from '../models';
import { daysBetween, isAfter, isBefore, addDays } from '../lib/utils';

export interface ResultatCalcul {
  km_parcourus: number;
  jours_location: number;
  prix_total: number;
  penalite_retard: number;
  jours_retard: number;
}

export function calculerContrat(
  contrat: Contrat,
  vehicule: Vehicule
): ResultatCalcul {
  const km_parcourus = (contrat.km_retour ?? contrat.km_depart) - contrat.km_depart;
  const jours_location = daysBetween(contrat.date_debut, contrat.date_fin_prevue);
  const prix_total = jours_location * vehicule.tarif_journalier;

  let penalite_retard = 0;
  let jours_retard = 0;

  if (contrat.date_retour_reelle) {
    if (isAfter(contrat.date_retour_reelle, contrat.date_fin_prevue)) {
      jours_retard = daysBetween(contrat.date_fin_prevue, contrat.date_retour_reelle);
      penalite_retard = jours_retard * vehicule.tarif_journalier * 1.5;
    }
  }

  return {
    km_parcourus,
    jours_location,
    prix_total,
    penalite_retard,
    jours_retard,
  };
}

export function verifierRetard(vehicule: Vehicule, dateActuelle: string): boolean {
  if (vehicule.statut !== 'en_location') return false;
  if (!vehicule.date_sortie_prevue) return false;
  return isAfter(dateActuelle, vehicule.date_sortie_prevue);
}

export function verifierEcheanceMaintenance(
  maintenance: Maintenance,
  kmActuel: number,
  dateActuelle: string
): boolean {
  const echeanceKm = kmActuel >= maintenance.seuil_km;
  const echeanceDate = isAfter(dateActuelle, maintenance.seuil_date) || dateActuelle === maintenance.seuil_date;
  return echeanceKm || echeanceDate;
}

export function verifierDocumentExpirant(
  document: DocumentVehicule,
  dateActuelle: string,
  joursAlerte: number = 15
): boolean {
  const dateAlerte = addDays(document.date_expiration, -joursAlerte);
  return isAfter(dateActuelle, dateAlerte) || dateActuelle === dateAlerte;
}

export function verifierKmRetourIncoherent(
  kmRetour: number | null,
  kmDepart: number
): boolean {
  if (kmRetour === null) return false;
  return kmRetour < kmDepart;
}

export function determinerStatutVehicule(
  vehicule: Vehicule,
  aDesMaintenancesEcheance: boolean,
  dateActuelle: string
): Vehicule['statut'] {
  if (vehicule.statut === 'hors_service') return 'hors_service';

  if (verifierRetard(vehicule, dateActuelle)) {
    return 'en_retard';
  }

  if (aDesMaintenancesEcheance) {
    return 'en_entretien';
  }

  return vehicule.statut;
}
