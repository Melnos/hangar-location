import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

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

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readDB(): Database {
  ensureDataDir();
  if (!fs.existsSync(DB_FILE)) {
    const defaultDB: Database = { users: [] };
    fs.writeFileSync(DB_FILE, JSON.stringify(defaultDB, null, 2));
    return defaultDB;
  }
  const content = fs.readFileSync(DB_FILE, 'utf-8');
  return JSON.parse(content);
}

function writeDB(db: Database): void {
  ensureDataDir();
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export function generateId(): string {
  return crypto.randomUUID();
}

export function createUser(username: string, password: string): { success: boolean; error?: string; user?: User } {
  const db = readDB();

  if (db.users.find((u) => u.username === username)) {
    return { success: false, error: 'Nom d\'utilisateur déjà pris' };
  }

  const newUser: DatabaseUser = {
    id: generateId(),
    username,
    password: hashPassword(password),
    createdAt: new Date().toISOString(),
    lastLogin: null,
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
          nom: '',
          prenom: '',
          email: '',
          telephone: '',
          adresse: '',
          nomEntreprise: 'Hangar Location',
        },
      },
    },
  };

  db.users.push(newUser);
  writeDB(db);

  return {
    success: true,
    user: {
      id: newUser.id,
      username: newUser.username,
      password: '',
      createdAt: newUser.createdAt,
      lastLogin: newUser.lastLogin,
    },
  };
}

export function authenticateUser(username: string, password: string): { success: boolean; error?: string; user?: DatabaseUser } {
  const db = readDB();
  const hashedPassword = hashPassword(password);

  const user = db.users.find((u) => u.username === username);

  if (!user) {
    return { success: false, error: 'Identifiants incorrects' };
  }

  if (user.password !== hashedPassword) {
    return { success: false, error: 'Identifiants incorrects' };
  }

  user.lastLogin = new Date().toISOString();
  writeDB(db);

  return { success: true, user };
}

export function getUserData(userId: string): DatabaseUser | null {
  const db = readDB();
  return db.users.find((u) => u.id === userId) || null;
}

export function updateUserData(userId: string, data: Partial<DatabaseUser['data']>): { success: boolean; error?: string } {
  const db = readDB();
  const userIndex = db.users.findIndex((u) => u.id === userId);

  if (userIndex === -1) {
    return { success: false, error: 'Utilisateur non trouvé' };
  }

  db.users[userIndex].data = { ...db.users[userIndex].data, ...data };
  writeDB(db);

  return { success: true };
}

export function getAllUsers(): { id: string; username: string; createdAt: string; lastLogin: string | null }[] {
  const db = readDB();
  return db.users.map((u) => ({
    id: u.id,
    username: u.username,
    createdAt: u.createdAt,
    lastLogin: u.lastLogin,
  }));
}

export function deleteUser(userId: string): { success: boolean; error?: string } {
  const db = readDB();
  const userIndex = db.users.findIndex((u) => u.id === userId);

  if (userIndex === -1) {
    return { success: false, error: 'Utilisateur non trouvé' };
  }

  db.users.splice(userIndex, 1);
  writeDB(db);

  return { success: true };
}
