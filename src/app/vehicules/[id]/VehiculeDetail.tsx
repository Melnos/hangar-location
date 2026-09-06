'use client';

import { useState } from 'react';
import { useVehicule, useDocumentsVehicule, useMaintenancesVehicule } from '@/hooks/useDatabase';
import { Header, BadgeStatut, Button, Input, Modal } from '@/components';
import { vehiculeRepository, documentRepository, maintenanceRepository } from '@/repositories';
import { useRouter } from 'next/navigation';
import { formatFCFA } from '@/lib/utils';
import Link from 'next/link';

interface Props {
  params: { id: string };
}

export default function VehiculeDetailPage({ params }: Props) {
  const vehicule = useVehicule(params.id);
  const documents = useDocumentsVehicule(params.id);
  const maintenances = useMaintenancesVehicule(params.id);
  const router = useRouter();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);

  const [docForm, setDocForm] = useState({
    type: 'assurance' as 'assurance' | 'visite_technique' | 'carte_grise',
    date_expiration: '',
  });

  const [maintenanceForm, setMaintenanceForm] = useState({
    type_entretien: '',
    seuil_km: 0,
    seuil_date: '',
  });

  if (!vehicule) {
    return (
      <div>
        <Header title="Véhicule non trouvé" />
        <div className="p-6 text-center">
          <p className="text-gray-500">Ce véhicule n'existe pas.</p>
          <Link href="/vehicules">
            <Button className="mt-4">Retour à la liste</Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleDelete = async () => {
    await vehiculeRepository.delete(vehicule.id);
    router.push('/vehicules');
  };

  const handleAddDocument = async () => {
    await documentRepository.create({
      vehicule_id: vehicule.id,
      type: docForm.type,
      date_expiration: docForm.date_expiration,
    });
    setIsDocModalOpen(false);
    setDocForm({ type: 'assurance', date_expiration: '' });
  };

  const handleAddMaintenance = async () => {
    await maintenanceRepository.create({
      vehicule_id: vehicule.id,
      type_entretien: maintenanceForm.type_entretien,
      seuil_km: maintenanceForm.seuil_km,
      seuil_date: maintenanceForm.seuil_date,
    });
    setIsMaintenanceModalOpen(false);
    setMaintenanceForm({ type_entretien: '', seuil_km: 0, seuil_date: '' });
  };

  return (
    <div>
      <Header title={vehicule.nom} />
      <div className="p-6 max-w-4xl space-y-6">
        <div className="bg-[#f5f5dc] rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-xl font-semibold">{vehicule.nom}</h2>
              <p className="text-gray-500">{vehicule.plaque}</p>
            </div>
            <BadgeStatut statut={vehicule.statut} />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Numéro de châssis</p>
              <p className="font-medium">{vehicule.numero_chassis}</p>
            </div>
            <div>
              <p className="text-gray-500">Couleur</p>
              <p className="font-medium">{vehicule.couleur}</p>
            </div>
            <div>
              <p className="text-gray-500">Kilométrage</p>
              <p className="font-medium">{vehicule.km_depart.toLocaleString()} km</p>
            </div>
            <div>
              <p className="text-gray-500">Tarif journalier</p>
              <p className="font-medium">{formatFCFA(vehicule.tarif_journalier)}</p>
            </div>
            <div>
              <p className="text-gray-500">Date d'entrée</p>
              <p className="font-medium">{new Date(vehicule.date_entree).toLocaleDateString('fr-FR')}</p>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <Link href={`/vehicules/${vehicule.id}/modifier`}>
              <Button variant="secondary">Modifier</Button>
            </Link>
            <Button variant="danger" onClick={() => setIsDeleteModalOpen(true)}>
              Supprimer
            </Button>
          </div>
        </div>

        <div className="bg-[#f5f5dc] rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Documents</h3>
            <Button size="sm" onClick={() => setIsDocModalOpen(true)}>Ajouter</Button>
          </div>
          {documents && documents.length > 0 ? (
            <div className="space-y-2">
              {documents.map((doc) => (
                <div key={doc.id} className="flex justify-between items-center p-3 bg-white rounded border">
                  <div>
                    <p className="font-medium capitalize">{doc.type.replace('_', ' ')}</p>
                    <p className="text-sm text-gray-500">Expire le {new Date(doc.date_expiration).toLocaleDateString('fr-FR')}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => documentRepository.delete(doc.id)}
                  >
                    Supprimer
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">Aucun document</p>
          )}
        </div>

        <div className="bg-[#f5f5dc] rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Maintenances</h3>
            <Button size="sm" onClick={() => setIsMaintenanceModalOpen(true)}>Ajouter</Button>
          </div>
          {maintenances && maintenances.length > 0 ? (
            <div className="space-y-2">
              {maintenances.map((m) => (
                <div key={m.id} className="flex justify-between items-center p-3 bg-white rounded border">
                  <div>
                    <p className="font-medium">{m.type_entretien}</p>
                    <p className="text-sm text-gray-500">
                      Seuil: {m.seuil_km.toLocaleString()} km ou {new Date(m.seuil_date).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => maintenanceRepository.delete(m.id)}
                  >
                    Supprimer
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">Aucune maintenance planifiée</p>
          )}
        </div>
      </div>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirmer la suppression"
      >
        <p className="mb-4">Êtes-vous sûr de vouloir supprimer ce véhicule ?</p>
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={() => setIsDeleteModalOpen(false)}>
            Annuler
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            Supprimer
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={isDocModalOpen}
        onClose={() => setIsDocModalOpen(false)}
        title="Ajouter un document"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={docForm.type}
              onChange={(e) => setDocForm({ ...docForm, type: e.target.value as any })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="assurance">Assurance</option>
              <option value="visite_technique">Visite technique</option>
              <option value="carte_grise">Carte grise</option>
            </select>
          </div>
          <Input
            label="Date d'expiration"
            type="date"
            value={docForm.date_expiration}
            onChange={(e) => setDocForm({ ...docForm, date_expiration: e.target.value })}
          />
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setIsDocModalOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleAddDocument}>Ajouter</Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isMaintenanceModalOpen}
        onClose={() => setIsMaintenanceModalOpen(false)}
        title="Ajouter une maintenance"
      >
        <div className="space-y-4">
          <Input
            label="Type d'entretien"
            value={maintenanceForm.type_entretien}
            onChange={(e) => setMaintenanceForm({ ...maintenanceForm, type_entretien: e.target.value })}
            placeholder="Vidange, Freins, etc."
          />
          <Input
            label="Seuil kilométrique"
            type="number"
            value={maintenanceForm.seuil_km}
            onChange={(e) => setMaintenanceForm({ ...maintenanceForm, seuil_km: parseInt(e.target.value) || 0 })}
          />
          <Input
            label="Seuil date"
            type="date"
            value={maintenanceForm.seuil_date}
            onChange={(e) => setMaintenanceForm({ ...maintenanceForm, seuil_date: e.target.value })}
          />
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setIsMaintenanceModalOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleAddMaintenance}>Ajouter</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
