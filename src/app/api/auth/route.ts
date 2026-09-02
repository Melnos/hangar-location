import { NextRequest, NextResponse } from 'next/server';
import { createUser, authenticateUser } from '@/lib/server/database';

export async function POST(request: NextRequest) {
  try {
    const { action, username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ success: false, error: 'Nom d\'utilisateur et mot de passe requis' }, { status: 400 });
    }

    if (action === 'register') {
      const result = createUser(username, password);
      return NextResponse.json(result, { status: result.success ? 201 : 400 });
    }

    if (action === 'login') {
      const result = authenticateUser(username, password);
      return NextResponse.json(result, { status: result.success ? 200 : 401 });
    }

    return NextResponse.json({ success: false, error: 'Action invalide' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}
