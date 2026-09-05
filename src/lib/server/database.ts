import { neon } from '@neondatabase/serverless';
import { hashPassword } from '@/lib/utils/auth';

const connectionString = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_53JwYSDxaqeI@ep-dawn-bar-aecdxfuj-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

let sql: ReturnType<typeof neon> | null = null;

function getDb(): ReturnType<typeof neon> {
  if (sql) return sql;
  sql = neon(connectionString);
  return sql;
}

const DEFAULT_ADMIN_USERNAME = 'admin';
const DEFAULT_ADMIN_PASSWORD = 'admin123';

async function initDb(): Promise<ReturnType<typeof neon>> {
  const db = getDb();
  await db`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      created_by TEXT,
      createdAt TEXT NOT NULL,
      lastLogin TEXT
    )
  `;
  await db`
    CREATE TABLE IF NOT EXISTS global_data (
      id TEXT PRIMARY KEY DEFAULT 'global',
      data JSONB NOT NULL DEFAULT '{}',
      updated_at TEXT NOT NULL DEFAULT NOW(),
      updated_by TEXT
    )
  `;
  await db`
    CREATE TABLE IF NOT EXISTS activity_log (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      username TEXT NOT NULL,
      action TEXT NOT NULL,
      details TEXT,
      timestamp TEXT NOT NULL
    )
  `;

  // ==== MIGRATION ====
  // Les tables ont pu être créées par une ancienne version SANS ces colonnes.
  // On les ajoute si elles n'existent pas (IF NOT EXISTS est supporté par PostgreSQL).
  try {
    await db`ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user'`;
  } catch {}
  try {
    await db`ALTER TABLE users ADD COLUMN IF NOT EXISTS created_by TEXT`;
  } catch {}
  try {
    await db`ALTER TABLE global_data ADD COLUMN IF NOT EXISTS updated_by TEXT`;
  } catch {}

  // Créer l'admin par défaut s'il n'existe pas encore
  const adminExists = await db`SELECT id FROM users WHERE role = 'admin'` as { id: string }[];
  if (adminExists.length === 0) {
    const adminId = generateId();
    const hashedPassword = hashPassword(DEFAULT_ADMIN_PASSWORD);
    const now = new Date().toISOString();
    await db`INSERT INTO users (id, username, password, role, created_by, createdAt, lastLogin) VALUES (${adminId}, ${DEFAULT_ADMIN_USERNAME}, ${hashedPassword}, 'admin', null, ${now}, null)`;
    await db`INSERT INTO global_data (id, data, updated_at) VALUES ('global', ${JSON.stringify(DEFAULT_GLOBAL_DATA)}, ${now}) ON CONFLICT (id) DO NOTHING`;
  }

  return db;
}

export interface User {
  id: string;
  username: string;
  password: string;
  role: 'admin' | 'user';
  created_by: string | null;
  createdAt: string;
  lastLogin: string | null;
}

export interface GlobalData {
  vehicules: any[];
  locataires: any[];
  contrats: any[];
  documents_vehicule: any[];
  maintenances: any[];
  notifications: any[];
  parametres: any;
}

export interface ActivityLog {
  id: string;
  user_id: string;
  username: string;
  action: string;
  details: string | null;
  timestamp: string;
}

export interface DatabaseUser {
  id: string;
  username: string;
  password: string;
  role: 'admin' | 'user';
  created_by: string | null;
  createdAt: string;
  lastLogin: string | null;
  data: GlobalData;
}

const DEFAULT_GLOBAL_DATA: GlobalData = {
  vehicules: [],
  locataires: [],
  contrats: [],
  documents_vehicule: [],
  maintenances: [],
  notifications: [],
  parametres: {
    adminId: 'ADMIN-001',
    adminData: {
      nom: 'Directeur',
      prenom: 'Principal',
      email: '',
      telephone: '',
      adresse: '',
      nomEntreprise: 'Hangar Location',
    },
  },
};

export function generateId(): string {
  const crypto = require('crypto');
  return crypto.randomUUID();
}

export async function logActivity(userId: string, username: string, action: string, details?: string): Promise<void> {
  try {
    const db = await initDb();
    const id = generateId();
    const now = new Date().toISOString();
    await db`INSERT INTO activity_log (id, user_id, username, action, details, timestamp) VALUES (${id}, ${userId}, ${username}, ${action}, ${details || null}, ${now})`;
  } catch (error) {
    console.error('Error logging activity:', error);
  }
}

