import { NextRequest, NextResponse } from 'next/server';
import { getGlobalData, updateGlobalData, createUser, getAllUsers } from '@/lib/server/database';

export const runtime = 'nodejs';

function decodeTokenUsername(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization') || '';
  if (authHeader.startsWith('Basic ')) {
    try {
      const decoded = Buffer.from(authHeader.slice(6), 'base64').toString('utf-8');
      return decoded.split(':')[0];
    } catch {
      return null;
    }
  }
  const userId = request.headers.get('x-user-id');
  return userId;
}

export async function GET(request: NextRequest) {
  try {
    const username = decodeTokenUsername(request);
    if (!username) {
      return NextResponse.json({ success: false, error: 'Non authentifie' }, { status: 401 });
    }

    const data = await getGlobalData();
    return NextResponse.json({ success: true, data, lastLogin: null });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const username = decodeTokenUsername(request);
    if (!username) {
      return NextResponse.json({ success: false, error: 'Non authentifie' }, { status: 401 });
    }

    const { data } = await request.json();
    if (!data) {
      return NextResponse.json({ success: false, error: 'Donnees manquantes' }, { status: 400 });
    }

    // Si l'utilisateur n'existe pas encore, le créer comme employé
    const users = await getAllUsers();
    const exists = users.some((u) => u.username === username);
    if (!exists) {
      await createUser(username, 'changeme123', 'user');
    }

    // Merge par table (préserve les enregistrements des autres utilisateurs)
    const merged = await updateGlobalData(data);
    return NextResponse.json(merged, { status: merged.success ? 200 : 400 });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}