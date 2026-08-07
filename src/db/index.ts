import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';

const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'photo_namer.db');
const db = new Database(dbPath);

// Enable WAL mode for better concurrency and foreign keys
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export interface UserRecord {
  id: number;
  username: string;
  password_hash: string;
  role: 'user' | 'admin';
  created_at: string;
}

export interface PhotoRecord {
  id: number;
  user_id: number;
  name: string;
  data_uri: string;
  uploaded_at: string;
  username?: string; // Joined field when fetching with owner info
}

function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT CHECK(role IN ('user', 'admin')) NOT NULL DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS photos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      data_uri TEXT NOT NULL,
      uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Seed default admin account if none exists
  const adminUser = db.prepare('SELECT * FROM users WHERE role = ?').get('admin') as UserRecord | undefined;

  if (!adminUser) {
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const hash = bcrypt.hashSync(adminPassword, 10);
    db.prepare('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)').run(
      'admin',
      hash,
      'admin'
    );
    console.log('[DB] Seeded default admin account (username: "admin")');
  }
}

// Run DB initialization once on load
initDb();

export { db };

// Database Helper Functions

export function findUserByUsername(username: string): UserRecord | undefined {
  return db.prepare('SELECT * FROM users WHERE username = ?').get(username) as UserRecord | undefined;
}

export function findUserById(id: number): UserRecord | undefined {
  return db.prepare('SELECT id, username, role, created_at FROM users WHERE id = ?').get(id) as UserRecord | undefined;
}

export function createUser(username: string, passwordHash: string, role: 'user' | 'admin' = 'user'): UserRecord {
  const result = db.prepare('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)').run(
    username,
    passwordHash,
    role
  );
  return findUserById(Number(result.lastInsertRowid))!;
}

export function getPhotosByUserId(userId: number): PhotoRecord[] {
  return db.prepare(`
    SELECT p.id, p.user_id, p.name, p.data_uri, p.uploaded_at, u.username
    FROM photos p
    JOIN users u ON p.user_id = u.id
    WHERE p.user_id = ?
    ORDER BY p.uploaded_at DESC
  `).all(userId) as PhotoRecord[];
}

export function getAllPhotosWithOwners(): PhotoRecord[] {
  return db.prepare(`
    SELECT p.id, p.user_id, p.name, p.data_uri, p.uploaded_at, u.username
    FROM photos p
    JOIN users u ON p.user_id = u.id
    ORDER BY p.uploaded_at DESC
  `).all() as PhotoRecord[];
}

export function addPhotoToDb(userId: number, name: string, dataUri: string): PhotoRecord {
  // Auto increment name if duplicate for this user
  const existingNames = new Set(
    (db.prepare('SELECT name FROM photos WHERE user_id = ?').all(userId) as { name: string }[]).map(
      (p) => p.name.toLowerCase()
    )
  );

  let finalName = name.trim();
  if (existingNames.has(finalName.toLowerCase())) {
    let counter = 2;
    while (existingNames.has(`${finalName.toLowerCase()} ${counter}`)) {
      counter++;
    }
    finalName = `${finalName} ${counter}`;
  }

  const result = db
    .prepare('INSERT INTO photos (user_id, name, data_uri) VALUES (?, ?, ?)')
    .run(userId, finalName, dataUri);

  return db.prepare(`
    SELECT p.id, p.user_id, p.name, p.data_uri, p.uploaded_at, u.username
    FROM photos p
    JOIN users u ON p.user_id = u.id
    WHERE p.id = ?
  `).get(Number(result.lastInsertRowid)) as PhotoRecord;
}

export function deletePhotoById(photoId: number, userId?: number, isAdmin?: boolean): boolean {
  if (isAdmin) {
    const result = db.prepare('DELETE FROM photos WHERE id = ?').run(photoId);
    return result.changes > 0;
  }
  const result = db.prepare('DELETE FROM photos WHERE id = ? AND user_id = ?').run(photoId, userId);
  return result.changes > 0;
}