export async function getActivityLog(limit: number = 100): Promise<ActivityLog[]> {
  try {
    const db = await initDb();
    const rows = await db`SELECT * FROM activity_log ORDER BY timestamp DESC LIMIT ${limit}` as ActivityLog[];
    return rows;
  } catch {
    return [];
  }
}

export async function getActivityLogToday(): Promise<ActivityLog[]> {
  try {
    const db = await initDb();
    const today = new Date().toISOString().split('T')[0];
    const rows = await db`SELECT * FROM activity_log WHERE timestamp LIKE ${today + '%'} ORDER BY timestamp DESC` as ActivityLog[];
    return rows;
  } catch {
    return [];
  }
}

export async function createUser(username: string, password: string, role: 'admin' | 'user' = 'user', createdBy?: string): Promise<{ success: boolean; error?: string; user?: User }> {
  try {
    const db = await initDb();
    const hashedPassword = hashPassword(password);
    const id = generateId();
    const now = new Date().toISOString();
    try {
      await db`INSERT INTO users (id, username, password, role, created_by, createdAt, lastLogin) VALUES (${id}, ${username}, ${hashedPassword}, ${role}, ${createdBy || null}, ${now}, NULL)`;
    } catch (err: any) {
      if (err.message?.includes('duplicate') || err.message?.includes('UNIQUE')) {
        return { success: false, error: 'Nom d\'utilisateur deja pris' };
      }
      throw err;
    }
    await db`INSERT INTO global_data (id, data, updated_at) VALUES ('global', ${JSON.stringify(DEFAULT_GLOBAL_DATA)}, ${now}) ON CONFLICT (id) DO NOTHING`;
    return { success: true, user: { id, username, password: '', role, created_by: createdBy || null, createdAt: now, lastLogin: null } };
  } catch (error) {
    return { success: false, error: 'Erreur serveur' };
  }
}

export async function authenticateUser(username: string, password: string): Promise<{ success: boolean; error?: string; user?: DatabaseUser }> {
  try {
    const db = await initDb();
    const hashedPassword = hashPassword(password);
    const result = await db`SELECT id, username, password, role, created_by, createdAt, lastLogin FROM users WHERE username = ${username}` as User[];
    const row = result[0];
    if (!row) return { success: false, error: 'Identifiants incorrects' };
    if (row.password !== hashedPassword) return { success: false, error: 'Identifiants incorrects' };
    await db`UPDATE users SET lastLogin = ${new Date().toISOString()} WHERE id = ${row.id}`;
    const data = await getGlobalData();
    return { success: true, user: { id: row.id, username: row.username, password: row.password, role: row.role, created_by: row.created_by, createdAt: row.createdAt, lastLogin: row.lastLogin, data } };
  } catch (error) {
    return { success: false, error: 'Erreur serveur' };
  }
}

export async function getGlobalData(): Promise<GlobalData> {
  try {
    const db = await initDb();
    const result = await db`SELECT data FROM global_data WHERE id = 'global'` as { data: any }[];
    if (result.length > 0) return result[0].data as GlobalData;
    const now = new Date().toISOString();
    await db`INSERT INTO global_data (id, data, updated_at) VALUES ('global', ${JSON.stringify(DEFAULT_GLOBAL_DATA)}, ${now})`;
    return DEFAULT_GLOBAL_DATA;
  } catch { return DEFAULT_GLOBAL_DATA; }
}

