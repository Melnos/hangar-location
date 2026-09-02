'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header, Input, Button } from '@/components';
import { vehiculeRepository } from '@/repositories';
import type { StatutVehicule } from '@/models';

interface Props {
  params: { id: string };
}

export default function ModifierVehiculePage({ params }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    nom: '',
    plaque: '',
    numero_chassis: '',
    couleur: '',
    km_depart: '',
    tarif_journalier: '',
    statut: 'disponible' as StatutVehicule,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadVehicule = async () => {
      const vehicule = await vehiculeRepository.getById(params.id);
      if (vehicule) {
        setForm({
          nom: vehicule.nom,
          plaque: vehicule.plaque,
          numero_chassis: vehicule.numero_chassis,
          couleur: vehicule.couleur,
          km_depart: vehicule.km_depart.toString(),
          tarif_journalier: vehicule.tarif_journalier.toString(),
          statut: vehicule.statut,
        });
      }
    };
    loadVehicule();
  }, [params.id]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.nom.trim()) newErrors.nom = 'Le nom est requis';
    if (!form.plaque.trim()) newErrors.plaque = 'La plaque est requise';
    if (!form.numero_chassis.trim()) newErrors.numero_chassis = 'Le numéro de châssis est requis';
    if (!form.couleur.trim()) newErrors.couleur = 'La couleur est requise';
    if (!form.km_depart || parseInt(form.km_depart) < 0)
      newErrors.km_depart = 'Le kilométrage est requis';
    if (!form.tarif_journalier || parseFloat(form.tarif_journalier) <= 0)
      newErrors.tarif_journalier = 'Le tarif est requis';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await vehiculeRepository.update(params.id, {
        nom: form.nom,
        plaque: form.plaque,
        numero_chassis: form.numero_chassis,
        couleur: form.couleur,
        km_depart: parseInt(form.km_depart),
        tarif_journalier: parseFloat(form.tarif_journalier),
        statut: form.statut,
      });
      router.push(`/vehicules/${params.id}`);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Header title="Modifier le véhicule" />
      <div className="p-6 max-w-2xl">
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="space-y-4">
            <Input
              label="Nom du véhicule"
              value={form.nom}
              onChange={(e) => setForm({ ...form, nom: e.target.value })}
              error={errors.nom}
            />
            <Input
              label="Plaque d'immatriculation"
              value={form.plaque}
              onChange={(e) => setForm({ ...form, plaque: e.target.value })}
              error={errors.plaque}
            />
            <Input
              label="Numéro de châssis"
              value={form.numero_chassis}
              onChange={(e) => setForm({ ...form, numero_chassis: e.target.value })}
              error={errors.numero_chassis}
            />
            <Input
              label="Couleur"
              value={form.couleur}
              onChange={(e) => setForm({ ...form, couleur: e.target.value })}
              error={errors.couleur}
            />
            <Input
              label="Kilométrage actuel"
              type="number"
              value={form.km_depart}
              onChange={(e) => setForm({ ...form, km_depart: e.target.value })}
              error={errors.km_depart}
            />
            <Input
              label="Tarif journalier"
              type="number"
              value={form.tarif_journalier}
              onChange={(e) => setForm({ ...form, tarif_journalier: e.target.value })}
              error={errors.tarif_journalier}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                value={form.statut}
                onChange={(e) => setForm({ ...form, statut: e.target.value as StatutVehicule })}
              >
                <option value="disponible">Disponible</option>
                <option value="en_location">En location</option>
                <option value="en_retard">En retard</option>
                <option value="en_entretien">En entretien</option>
                <option value="hors_service">Hors service</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="secondary" onClick={() => router.back()}>
              Annuler
            </Button>
            <Button type="submit" loading={loading}>
              Enregistrer
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
