'use client';

import { useState, useMemo } from 'react';
import { useContrats, useVehicules, useLocataires } from '@/hooks/useDatabase';
import { Header, Button, Select, Input } from '@/components';
import { useParametresStore } from '@/lib/stores/parametres';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Contrat, Vehicule, Locataire } from '@/models';

type FiltrePeriode = 'tous' | 'semaine' | 'mois' | 'vehicule' | 'client';

export default function RapportsPage() {
  const contrats = useContrats();
  const vehicules = useVehicules();
  const locataires = useLocataires();
  const { adminId } = useParametresStore();

  const [filtre, setFiltre] = useState<FiltrePeriode>('tous');
  const [selectedVehicule, setSelectedVehicule] = useState('');
  const [selectedLocataire, setSelectedLocataire] = useState('');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');

  const contratsFiltres = useMemo(() => {
    if (!contrats) return [];

    let result = [...contrats];
    const now = new Date();

    if (filtre === 'semaine') {
      const debutSemaine = new Date(now);
      debutSemaine.setDate(now.getDate() - now.getDay());
      debutSemaine.setHours(0, 0, 0, 0);
      result = result.filter((c) => new Date(c.date_debut) >= debutSemaine);
    } else if (filtre === 'mois') {
      const debutMois = new Date(now.getFullYear(), now.getMonth(), 1);
      result = result.filter((c) => new Date(c.date_debut) >= debutMois);
    } else if (filtre === 'vehicule' && selectedVehicule) {
      result = result.filter((c) => c.vehicule_id === selectedVehicule);
    } else if (filtre === 'client' && selectedLocataire) {
      result = result.filter((c) => c.locataire_id === selectedLocataire);
    }

    if (dateDebut) {
      result = result.filter((c) => new Date(c.date_debut) >= new Date(dateDebut));
    }
    if (dateFin) {
      result = result.filter((c) => new Date(c.date_debut) <= new Date(dateFin));
    }

    return result;
  }, [contrats, filtre, selectedVehicule, selectedLocataire, dateDebut, dateFin]);

  const getVehicule = (id: string): Vehicule | undefined => vehicules?.find((v) => v.id === id);
  const getLocataire = (id: string): Locataire | undefined => locataires?.find((l) => l.id === id);

  const totalRevenus = contratsFiltres.reduce((sum, c) => sum + c.prix_total, 0);
  const totalPenalites = contratsFiltres.reduce((sum, c) => sum + c.penalite_retard, 0);
  const contratsEnCours = contratsFiltres.filter((c) => !c.date_retour_reelle).length;
  const contratsClotures = contratsFiltres.filter((c) => c.date_retour_reelle).length;

  const generatePDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text('Rapport de Location', 14, 22);

    doc.setFontSize(10);
    doc.text(`Admin: ${adminId}`, 14, 32);
    doc.text(`Date: ${new Date().toLocaleDateString('fr-FR')}`, 14, 38);
    doc.text(`Filtre: ${filtre}`, 14, 44);

    doc.setFontSize(12);
    doc.text('Résumé', 14, 56);

    doc.setFontSize(10);
    doc.text(`Total contrats: ${contratsFiltres.length}`, 14, 64);
    doc.text(`Contrats en cours: ${contratsEnCours}`, 14, 70);
    doc.text(`Contrats clôturés: ${contratsClotures}`, 14, 76);
    doc.text(`Total revenus: ${totalRevenus.toLocaleString()}`, 14, 82);
    doc.text(`Total pénalités: ${totalPenalites.toLocaleString()}`, 14, 88);

    const tableData = contratsFiltres.map((c) => {
      const v = getVehicule(c.vehicule_id);
      const l = getLocataire(c.locataire_id);
      return [
        v?.nom ?? 'N/A',
        v?.plaque ?? '',
        l?.nom ?? 'N/A',
        new Date(c.date_debut).toLocaleDateString('fr-FR'),
        new Date(c.date_fin_prevue).toLocaleDateString('fr-FR'),
        c.date_retour_reelle ? new Date(c.date_retour_reelle).toLocaleDateString('fr-FR') : 'En cours',
        c.prix_total.toLocaleString(),
        c.penalite_retard > 0 ? c.penalite_retard.toLocaleString() : '-',
      ];
    });

    autoTable(doc, {
      startY: 96,
      head: [['Véhicule', 'Plaque', 'Locataire', 'Début', 'Fin prévue', 'Retour', 'Prix', 'Pénalité']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [37, 99, 235] },
      styles: { fontSize: 8 },
    });

    const filename = `rapport-${filtre}-${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);
  };

  return (
    <div>
      <Header
        title="Rapports"
        action={
          <Button onClick={generatePDF} disabled={contratsFiltres.length === 0}>
            Télécharger PDF
          </Button>
        }
      />

      <div className="p-6">
        <div className="bg-[#f5f5dc] rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Filtres</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Période</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-[#f5f5dc] focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={filtre}
                onChange={(e) => setFiltre(e.target.value as FiltrePeriode)}
              >
                <option value="tous">Tous</option>
                <option value="semaine">Cette semaine</option>
                <option value="mois">Ce mois</option>
                <option value="vehicule">Par véhicule</option>
                <option value="client">Par client</option>
              </select>
            </div>

            {filtre === 'vehicule' && (
              <Select
                label="Véhicule"
                value={selectedVehicule}
                onChange={(e) => setSelectedVehicule(e.target.value)}
                options={[
                  { value: '', label: 'Tous les véhicules' },
                  ...(vehicules?.map((v) => ({ value: v.id, label: `${v.nom} (${v.plaque})` })) ?? []),
                ]}
              />
            )}

            {filtre === 'client' && (
              <Select
                label="Client"
                value={selectedLocataire}
                onChange={(e) => setSelectedLocataire(e.target.value)}
                options={[
                  { value: '', label: 'Tous les clients' },
                  ...(locataires?.map((l) => ({ value: l.id, label: l.nom })) ?? []),
                ]}
              />
            )}

            <Input
              label="Date début"
              type="date"
              value={dateDebut}
              onChange={(e) => setDateDebut(e.target.value)}
            />

            <Input
              label="Date fin"
              type="date"
              value={dateFin}
              onChange={(e) => setDateFin(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-[#f5f5dc] rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Total contrats</p>
            <p className="text-2xl font-bold text-gray-900">{contratsFiltres.length}</p>
          </div>
          <div className="bg-[#f5f5dc] rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-sm text-gray-500">En cours</p>
            <p className="text-2xl font-bold text-blue-600">{contratsEnCours}</p>
          </div>
          <div className="bg-[#f5f5dc] rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Revenus</p>
            <p className="text-2xl font-bold text-green-600">{totalRevenus.toLocaleString()}</p>
          </div>
          <div className="bg-[#f5f5dc] rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Pénalités</p>
            <p className="text-2xl font-bold text-red-600">{totalPenalites.toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-[#f5f5dc] rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-[#e8e8c8]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Véhicule
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Client
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Début
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Fin
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Statut
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Prix
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Pénalité
                </th>
              </tr>
            </thead>
            <tbody className="bg-[#f5f5dc] divide-y divide-gray-200">
              {contratsFiltres.map((contrat) => {
                const vehicule = getVehicule(contrat.vehicule_id);
                const locataire = getLocataire(contrat.locataire_id);
                return (
                  <tr key={contrat.id} className="hover:bg-[#e8e8c8]">
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-900">
                        {vehicule?.nom ?? 'N/A'}
                      </div>
                      <div className="text-xs text-gray-500">{vehicule?.plaque}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {locataire?.nom ?? 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(contrat.date_debut).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(contrat.date_fin_prevue).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-4 py-3">
                      {contrat.date_retour_reelle ? (
                        <span className="text-xs font-medium px-2 py-1 rounded bg-green-100 text-green-800">
                          Clôturé
                        </span>
                      ) : (
                        <span className="text-xs font-medium px-2 py-1 rounded bg-blue-100 text-blue-800">
                          En cours
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">
                      {contrat.prix_total.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-red-600">
                      {contrat.penalite_retard > 0 ? contrat.penalite_retard.toLocaleString() : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {contratsFiltres.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">Aucun contrat trouvé pour ces critères</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
