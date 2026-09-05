import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { createUser, authenticateUser, getAllUsers, getActivityLog, getActivityLogToday, logActivity, updateAdminCredentials, hashPassword } from '@/lib/server/database';

export const runtime = 'nodejs';

const connectionString = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_53JwYSDxaqeI@ep-dawn-bar-aecdxfuj-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, username, password, role, createdBy, adminId } = body;

    if (action === 'check') {
      const users = await getAllUsers();
      return NextResponse.json({ success: true, hasAdmin: users.some(u => u.role === 'admin') });
    }

    if (action === 'reset_admin') {
      try {
        const sql = neon(connectionString);
        const users = await sql`SELECT id, role FROM users WHERE role = 'admin'` as { id: string; role: string }[];
        const admin = users[0];
        const hashedPassword = hashPassword(password);
        if (admin) {
          await sql`UPDATE users SET username = ${username}, password = ${hashedPassword} WHERE id = ${admin.id}`;
        } else {
          const id = crypto.randomUUID();
          await sql`INSERT INTO users (id, username, password, role, created_by, createdAt, lastLogin) VALUES (${id}, ${username}, ${hashedPassword}, 'admin', null, ${new Date().toISOString()}, null)`;
        }
        return NextResponse.json({ success: true });
      } catch (err) {
        return NextResponse.json({ success: false, error: 'Erreur base de donnees' });
      }
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