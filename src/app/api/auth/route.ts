import { NextRequest, NextResponse } from 'next/server';
import { createUser, authenticateUser, getAllUsers, getActivityLog, getActivityLogToday, logActivity, updateAdminCredentials } from '@/lib/server/database';
import { hashPassword } from '@/lib/utils/auth';

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
      const users = await getAllUsers();
      const admin = users.find(u => u.role === 'admin');
      if (admin) {
        const db = await import('@/lib/server/database');
        const hashedPassword = hashPassword(password);
        const { neon } = await import('@@neondatabase/serverless');
        const connectionString = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_53JwYSDxaqeI@ep-dawn-bar-aecdxfuj-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
        const sql = neon(connectionString);
        await sql`UPDATE users SET username = ${username}, password = ${hashedPassword} WHERE id = ${admin.id}`;
        return NextResponse.json({ success: true });
      }
      return NextResponse.json({ success: false, error: 'Aucun admin trouve' });
    }

    if (action === 'activity_today') {
      const logs = await getActivityLogToday();
      return NextResponse.json({ success: true, logs });
    }

    if (action === 'activity_all') {
      const logs = await getActivityLog();
      return NextResponse.json({ success: true, logs });
    }

    if (action === 'log_activity') {
      const { userId, username: logUsername, action: logAction, details } = body;
      await logActivity(userId, logUsername, logAction, details);
      return NextResponse.json({ success: true });
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
      if (result.success && createdBy) {
        await logActivity(createdBy, 'admin', 'register_user', `Nouvel utilisateur: ${username}`);
      }
      return NextResponse.json(result, { status: result.success ? 201 : 400 });
    }

    if (action === 'login') {
      const result = await authenticateUser(username, password);
      if (result.success) {
        await logActivity(result.user!.id, result.user!.username, 'login', 'Connexion');
      }
      return NextResponse.json(result, { status: result.success ? 200 : 401 });
    }

    return NextResponse.json({ success: false, error: 'Action invalide' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}