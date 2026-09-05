import { NextResponse } from 'next/server';
import { getGlobalData } from '@/lib/server/database';

export const runtime = 'nodejs';

// Public API - returns only public vehicle information
// No authentication required
export async function GET() {
  try {
    const globalData = await getGlobalData();

    // Return only public vehicle data (no locataire info, no contrat details)
    const deleted = globalData.deleted?.vehicules || [];
    const publicVehicules = (globalData.vehicules || [])
      .filter((v: any) => v?.id && !deleted.includes(v.id))
      .map((v: any) => ({
      id: v.id,
      nom: v.nom || 'Vehicule sans nom',
      plaque: v.plaque || 'Non renseignee',
      couleur: v.couleur || 'Non renseignee',
      statut: v.statut || 'hors_service',
      tarif_journalier: Number(v.tarif_journalier) || 0,
      photos: Array.isArray(v.photos) ? v.photos : [],
      updated_at: v.updated_at || null,
    }));

    return NextResponse.json({
      success: true,
      vehicules: publicVehicules,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}
