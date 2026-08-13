import { getCloudflareContext } from '@opennextjs/cloudflare';

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
  username?: string;
}

export interface D1Database {
  prepare(query: string): {
    bind(...values: any[]): {
      all<T = unknown>(): Promise<{ results: T[] }>;
      first<T = unknown>(colName?: string): Promise<T | null>;
      run(): Promise<{ success: boolean; meta: { last_row_id?: number; changes?: number } }>;
    };
    all<T = unknown>(): Promise<{ results: T[] }>;
    first<T = unknown>(colName?: string): Promise<T | null>;
    run(): Promise<{ success: boolean; meta: { last_row_id?: number; changes?: number } }>;
  };
  exec(query: string): Promise<any>;
}

let d1Initialized = false;
let d1InitPromise: Promise<void> | null = null;

async function ensureD1Initialized(d1: D1Database): Promise<void> {
  if (d1Initialized) return;
  if (!d1InitPromise) {
    d1InitPromise = (async () => {
      try {
        await d1.exec(`
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

        const adminUser = await d1
          .prepare('SELECT id FROM users WHERE role = ?')
          .bind('admin')
          .first<{ id: number }>();

        if (!adminUser) {
          const bcrypt = require('bcryptjs');
          let adminPassword = 'admin123';
          try {
            const { env } = await getCloudflareContext({ async: true });
            const cfEnv = env as any;
            if (cfEnv?.ADMIN_PASSWORD) {
              adminPassword = cfEnv.ADMIN_PASSWORD as string;
            }
          } catch (e) {}

          if (adminPassword === 'admin123' && process.env.ADMIN_PASSWORD) {
            adminPassword = process.env.ADMIN_PASSWORD;
          }

          const hash = bcrypt.hashSync(adminPassword || 'admin123', 10);
          await d1
            .prepare('INSERT OR IGNORE INTO users (username, password_hash, role) VALUES (?, ?, ?)')
            .bind('admin', hash, 'admin')
            .run();
        }
        d1Initialized = true;
      } catch (err) {
        console.error('[D1 Initialization Error]', err);
      } finally {
        d1InitPromise = null;
      }
    })();
  }
  await d1InitPromise;
}

async function getD1DB(): Promise<D1Database | null> {
  let d1: D1Database | null = null;
  try {
    const { env } = await getCloudflareContext({ async: true });
    const cfEnv = env as any;
    if (cfEnv?.DB) d1 = cfEnv.DB as unknown as D1Database;
  } catch (e) {
    // Ignore when not in CF context
  }

  if (!d1) {
    try {
      const gEnv = (globalThis as any).env;
      if (gEnv?.DB) d1 = gEnv.DB;

      const pEnv = (process as any).env;
      if (!d1 && pEnv?.DB) d1 = pEnv.DB;
    } catch (e) {
      // Ignored
    }
  }

  if (d1) {
    await ensureD1Initialized(d1);
  }

  return d1;
}

let localDb: any = null;
function getLocalDb() {
  if (!localDb) {
    const Database = require('better-sqlite3');
    const path = require('path');
    const fs = require('fs');

    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    const dbPath = path.join(dataDir, 'photo_namer.db');
    localDb = new Database(dbPath);
    localDb.pragma('journal_mode = WAL');
    localDb.pragma('foreign_keys = ON');

    localDb.exec(`
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

    const adminUser = localDb.prepare('SELECT * FROM users WHERE role = ?').get('admin');
    if (!adminUser) {
      const bcrypt = require('bcryptjs');
      const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
      const hash = bcrypt.hashSync(adminPassword, 10);
      localDb.prepare('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)').run(
        'admin',
        hash,
        'admin'
      );
    }
  }
  return localDb;
}

export async function findUserByUsername(username: string): Promise<UserRecord | undefined> {
  const d1 = await getD1DB();
  if (d1) {
    const res = await d1.prepare('SELECT * FROM users WHERE username = ?').bind(username).first<UserRecord>();
    return res || undefined;
  }
  const db = getLocalDb();
  return db.prepare('SELECT * FROM users WHERE username = ?').get(username) as UserRecord | undefined;
}

export async function findUserById(id: number): Promise<UserRecord | undefined> {
  const d1 = await getD1DB();
  if (d1) {
    const res = await d1.prepare('SELECT id, username, role, created_at FROM users WHERE id = ?').bind(id).first<UserRecord>();
    return res || undefined;
  }
  const db = getLocalDb();
  return db.prepare('SELECT id, username, role, created_at FROM users WHERE id = ?').get(id) as UserRecord | undefined;
}

export async function createUser(username: string, passwordHash: string, role: 'user' | 'admin' = 'user'): Promise<UserRecord> {
  const d1 = await getD1DB();
  if (d1) {
    const res = await d1.prepare('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)').bind(username, passwordHash, role).run();
    const lastId = res.meta?.last_row_id ? Number(res.meta.last_row_id) : 0;
    let user = lastId ? await findUserById(lastId) : undefined;
    if (!user) {
      user = await findUserByUsername(username);
    }
    return user!;
  }
  const db = getLocalDb();
  const result = db.prepare('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)').run(username, passwordHash, role);
  return (await findUserById(Number(result.lastInsertRowid)))!;
}

export async function getPhotosByUserId(userId: number): Promise<PhotoRecord[]> {
  const d1 = await getD1DB();
  if (d1) {
    const res = await d1.prepare(`
      SELECT p.id, p.user_id, p.name, p.data_uri, p.uploaded_at, u.username
      FROM photos p
      JOIN users u ON p.user_id = u.id
      WHERE p.user_id = ?
      ORDER BY p.uploaded_at DESC
    `).bind(userId).all<PhotoRecord>();
    return res.results || [];
  }
  const db = getLocalDb();
  return db.prepare(`
    SELECT p.id, p.user_id, p.name, p.data_uri, p.uploaded_at, u.username
    FROM photos p
    JOIN users u ON p.user_id = u.id
    WHERE p.user_id = ?
    ORDER BY p.uploaded_at DESC
  `).all(userId) as PhotoRecord[];
}

export async function getAllPhotosWithOwners(): Promise<PhotoRecord[]> {
  const d1 = await getD1DB();
  if (d1) {
    const res = await d1.prepare(`
      SELECT p.id, p.user_id, p.name, p.data_uri, p.uploaded_at, u.username
      FROM photos p
      JOIN users u ON p.user_id = u.id
      ORDER BY p.uploaded_at DESC
    `).all<PhotoRecord>();
    return res.results || [];
  }
  const db = getLocalDb();
  return db.prepare(`
    SELECT p.id, p.user_id, p.name, p.data_uri, p.uploaded_at, u.username
    FROM photos p
    JOIN users u ON p.user_id = u.id
    ORDER BY p.uploaded_at DESC
  `).all() as PhotoRecord[];
}

export async function addPhotoToDb(userId: number, name: string, dataUri: string): Promise<PhotoRecord> {
  const d1 = await getD1DB();
  if (d1) {
    const existingRes = await d1.prepare('SELECT name FROM photos WHERE user_id = ?').bind(userId).all<{ name: string }>();
    const existingNames = new Set((existingRes.results || []).map((p) => p.name.toLowerCase()));

    let finalName = name.trim();
    if (existingNames.has(finalName.toLowerCase())) {
      let counter = 2;
      while (existingNames.has(`${finalName.toLowerCase()} ${counter}`)) {
        counter++;
      }
      finalName = `${finalName} ${counter}`;
    }

    const ins = await d1.prepare('INSERT INTO photos (user_id, name, data_uri) VALUES (?, ?, ?)').bind(userId, finalName, dataUri).run();
    const photoId = ins.meta?.last_row_id ? Number(ins.meta.last_row_id) : 0;
    let photo = photoId ? await d1.prepare(`
      SELECT p.id, p.user_id, p.name, p.data_uri, p.uploaded_at, u.username
      FROM photos p
      JOIN users u ON p.user_id = u.id
      WHERE p.id = ?
    `).bind(photoId).first<PhotoRecord>() : null;

    if (!photo) {
      photo = await d1.prepare(`
        SELECT p.id, p.user_id, p.name, p.data_uri, p.uploaded_at, u.username
        FROM photos p
        JOIN users u ON p.user_id = u.id
        WHERE p.user_id = ? AND p.name = ?
        ORDER BY p.id DESC
      `).bind(userId, finalName).first<PhotoRecord>();
    }
    return photo!;
  }

  const db = getLocalDb();
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

  return (await findUserById(userId)) ? (db.prepare(`
    SELECT p.id, p.user_id, p.name, p.data_uri, p.uploaded_at, u.username
    FROM photos p
    JOIN users u ON p.user_id = u.id
    WHERE p.id = ?
  `).get(Number(result.lastInsertRowid)) as PhotoRecord) : null!;
}

export async function deletePhotoById(photoId: number, userId?: number, isAdmin?: boolean): Promise<boolean> {
  const d1 = await getD1DB();
  if (d1) {
    if (isAdmin) {
      const res = await d1.prepare('DELETE FROM photos WHERE id = ?').bind(photoId).run();
      return (res.meta?.changes ?? 0) > 0;
    }
    const res = await d1.prepare('DELETE FROM photos WHERE id = ? AND user_id = ?').bind(photoId, userId).run();
    return (res.meta?.changes ?? 0) > 0;
  }

  const db = getLocalDb();
  if (isAdmin) {
    const result = db.prepare('DELETE FROM photos WHERE id = ?').run(photoId);
    return result.changes > 0;
  }
  const result = db.prepare('DELETE FROM photos WHERE id = ? AND user_id = ?').run(photoId, userId);
  return result.changes > 0;
}


