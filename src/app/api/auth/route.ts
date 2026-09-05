import { NextRequest, NextResponse } from 'next/server';
import { createUser, authenticateUser, getAllUsers, getActivityLog, getActivityLogToday, logActivity, updateAdminCredentials, resetAdminCredentials } from '@/lib/server/database';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, username, password, role, createdBy, adminId } = body;

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