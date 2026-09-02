import { NextRequest, NextResponse } from 'next/server';
import { getUserData, updateUserData } from '@/lib/server/database';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 });
    }

    const userData = await getUserData(userId);

    if (!userData) {
      return NextResponse.json({ success: false, error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: userData.data,
      lastLogin: userData.lastLogin,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 });
    }

    const { data } = await request.json();

    if (!data) {
      return NextResponse.json({ success: false, error: 'Données manquantes' }, { status: 400 });
    }

    const result = await updateUserData(userId, data);

    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}
