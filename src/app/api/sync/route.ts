import { NextRequest, NextResponse } from 'next/server';
import { getUserData, getUserByUsername, updateGlobalData, getGlobalData } from '@/lib/server/database';

export const runtime = 'nodejs';

function decodeTokenUserId(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization') || '';
  if (authHeader.startsWith('Basic ')) {
    const decoded = Buffer.from(authHeader.slice(6), 'base64').toString('utf-8');
    const username = decoded.split(':')[0];
    return username;
  }
  return null;
}

export async function GET(request: NextRequest) {
  try {
    const tokenUserId = decodeTokenUserId(request);
    const userId = request.headers.get('x-user-id');
    const identifier = tokenUserId || userId;

    if (!identifier) {
      return NextResponse.json({ success: false, error: 'Non authentifie' }, { status: 401 });
    }

    // Verify admin exists
    let userData = await getUserData(identifier);
    if (!userData) {
      userData = await getUserByUsername(identifier);
    }

    if (!userData) {
      return NextResponse.json({ success: false, error: 'Utilisateur non trouve' }, { status: 404 });
    }

    // Return global data
    const data = await getGlobalData();

    return NextResponse.json({
      success: true,
      data,
      lastLogin: userData.lastLogin,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const tokenUserId = decodeTokenUserId(request);
    const userId = request.headers.get('x-user-id');
    const identifier = tokenUserId || userId;

    if (!identifier) {
      return NextResponse.json({ success: false, error: 'Non authentifie' }, { status: 401 });
    }

    const { data } = await request.json();

    if (!data) {
      return NextResponse.json({ success: false, error: 'Donnees manquantes' }, { status: 400 });
    }

    // Verify admin exists
    let userData = await getUserData(identifier);
    if (!userData) {
      userData = await getUserByUsername(identifier);
    }

    if (!userData) {
      return NextResponse.json({ success: false, error: 'Utilisateur non trouve' }, { status: 404 });
    }

    // Update global data (overwrites previous data)
    const result = await updateGlobalData(data);

    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}
