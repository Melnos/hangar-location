import { createClient, type Client } from '@libsql/client';
import crypto from 'crypto';

const DB_URL = process.env.DATABASE_URL || `file:${process.cwd()}/data/hangar-location.db`;

let client: Client | null = null;

function getDb(): Client {
  if (client) return client;

  client = createClient({ url: DB_URL });

  return client;
}

async function initDb(): Promise<Client> {
  const db = getDb();
  await db.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      lastLogin TEXT
    )
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS user_data (
      userId TEXT PRIMARY KEY,
      data TEXT
    )
  `);
  return db;
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

export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export function generateId(): string {
  return crypto.randomUUID();
}

export async function createUser(username: string, password: string): Promise<{ success: boolean; error?: string; user?: User }> {
  try {
    const db = await initDb();
    const hashedPassword = hashPassword(password);
    const id = generateId();
    const now = new Date().toISOString();

    try {
      await db.execute('INSERT INTO users (id, username, password, createdAt, lastLogin) VALUES (?, ?, ?, ?, ?)', [id, username, hashedPassword, now, null]);
    } catch (err: any) {
      if (err.message?.includes('UNIQUE')) {
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
    const db = await initDb();
    const hashedPassword = hashPassword(password);

    const result = await db.execute('SELECT id, username, password, createdAt, lastLogin FROM users WHERE username = ?', [username]);
    const row = result.rows.length > 0 ? (result.rows[0] as any) : undefined;

    if (!row) {
      return { success: false, error: 'Identifiants incorrects' };
    }

    if (row.password !== hashedPassword) {
      return { success: false, error: 'Identifiants incorrects' };
    }

    await db.execute('UPDATE users SET lastLogin = ? WHERE id = ?', [new Date().toISOString(), row.id]);

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
    const db = await initDb();
    const result = await db.execute('SELECT id, username, password, createdAt, lastLogin FROM users WHERE id = ?', [userId]);
    const row = result.rows.length > 0 ? (result.rows[0] as any) : undefined;

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
    const db = await initDb();

    const existing = await db.execute('SELECT data FROM user_data WHERE userId = ?', [userId]);
    let mergedData: any = {};
    if (existing.rows.length > 0) {
      mergedData = JSON.parse((existing.rows[0] as any).data);
      mergedData = { ...mergedData, ...data };
    } else {
      mergedData = data;
    }

    await db.execute(`
      INSERT INTO user_data (userId, data) VALUES (?, ?)
      ON CONFLICT(userId) DO UPDATE SET data = excluded.data
    `, [userId, JSON.stringify(mergedData)]);

    return { success: true };
  } catch {
    return { success: false, error: 'Erreur serveur' };
  }
}

export async function getAllUsers(): Promise<{ id: string; username: string; createdAt: string; lastLogin: string | null }[]> {
  try {
    const db = await initDb();
    const result = await db.execute('SELECT id, username, createdAt, lastLogin FROM users');
    return result.rows.map((row: any) => ({
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
    const db = await initDb();
    await db.execute('DELETE FROM users WHERE id = ?', [userId]);
    return { success: true };
  } catch {
    return { success: false, error: 'Erreur serveur' };
  }
}
