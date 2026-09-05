import { NextRequest, NextResponse } from 'next/server';
import { createUser, authenticateUser, getAllUsers, getActivityLog, getActivityLogToday, logActivity, updateAdminCredentials, resetAdminCredentials, deleteUser, getUserByUsername } from '@/lib/server/database';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, username, password, role, createdBy, adminId, userId } = body;

    const authorization = request.headers.get('authorization') || '';
    const tokenUsername = authorization.startsWith('Basic ')
      ? Buffer.from(authorization.slice(6), 'base64').toString('utf-8').split(':')[0]
      : '';

    if (action === 'check') {
      const users = await getAllUsers();
      return NextResponse.json({ success: true, hasAdmin: users.some(u => u.role === 'admin') });
    }

    if (action === 'reset_admin') {
      const result = await resetAdminCredentials(username, password);
      return NextResponse.json(result, { status: result.success ? 200 : 400 });
    }

    if (action === 'activity_today') {
      const logs = await getActivityLogToday();
      return NextResponse.json({ success: true, logs });
    }

    if (action === 'activity_all') {
      const logs = await getActivityLog();
      return NextResponse.json({ success: true, logs });
    }

    if (action === 'update_admin') {
      const result = await updateAdminCredentials(adminId, username, password);
      return NextResponse.json(result, { status: result.success ? 200 : 400 });
    }

    if (action === 'get_users') {
      const users = await getAllUsers();
      return NextResponse.json({ success: true, users });
    }

    if (action === 'delete_user') {
      const admin = tokenUsername ? await getUserByUsername(tokenUsername) : null;
      if (!admin || admin.role !== 'admin' || admin.id !== adminId) {
        return NextResponse.json({ success: false, error: 'Action reservee a l\'administrateur' }, { status: 403 });
      }
      if (!userId) {
        return NextResponse.json({ success: false, error: 'Utilisateur manquant' }, { status: 400 });
      }
      if (userId === admin.id) {
        return NextResponse.json({ success: false, error: 'Le compte administrateur connecte ne peut pas etre supprime' }, { status: 400 });
      }
      const result = await deleteUser(userId);
      if (result.success) {
        await logActivity(admin.id, admin.username, 'Suppression utilisateur', userId);
      }
      return NextResponse.json(result, { status: result.success ? 200 : 400 });
    }

    if (!username || !password) {
      return NextResponse.json({ success: false, error: 'Nom d\'utilisateur et mot de passe requis' }, { status: 400 });
    }

    if (action === 'register') {
      const userRole = role || 'user';
      const result = await createUser(username, password, userRole, createdBy);
      return NextResponse.json(result, { status: result.success ? 201 : 400 });
    }

    if (action === 'login') {
      const result = await authenticateUser(username, password);
      return NextResponse.json(result, { status: result.success ? 200 : 401 });
    }

    return NextResponse.json({ success: false, error: 'Action invalide' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}