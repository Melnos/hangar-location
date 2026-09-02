'use client';

import { useState } from 'react';
import { useLocataires } from '@/hooks/useDatabase';
import { Header, Button, Input } from '@/components';
import { locataireRepository } from '@/repositories';
import { Modal } from '@/components';

export default function LocatairesPage() {
  const locataires = useLocataires();
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    nom: '',
    contact: '',
    numero_piece_identite: '',
    numero_permis: '',
    caution_montant: '',
  });

  const filteredLocataires = locataires?.filter((l) => {
    return (
      searchQuery === '' ||
      l.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.contact.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const handleSubmit = async () => {
    await locataireRepository.create({
      nom: form.nom,
      contact: form.contact,
      numero_piece_identite: form.numero_piece_identite,
      numero_permis: form.numero_permis,
      caution_montant: form.caution_montant ? parseFloat(form.caution_montant) : null,
    });
    setIsModalOpen(false);
    setForm({
      nom: '',
      contact: '',
      numero_piece_identite: '',
      numero_permis: '',
      caution_montant: '',
    });
  };

  return (
    <div>
      <Header
        title="Locataires"
        action={
          <Button onClick={() => setIsModalOpen(true)}>Nouveau locataire</Button>
        }
      />

      <div className="p-6">
        <div className="mb-6">
          <Input
            label=""
            placeholder="Rechercher un locataire..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {filteredLocataires && filteredLocataires.length > 0 ? (
          <div className="bg-[#f5f5dc] rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-[#e8e8c8]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nom
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    N° Pièce d'identité
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    N° Permis
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-[#f5f5dc] divide-y divide-gray-200">
                {filteredLocataires.map((locataire) => (
                  <tr key={locataire.id} className="hover:bg-[#e8e8c8]">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{locataire.nom}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{locataire.contact}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{locataire.numero_piece_identite}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{locataire.numero_permis}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => locataireRepository.delete(locataire.id)}
                      >
                        Supprimer
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun locataire</h3>
            <p className="mt-1 text-sm text-gray-500">
              Commencez par ajouter un nouveau locataire.
            </p>
            <div className="mt-6">
              <Button onClick={() => setIsModalOpen(true)}>Nouveau locataire</Button>
            </div>
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Nouveau locataire"
      >
        <div className="space-y-4">
          <Input
            label="Nom complet"
            value={form.nom}
            onChange={(e) => setForm({ ...form, nom: e.target.value })}
            placeholder="Ex: Jean Dupont"
          />
          <Input
            label="Contact (téléphone)"
            value={form.contact}
            onChange={(e) => setForm({ ...form, contact: e.target.value })}
            placeholder="Ex: +243 123 456 789"
          />
          <Input
            label="N° Pièce d'identité"
            value={form.numero_piece_identite}
            onChange={(e) => setForm({ ...form, numero_piece_identite: e.target.value })}
          />
          <Input
            label="N° Permis de conduire"
            value={form.numero_permis}
            onChange={(e) => setForm({ ...form, numero_permis: e.target.value })}
          />
          <Input
            label="Montant de la caution"
            type="number"
            value={form.caution_montant}
            onChange={(e) => setForm({ ...form, caution_montant: e.target.value })}
            placeholder="Optionnel"
          />
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSubmit}>Créer</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
