import { NextResponse } from 'next/server';
import { getGlobalData } from '@/lib/server/database';

export const runtime = 'nodejs';

// Public API - returns only public vehicle information
// No authentication required
export async function GET() {
  try {
    const globalData = await getGlobalData();

    // Return only public vehicle data (no locataire info, no contrat details)
    const publicVehicules = (globalData.vehicules || []).map((v: any) => ({
      id: v.id,
      nom: v.nom,
      plaque: v.plaque,
      couleur: v.couleur,
      statut: v.statut,
      tarif_journalier: v.tarif_journalier,
      km_depart: v.km_depart,
      photos: v.photos,
      updated_at: v.updated_at,
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
