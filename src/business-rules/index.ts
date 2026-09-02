import type { Vehicule, Contrat, Maintenance, DocumentVehicule } from '../models';
import { vehiculeRepository } from '../repositories/vehicule';
import { contratRepository } from '../repositories/contrat';
import { maintenanceRepository } from '../repositories/maintenance';
import { documentRepository } from '../repositories/document';
import { notificationRepository } from '../repositories/notification';
import { now } from '../lib/utils';
import {
  verifierRetard,
  verifierEcheanceMaintenance,
  verifierDocumentExpirant,
  calculerContrat,
} from './calculations';

export interface ResultatVerification {
  notificationsCreees: string[];
  vehiculesMisAJour: string[];
}

export async function verifierEtMettreAJourVehicules(): Promise<ResultatVerification> {
  const resultat: ResultatVerification = {
    notificationsCreees: [],
    vehiculesMisAJour: [],
  };

  const dateActuelle = now();
  const vehicules = await vehiculeRepository.getAll();

  for (const vehicule of vehicules) {
    if (vehicule.statut === 'en_location' && verifierRetard(vehicule, dateActuelle)) {
      await vehiculeRepository.update(vehicule.id, { statut: 'en_retard' });
      await notificationRepository.create({
        type: 'retard',
        reference_id: vehicule.id,
      });
      resultat.notificationsCreees.push(vehicule.id);
      resultat.vehiculesMisAJour.push(vehicule.id);
    }
  }

  return resultat;
}

export async function verifierEtMettreAJourMaintenances(): Promise<ResultatVerification> {
  const resultat: ResultatVerification = {
    notificationsCreees: [],
    vehiculesMisAJour: [],
  };

  const dateActuelle = now();
  const maintenances = await maintenanceRepository.getAll();
  const vehicules = await vehiculeRepository.getAll();

  for (const maintenance of maintenances) {
    const vehicule = vehicules.find((v) => v.id === maintenance.vehicule_id);
    if (!vehicule) continue;

    if (verifierEcheanceMaintenance(maintenance, vehicule.km_depart, dateActuelle)) {
      if (vehicule.statut === 'disponible') {
        await vehiculeRepository.update(vehicule.id, { statut: 'en_entretien' });
        resultat.vehiculesMisAJour.push(vehicule.id);
      }

      const notificationsExistantes = await notificationRepository.getByType('entretien_a_prevoir');
      const dejaNotifie = notificationsExistantes.some(
        (n) => n.reference_id === vehicule.id
      );

      if (!dejaNotifie) {
        await notificationRepository.create({
          type: 'entretien_a_prevoir',
          reference_id: vehicule.id,
        });
        resultat.notificationsCreees.push(vehicule.id);
      }
    }
  }

  return resultat;
}

export async function verifierEtMettreAJourDocuments(): Promise<ResultatVerification> {
  const resultat: ResultatVerification = {
    notificationsCreees: [],
    vehiculesMisAJour: [],
  };

  const dateActuelle = now();
  const documents = await documentRepository.getAll();

  for (const document of documents) {
    if (verifierDocumentExpirant(document, dateActuelle, 15)) {
      const notificationsExistantes = await notificationRepository.getByType('document_expire');
      const dejaNotifie = notificationsExistantes.some(
        (n) => n.reference_id === document.vehicule_id
      );

      if (!dejaNotifie) {
        await notificationRepository.create({
          type: 'document_expire',
          reference_id: document.vehicule_id,
        });
        resultat.notificationsCreees.push(document.vehicule_id);
      }
    }
  }

  return resultat;
}

export async function cloturerContrat(
  contratId: string,
  kmRetour: number,
  dateRetour: string
): Promise<{ success: boolean; error?: string; contrat?: Contrat }> {
  const contrat = await contratRepository.getById(contratId);
  if (!contrat) {
    return { success: false, error: 'Contrat non trouvé' };
  }

  if (kmRetour < contrat.km_depart) {
    return {
      success: false,
      error: 'Le kilométrage de retour ne peut pas être inférieur au kilométrage de départ',
    };
  }

  const vehicule = await vehiculeRepository.getById(contrat.vehicule_id);
  if (!vehicule) {
    return { success: false, error: 'Véhicule non trouvé' };
  }

  const contratMisAJour: Partial<Contrat> = {
    date_retour_reelle: dateRetour,
    km_retour: kmRetour,
  };

  const calcul = calculerContrat(
    { ...contrat, date_retour_reelle: dateRetour, km_retour: kmRetour },
    vehicule
  );

  contratMisAJour.prix_total = calcul.prix_total;
  contratMisAJour.penalite_retard = calcul.penalite_retard;

  const updated = await contratRepository.update(contratId, contratMisAJour);

  let nouveauStatut: Vehicule['statut'] = 'disponible';
  const maintenances = await maintenanceRepository.getByVehiculeId(vehicule.id);
  const dateActuelle = now();

  for (const maintenance of maintenances) {
    if (verifierEcheanceMaintenance(maintenance, kmRetour, dateActuelle)) {
      nouveauStatut = 'en_entretien';
      break;
    }
  }

  await vehiculeRepository.update(vehicule.id, {
    statut: nouveauStatut,
    km_retour: kmRetour,
    date_retour_effective: dateRetour,
    date_sortie_prevue: null,
  });

  return { success: true, contrat: updated };
}

export async function creerContratLocation(
  vehiculeId: string,
  locataireId: string,
  dateDebut: string,
  dateFinPrevue: string
): Promise<{ success: boolean; error?: string; contrat?: Contrat }> {
  const vehicule = await vehiculeRepository.getById(vehiculeId);
  if (!vehicule) {
    return { success: false, error: 'Véhicule non trouvé' };
  }

  if (vehicule.statut !== 'disponible') {
    return { success: false, error: 'Le véhicule n\'est pas disponible' };
  }

  const contrat = await contratRepository.create({
    vehicule_id: vehiculeId,
    locataire_id: locataireId,
    date_debut: dateDebut,
    date_fin_prevue: dateFinPrevue,
    km_depart: vehicule.km_depart,
  });

  await vehiculeRepository.update(vehiculeId, {
    statut: 'en_location',
    date_sortie_prevue: dateFinPrevue,
  });

  return { success: true, contrat };
}

export async function executerToutesLesVerifications(): Promise<ResultatVerification> {
  const resultat: ResultatVerification = {
    notificationsCreees: [],
    vehiculesMisAJour: [],
  };

  const retards = await verifierEtMettreAJourVehicules();
  const maintenances = await verifierEtMettreAJourMaintenances();
  const documents = await verifierEtMettreAJourDocuments();

  resultat.notificationsCreees = [
    ...retards.notificationsCreees,
    ...maintenances.notificationsCreees,
    ...documents.notificationsCreees,
  ];
  resultat.vehiculesMisAJour = [
    ...retards.vehiculesMisAJour,
    ...maintenances.vehiculesMisAJour,
  ];

  return resultat;
}
