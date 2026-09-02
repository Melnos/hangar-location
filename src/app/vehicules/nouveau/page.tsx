'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header, Input, Button } from '@/components';
import { vehiculeRepository } from '@/repositories';

export default function NouveauVehiculePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    nom: '',
    plaque: '',
    numero_chassis: '',
    couleur: '',
    km_depart: '',
    tarif_journalier: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

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
      const vehicule = await vehiculeRepository.create({
        nom: form.nom,
        plaque: form.plaque,
        numero_chassis: form.numero_chassis,
        couleur: form.couleur,
        km_depart: parseInt(form.km_depart),
        tarif_journalier: parseFloat(form.tarif_journalier),
      });
      router.push(`/vehicules/${vehicule.id}`);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Header title="Nouveau véhicule" />
      <div className="p-6 max-w-2xl">
        <form onSubmit={handleSubmit} className="bg-[#f5f5dc] rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="space-y-4">
            <Input
              label="Nom du véhicule"
              value={form.nom}
              onChange={(e) => setForm({ ...form, nom: e.target.value })}
              error={errors.nom}
              placeholder="Ex: Toyota Corolla"
            />
            <Input
              label="Plaque d'immatriculation"
              value={form.plaque}
              onChange={(e) => setForm({ ...form, plaque: e.target.value })}
              error={errors.plaque}
              placeholder="Ex: AB-123-CD"
            />
            <Input
              label="Numéro de châssis"
              value={form.numero_chassis}
              onChange={(e) => setForm({ ...form, numero_chassis: e.target.value })}
              error={errors.numero_chassis}
              placeholder="Ex: VF7SA9HZH5J123456"
            />
            <Input
              label="Couleur"
              value={form.couleur}
              onChange={(e) => setForm({ ...form, couleur: e.target.value })}
              error={errors.couleur}
              placeholder="Ex: Blanc"
            />
            <Input
              label="Kilométrage actuel"
              type="number"
              value={form.km_depart}
              onChange={(e) => setForm({ ...form, km_depart: e.target.value })}
              error={errors.km_depart}
              placeholder="Ex: 50000"
            />
            <Input
              label="Tarif journalier"
              type="number"
              value={form.tarif_journalier}
              onChange={(e) => setForm({ ...form, tarif_journalier: e.target.value })}
              error={errors.tarif_journalier}
              placeholder="Ex: 25000"
            />
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="secondary" onClick={() => router.back()}>
              Annuler
            </Button>
            <Button type="submit" loading={loading}>
              Créer le véhicule
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
