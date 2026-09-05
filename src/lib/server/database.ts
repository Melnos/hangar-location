import { neon } from '@neondatabase/serverless';
import { hashPassword } from '@/lib/utils/auth';

const connectionString = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_53JwYSDxaqeI@ep-dawn-bar-aecdxfuj-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

let sql: ReturnType<typeof neon> | null = null;

function getDb(): ReturnType<typeof neon> {
  if (sql) return sql;
  sql = neon(connectionString);
  return sql;
}

async function initDb(): Promise<ReturnType<typeof neon>> {
  const db = getDb();
  await db`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      lastLogin TEXT
    )
  `;
  await db`
    CREATE TABLE IF NOT EXISTS global_data (
      id TEXT PRIMARY KEY DEFAULT 'global',
      data JSONB NOT NULL DEFAULT '{}',
      updated_at TEXT NOT NULL DEFAULT NOW()
    )
  `;
  return db;
}

export interface User {
  id: string;
  username: string;
  password: string;
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

export interface DatabaseUser {
  id: string;
  username: string;
  password: string;
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
      nom: 'Admin',
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

export async function createUser(username: string, password: string): Promise<{ success: boolean; error?: string; user?: User }> {
  try {
    const db = await initDb();
    const existingUsers = await db`SELECT COUNT(*) as count FROM users`;
    if (existingUsers[0]?.count > 0) {
      return { success: false, error: 'Un administrateur existe deja. Inscription reservee.' };
    }
    const hashedPassword = hashPassword(password);
    const id = generateId();
    const now = new Date().toISOString();
    try {
      await db`INSERT INTO users (id, username, password, createdAt, lastLogin) VALUES (${id}, ${username}, ${hashedPassword}, ${now}, NULL)`;
    } catch (err: any) {
      if (err.message?.includes('duplicate') || err.message?.includes('UNIQUE')) {
        return { success: false, error: 'Nom d\'utilisateur deja pris' };
      }
      throw err;
    }
    await db`INSERT INTO global_data (id, data, updated_at) VALUES ('global', ${JSON.stringify(DEFAULT_GLOBAL_DATA)}, ${now}) ON CONFLICT (id) DO NOTHING`;
    return { success: true, user: { id, username, password: '', createdAt: now, lastLogin: null } };
  } catch (error) {
    return { success: false, error: 'Erreur serveur' };
  }
}

export async function authenticateUser(username: string, password: string): Promise<{ success: boolean; error?: string; user?: DatabaseUser }> {
  try {
    const db = await initDb();
    const hashedPassword = hashPassword(password);
    const result = await db`SELECT id, username, password, createdAt, lastLogin FROM users WHERE username = ${username}` as User[];
    const row = result[0];
    if (!row) return { success: false, error: 'Identifiants incorrects' };
    if (row.password !== hashedPassword) return { success: false, error: 'Identifiants incorrects' };
    await db`UPDATE users SET lastLogin = ${new Date().toISOString()} WHERE id = ${row.id}`;
    const data = await getGlobalData();
    return { success: true, user: { id: row.id, username: row.username, password: row.password, createdAt: row.createdAt, lastLogin: row.lastLogin, data } };
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

export async function updateGlobalData(data: Partial<GlobalData>): Promise<{ success: boolean; error?: string }> {
  try {
    const db = await initDb();
    const now = new Date().toISOString();
    const current = await getGlobalData();
    const mergedData: GlobalData = {
      vehicules: data.vehicules ?? current.vehicules,
      locataires: data.locataires ?? current.locataires,
      contrats: data.contrats ?? current.contrats,
      documents_vehicule: data.documents_vehicule ?? current.documents_vehicule,
      maintenances: data.maintenances ?? current.maintenances,
      notifications: data.notifications ?? current.notifications,
      parametres: data.parametres ?? current.parametres,
    };
    await db`INSERT INTO global_data (id, data, updated_at) VALUES ('global', ${JSON.stringify(mergedData)}, ${now}) ON CONFLICT (id) DO UPDATE SET data = ${JSON.stringify(mergedData)}, updated_at = ${now}`;
    return { success: true };
  } catch { return { success: false, error: 'Erreur serveur' }; }
}

export async function getUserData(userId: string): Promise<DatabaseUser | null> {
  try {
    const db = await initDb();
    const result = await db`SELECT id, username, password, createdAt, lastLogin FROM users WHERE id = ${userId}` as User[];
    const row = result[0];
    if (!row) return null;
    const data = await getGlobalData();
    return { id: row.id, username: row.username, password: row.password, createdAt: row.createdAt, lastLogin: row.lastLogin, data };
  } catch { return null; }
}

export async function getUserByUsername(username: string): Promise<DatabaseUser | null> {
  try {
    const db = await initDb();
    const result = await db`SELECT id, username, password, createdAt, lastLogin FROM users WHERE username = ${username}` as User[];
    const row = result[0];
    if (!row) return null;
    const data = await getGlobalData();
    return { id: row.id, username: row.username, password: row.password, createdAt: row.createdAt, lastLogin: row.lastLogin, data };
  } catch { return null; }
}

export async function updateUserData(userId: string, data: Partial<GlobalData>): Promise<{ success: boolean; error?: string }> {
  return updateGlobalData(data);
}

export async function getAllUsers(): Promise<{ id: string; username: string; createdAt: string; lastLogin: string | null }[]> {
  try {
    const db = await initDb();
    const rows = await db`SELECT id, username, createdAt, lastLogin FROM users` as { id: string; username: string; createdAt: string; lastLogin: string | null }[];
    return rows.map((row) => ({ id: row.id, username: row.username, createdAt: row.createdAt, lastLogin: row.lastLogin }));
  } catch { return []; }
}

export async function deleteUser(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const db = await initDb();
    await db`DELETE FROM users WHERE id = ${userId}`;
    return { success: true };
  } catch { return { success: false, error: 'Erreur serveur' }; }
}

export { hashPassword };