export async function updateGlobalData(data: Partial<GlobalData>, updatedBy?: string): Promise<{ success: boolean; error?: string }> {
  try {
    const db = await initDb();
    const now = new Date().toISOString();
    const current = await getGlobalData();

    // Merge par id: les enregistrements locaux remplacent ceux du serveur,
    // mais on conserve les enregistrements serveur absents de la liste locale
    // afin de ne pas perdre les données des autres utilisateurs.
    const mergeById = (local: any[], server: any[]): any[] => {
      const map = new Map<string, any>();
      (server || []).forEach((r) => { if (r && r.id) map.set(r.id, r); });
      (local || []).forEach((r) => { if (r && r.id) map.set(r.id, r); });
      return Array.from(map.values());
    };

    const mergedData: GlobalData = {
      vehicules: data.vehicules ? mergeById(data.vehicules, current.vehicules) : current.vehicules,
      locataires: data.locataires ? mergeById(data.locataires, current.locataires) : current.locataires,
      contrats: data.contrats ? mergeById(data.contrats, current.contrats) : current.contrats,
      documents_vehicule: data.documents_vehicule ? mergeById(data.documents_vehicule, current.documents_vehicule) : current.documents_vehicule,
      maintenances: data.maintenances ? mergeById(data.maintenances, current.maintenances) : current.maintenances,
      notifications: data.notifications ? mergeById(data.notifications, current.notifications) : current.notifications,
      parametres: data.parametres ?? current.parametres,
    };
    await db`INSERT INTO global_data (id, data, updated_at, updated_by) VALUES ('global', ${JSON.stringify(mergedData)}, ${now}, ${updatedBy || null}) ON CONFLICT (id) DO UPDATE SET data = ${JSON.stringify(mergedData)}, updated_at = ${now}, updated_by = ${updatedBy || null}`;
    return { success: true };
  } catch { return { success: false, error: 'Erreur serveur' }; }
}

export async function getUserData(userId: string): Promise<DatabaseUser | null> {
  try {
    const db = await initDb();
    const result = await db`SELECT id, username, password, role, created_by, createdAt, lastLogin FROM users WHERE id = ${userId}` as User[];
    const row = result[0];
    if (!row) return null;
    const data = await getGlobalData();
    return { id: row.id, username: row.username, password: row.password, role: row.role, created_by: row.created_by, createdAt: row.createdAt, lastLogin: row.lastLogin, data };
  } catch { return null; }
}

export async function getUserByUsername(username: string): Promise<DatabaseUser | null> {
  try {
    const db = await initDb();
    const result = await db`SELECT id, username, password, role, created_by, createdAt, lastLogin FROM users WHERE username = ${username}` as User[];
    const row = result[0];
    if (!row) return null;
    const data = await getGlobalData();
    return { id: row.id, username: row.username, password: row.password, role: row.role, created_by: row.created_by, createdAt: row.createdAt, lastLogin: row.lastLogin, data };
  } catch { return null; }
}

export async function updateUserData(userId: string, data: Partial<GlobalData>): Promise<{ success: boolean; error?: string }> {
  return updateGlobalData(data);
}

export async function getAllUsers(): Promise<{ id: string; username: string; role: string; created_by: string | null; createdAt: string; lastLogin: string | null }[]> {
  try {
    const db = await initDb();
    const rows = await db`SELECT id, username, role, created_by, createdAt, lastLogin FROM users` as { id: string; username: string; role: string; created_by: string | null; createdAt: string; lastLogin: string | null }[];
    return rows.map((row) => ({ id: row.id, username: row.username, role: row.role, created_by: row.created_by, createdAt: row.createdAt, lastLogin: row.lastLogin }));
  } catch { return []; }
}

export async function deleteUser(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const db = await initDb();
    await db`DELETE FROM users WHERE id = ${userId}`;
    return { success: true };
  } catch { return { success: false, error: 'Erreur serveur' }; }
}

export async function resetAdminCredentials(username: string, password: string): Promise<{ success: boolean; error?: string }> {
  try {
    const db = await initDb();
    const hashedPassword = hashPassword(password);
    const adminExists = await db`SELECT id FROM users WHERE role = 'admin'` as { id: string }[];
    const now = new Date().toISOString();
    if (adminExists.length > 0) {
      await db`UPDATE users SET username = ${username}, password = ${hashedPassword} WHERE id = ${adminExists[0].id}`;
    } else {
      const id = generateId();
      await db`INSERT INTO users (id, username, password, role, created_by, createdAt, lastLogin) VALUES (${id}, ${username}, ${hashedPassword}, 'admin', null, ${now}, null)`;
      await db`INSERT INTO global_data (id, data, updated_at) VALUES ('global', ${JSON.stringify(DEFAULT_GLOBAL_DATA)}, ${now}) ON CONFLICT (id) DO NOTHING`;
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Erreur base de donnees' };
  }
}

export async function updateAdminCredentials(adminId: string, newUsername: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
  try {
    const db = await initDb();
    const hashedPassword = hashPassword(newPassword);
    await db`UPDATE users SET username = ${newUsername}, password = ${hashedPassword} WHERE id = ${adminId} AND role = 'admin'`;
    return { success: true };
  } catch { return { success: false, error: 'Erreur serveur' }; }
}

export { hashPassword };