import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import path from 'path';
import fs from 'fs';
import { config } from './config';
import * as schema from '../drizzle/schema';

const databaseFile = path.resolve(process.cwd(), config.dbPath);

if (!fs.existsSync(path.dirname(databaseFile))) {
  fs.mkdirSync(path.dirname(databaseFile), { recursive: true });
}

export const sqlite = new Database(databaseFile);
export const db = drizzle(sqlite, { schema });

// Ejecutamos migraciones bajo demanda para soportar entornos efímeros (e.g. Vercel) donde el archivo SQLite
// aún no tiene tablas creadas al momento de la importación.
let migrationPromise: Promise<void> | null = null;

export async function runMigrations() {
  await migrate(db, { migrationsFolder: path.resolve(process.cwd(), 'drizzle/migrations') });
}

async function ensureMigrations() {
  if (!migrationPromise) {
    migrationPromise = (async () => {
      try {
        await runMigrations();
      } catch (error) {
        migrationPromise = null;
        throw error;
      }
    })();
  }

  return migrationPromise;
}

export async function getDb() {
  await ensureMigrations();
  return db;
}
