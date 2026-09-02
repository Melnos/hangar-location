import Database from 'better-sqlite3';
import crypto from 'crypto';

const DB_PATH = process.env.NETLIFY
  ? '/tmp/hangar-location.db'
  : process.env.NODE_ENV === 'production'
    ? '/tmp/hangar-location.db'
    : './data/hangar-location.db';

let db: Database.Database | null = null;

function getDb(): Database.Database {
  if (db) return db;
  
  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      lastLogin TEXT
    );
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

interface Database {
  users: DatabaseUser[];
}

export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export function generateId(): string {
  return crypto.randomUUID();
}

export function createUser(username: string, password: string): { success: boolean; error?: string; user?: User } {
  try {
    const database = getDb();
    const hashedPassword = hashPassword(password);
    const id = generateId();
    const now = new Date().toISOString();

    const insert = database.prepare('INSERT INTO users (id, username, password, createdAt, lastLogin) VALUES (?, ?, ?, ?, ?)');
    
    try {
      insert.run(id, username, hashedPassword, now, null);
    } catch (err: any) {
      if (err.code === 'SQLITE_CONSTRAINT') {
        return { success: false, error: 'Nom d\'utilisateur déjà pris' };
      }
      throw err;
    }

    const userTable = getUserDataTable(database);
    
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

function getUserDataTable(database: Database.Database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS user_data (
      userId TEXT PRIMARY KEY,
      data TEXT
    );
  `);
}

export function updateUserData(userId: string, data: Partial<DatabaseUser['data']>): { success: boolean; error?: string } {
  try {
    const database = getDb();
    getUserDataTable(database);

    const existing = database.prepare('SELECT data FROM user_data WHERE userId = ?').get(userId) as { data: string } | undefined;
    
    let mergedData = existing ? JSON.parse(existing.data) : {};
    mergedData = { ...mergedData, ...data };
    
    const insert = database.prepare(`
      INSERT INTO user_data (userId, data) VALUES (?, ?)
      ON CONFLICT(userId) DO UPDATE SET data = excluded.data
    `);
    insert.run(userId, JSON.stringify(mergedData));

    return { success: true };
  } catch {
    return { success: false, error: 'Erreur serveur' };
  }
}

export function authenticateUser(username: string, password: string): { success: boolean; error?: string; user?: DatabaseUser } {
  try {
    const database = getDb();
    const hashedPassword = hashPassword(password);

    const stmt = database.prepare('SELECT id, username, password, createdAt, lastLogin FROM users WHERE username = ?');
    const row = stmt.get(username) as User | undefined;

    if (!row) {
      return { success: false, error: 'Identifiants incorrects' };
    }

    if (row.password !== hashedPassword) {
      return { success: false, error: 'Identifiants incorrects' };
    }

    database.prepare('UPDATE users SET lastLogin = ? WHERE id = ?').run(new Date().toISOString(), row.id);

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

export function getUserData(userId: string): DatabaseUser | null {
  try {
    const database = getDb();
    const row = database.prepare('SELECT id, username, password, createdAt, lastLogin FROM users WHERE id = ?').get(userId) as User | undefined;

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

export function getAllUsers(): { id: string; username: string; createdAt: string; lastLogin: string | null }[] {
  try {
    const database = getDb();
    const rows = database.prepare('SELECT id, username, createdAt, lastLogin FROM users').all() as any[];
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

export function deleteUser(userId: string): { success: boolean; error?: string } {
  try {
    const database = getDb();
    const stmt = database.prepare('DELETE FROM users WHERE id = ?');
    const info = stmt.run(userId);
    return { success: info.changes > 0 };
  } catch {
    return { success: false, error: 'Erreur serveur' };
  }
}
