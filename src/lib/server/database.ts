import { neon } from '@neondatabase/serverless';
import crypto from 'crypto';

const connectionString = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_53JwYSDxaqeI@ep-dawn-bar-aecdxfuj-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

let sql: ReturnType<typeof neon> | null = null;

function getDb(): ReturnType<typeof neon> {
  if (sql) return sql;
  sql = neon(connectionString);
  return sql;
}

export interface User {
  id: string;
  username: string;
  password: string;
  createdAt: string;
  lastLogin: string | null;
}

export interface DatabaseUser {
  id: string;
  username: string;
  password: string;
  createdAt: string;
  lastLogin: string | null;
  data: {
    vehicules: any[];
    locataires: any[];
    contrats: any[];
    documents_vehicule: any[];
    maintenances: any[];
    notifications: any[];
    parametres: any;
  };
}

interface Database {
  users: DatabaseUser[];
}

export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export function generateId(): string {
  return crypto.randomUUID();
}

export async function initDb(): Promise<void> {
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
    CREATE TABLE IF NOT EXISTS user_data (
      userId TEXT PRIMARY KEY,
      data JSONB
    )
  `;
}

export async function createUser(username: string, password: string): Promise<{ success: boolean; error?: string; user?: User }> {
  try {
    const db = getDb();
    await initDb();
    const hashedPassword = hashPassword(password);
    const id = generateId();
    const now = new Date().toISOString();

    try {
      await db`
        INSERT INTO users (id, username, password, createdAt, lastLogin)
        VALUES (${id}, ${username}, ${hashedPassword}, ${now}, NULL)
      `;
    } catch (err: any) {
      if (err.message?.includes('duplicate') || err.message?.includes('UNIQUE')) {
        return { success: false, error: 'Nom d\'utilisateur déjà pris' };
      }
      throw err;
    }

    return {
      success: true,
      user: {
        id,
        username,
        password: '',
        createdAt: now,
        lastLogin: null,
      },
    };
  } catch (error) {
    return { success: false, error: 'Erreur serveur' };
  }
}

export async function authenticateUser(username: string, password: string): Promise<{ success: boolean; error?: string; user?: DatabaseUser }> {
  try {
    const db = getDb();
    await initDb();
    const hashedPassword = hashPassword(password);

    const rows = await db`
      SELECT id, username, password, createdAt, lastLogin FROM users WHERE username = ${username}
    ` as User[];
    const row = rows[0];

    if (!row) {
      return { success: false, error: 'Identifiants incorrects' };
    }

    if (row.password !== hashedPassword) {
      return { success: false, error: 'Identifiants incorrects' };
    }

    await db`
      UPDATE users SET lastLogin = ${new Date().toISOString()} WHERE id = ${row.id}
    `;

    return {
      success: true,
      user: {
        id: row.id,
        username: row.username,
        password: row.password,
        createdAt: row.createdAt,
        lastLogin: row.lastLogin,
        data: {
          vehicules: [],
          locataires: [],
          contrats: [],
          documents_vehicule: [],
          maintenances: [],
          notifications: [],
          parametres: {
            adminId: `ADMIN-${Date.now()}`,
            syncEnabled: false,
            syncServerUrl: '',
            syncInterval: 30,
            notificationsEnabled: false,
            adminData: {
              nom: 'Admin',
              prenom: 'Principal',
              email: '',
              telephone: '',
              adresse: '',
              nomEntreprise: 'Hangar Location',
            },
          },
        },
      },
    };
  } catch (error) {
    return { success: false, error: 'Erreur serveur' };
  }
}

export async function getUserData(userId: string): Promise<DatabaseUser | null> {
  try {
    const db = getDb();
    await initDb();
    const rows = await db`
      SELECT id, username, password, createdAt, lastLogin FROM users WHERE id = ${userId}
    ` as User[];
    const row = rows[0];

    if (!row) return null;

    return {
      id: row.id,
      username: row.username,
      password: row.password,
      createdAt: row.createdAt,
      lastLogin: row.lastLogin,
      data: {
        vehicules: [],
        locataires: [],
        contrats: [],
        documents_vehicule: [],
        maintenances: [],
        notifications: [],
        parametres: {},
      },
    };
  } catch {
    return null;
  }
}

export async function updateUserData(userId: string, data: Partial<DatabaseUser['data']>): Promise<{ success: boolean; error?: string }> {
  try {
    const db = getDb();
    await initDb();
    const existing = await db`
      SELECT data FROM user_data WHERE userId = ${userId}
    ` as { data: any }[];

    let mergedData: any = {};
    if (existing.length > 0) {
      mergedData = { ...existing[0].data, ...data };
    } else {
      mergedData = data;
    }

    await db`
      INSERT INTO user_data (userId, data) VALUES (${userId}, ${mergedData}::jsonb)
      ON CONFLICT (userId) DO UPDATE SET data = EXCLUDED.data
    `;

    return { success: true };
  } catch {
    return { success: false, error: 'Erreur serveur' };
  }
}

export async function getAllUsers(): Promise<{ id: string; username: string; createdAt: string; lastLogin: string | null }[]> {
  try {
    const db = getDb();
    await initDb();
    const rows = await db`
      SELECT id, username, createdAt, lastLogin FROM users
    ` as { id: string; username: string; createdAt: string; lastLogin: string | null }[];
    return rows.map((row) => ({
      id: row.id,
      username: row.username,
      createdAt: row.createdAt,
      lastLogin: row.lastLogin,
    }));
  } catch {
    return [];
  }
}

export async function deleteUser(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const db = getDb();
    await initDb();
    await db`DELETE FROM users WHERE id = ${userId}`;
    return { success: true };
  } catch {
    return { success: false, error: 'Erreur serveur' };
  }
}
