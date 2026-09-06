'use client';

import { useState } from 'react';
import { useContrats, useVehicules, useLocataires } from '@/hooks/useDatabase';
import { Header, Button, BadgeStatut, Modal, Input, Select } from '@/components';
import { contratRepository, vehiculeRepository } from '@/repositories';
import { creerContratLocation, cloturerContrat } from '@/business-rules';
import type { Contrat } from '@/models';

export default function ContratsPage() {
  const contrats = useContrats();
  const vehicules = useVehicules();
  const locataires = useLocataires();
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isClotureModalOpen, setIsClotureModalOpen] = useState(false);
  const [selectedContrat, setSelectedContrat] = useState<Contrat | null>(null);

  const [newForm, setNewForm] = useState({
    vehicule_id: '',
    locataire_id: '',
    date_debut: '',
    date_fin_prevue: '',
  });

  const [clotureForm, setClotureForm] = useState({
    km_retour: '',
    date_retour: '',
  });

  const handleCreateContrat = async () => {
    if (!newForm.vehicule_id || !newForm.locataire_id || !newForm.date_debut || !newForm.date_fin_prevue) {
      return;
    }

    const result = await creerContratLocation(
      newForm.vehicule_id,
      newForm.locataire_id,
      newForm.date_debut,
      newForm.date_fin_prevue
    );

    if (result.success) {
      setIsNewModalOpen(false);
      setNewForm({ vehicule_id: '', locataire_id: '', date_debut: '', date_fin_prevue: '' });
    } else {
      alert(result.error);
    }
  };

  const handleCloturer = async () => {
    if (!selectedContrat || !clotureForm.km_retour || !clotureForm.date_retour) return;

    const result = await cloturerContrat(
      selectedContrat.id,
      parseInt(clotureForm.km_retour),
      clotureForm.date_retour
    );

    if (result.success) {
      setIsClotureModalOpen(false);
      setSelectedContrat(null);
      setClotureForm({ km_retour: '', date_retour: '' });
    } else {
      alert(result.error);
    }
  };

  const vehiculesDisponibles = vehicules?.filter((v) => v.statut === 'disponible') ?? [];

  return (
    <div>
      <Header
        title="Contrats de location"
        action={
          <Button onClick={() => setIsNewModalOpen(true)}>Nouveau contrat</Button>
        }
      />

      <div className="p-6">
                <div className="mb-5 md:hidden">
                  <Button className="w-full" onClick={() => setIsNewModalOpen(true)}>Nouveau contrat</Button>
                </div>
        {contrats && contrats.length > 0 ? (
          <div className="bg-[#f5f5dc] rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto overscroll-x-contain touch-pan-x">
            <table className="min-w-[820px] divide-y divide-gray-200">
              <thead className="bg-[#e8e8c8]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Véhicule
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Locataire
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Début
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fin prévue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-[#f5f5dc] divide-y divide-gray-200">
                {contrats.map((contrat) => {
                  const vehicule = vehicules?.find((v) => v.id === contrat.vehicule_id);
                  const locataire = locataires?.find((l) => l.id === contrat.locataire_id);
                  return (
                    <tr key={contrat.id} className="hover:bg-[#e8e8c8]">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {vehicule?.nom ?? 'N/A'}
                        </div>
                        <div className="text-sm text-gray-500">{vehicule?.plaque}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{locataire?.nom ?? 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {new Date(contrat.date_debut).toLocaleDateString('fr-FR')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {new Date(contrat.date_fin_prevue).toLocaleDateString('fr-FR')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {contrat.date_retour_reelle ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Clôturé
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            En cours
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {!contrat.date_retour_reelle && (
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedContrat(contrat);
                              setIsClotureModalOpen(true);
                            }}
                          >
                            Clôturer
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun contrat</h3>
            <p className="mt-1 text-sm text-gray-500">
              Commencez par créer un nouveau contrat de location.
            </p>
            <div className="mt-6">
              <Button onClick={() => setIsNewModalOpen(true)}>Nouveau contrat</Button>
            </div>
          </div>
        )}
      </div>

      <Modal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        title="Nouveau contrat de location"
      >
        <div className="space-y-4">
          <Select
            label="Véhicule"
            value={newForm.vehicule_id}
            onChange={(e) => setNewForm({ ...newForm, vehicule_id: e.target.value })}
            options={[
              { value: '', label: 'Sélectionner un véhicule' },
              ...vehiculesDisponibles.map((v) => ({
                value: v.id,
                label: `${v.nom} (${v.plaque})`,
              })),
            ]}
          />
          <Select
            label="Locataire"
            value={newForm.locataire_id}
            onChange={(e) => setNewForm({ ...newForm, locataire_id: e.target.value })}
            options={[
              { value: '', label: 'Sélectionner un locataire' },
              ...(locataires?.map((l) => ({
                value: l.id,
                label: l.nom,
              })) ?? []),
            ]}
          />
          <Input
            label="Date de début"
            type="date"
            value={newForm.date_debut}
            onChange={(e) => setNewForm({ ...newForm, date_debut: e.target.value })}
          />
          <Input
            label="Date de fin prévue"
            type="date"
            value={newForm.date_fin_prevue}
            onChange={(e) => setNewForm({ ...newForm, date_fin_prevue: e.target.value })}
          />
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setIsNewModalOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreateContrat}>Créer le contrat</Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isClotureModalOpen}
        onClose={() => setIsClotureModalOpen(false)}
        title="Clôturer le contrat"
      >
        <div className="space-y-4">
          <Input
            label="Kilométrage de retour"
            type="number"
            value={clotureForm.km_retour}
            onChange={(e) => setClotureForm({ ...clotureForm, km_retour: e.target.value })}
            placeholder={`Km départ: ${selectedContrat?.km_depart}`}
          />
          <Input
            label="Date de retour effective"
            type="date"
            value={clotureForm.date_retour}
            onChange={(e) => setClotureForm({ ...clotureForm, date_retour: e.target.value })}
          />
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setIsClotureModalOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleCloturer}>Clôturer</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
