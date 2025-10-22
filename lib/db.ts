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

const REQUIRED_TABLES = ['symbols', 'prices', 'alerts', 'trades', 'positions', 'cash_ledger', 'backtests'] as const;

const bootstrapSchemaSql = `
CREATE TABLE IF NOT EXISTS symbols (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ticker TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  asset_class TEXT NOT NULL,
  currency TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS prices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  symbol_id INTEGER NOT NULL REFERENCES symbols(id),
  timeframe TEXT NOT NULL,
  ts INTEGER NOT NULL,
  open REAL NOT NULL,
  high REAL NOT NULL,
  low REAL NOT NULL,
  close REAL NOT NULL,
  volume REAL NOT NULL,
  UNIQUE(symbol_id, timeframe, ts)
);

CREATE TABLE IF NOT EXISTS alerts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  symbol_id INTEGER NOT NULL REFERENCES symbols(id),
  type TEXT NOT NULL,
  params TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
  last_triggered_at INTEGER
);

CREATE TABLE IF NOT EXISTS trades (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  symbol_id INTEGER NOT NULL REFERENCES symbols(id),
  side TEXT NOT NULL,
  qty REAL NOT NULL,
  price REAL NOT NULL,
  ts INTEGER NOT NULL,
  fees REAL NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS positions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  symbol_id INTEGER NOT NULL REFERENCES symbols(id),
  qty REAL NOT NULL,
  avg_price REAL NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS cash_ledger (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts INTEGER NOT NULL,
  amount REAL NOT NULL,
  note TEXT
);

CREATE TABLE IF NOT EXISTS backtests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  symbol_id INTEGER NOT NULL REFERENCES symbols(id),
  timeframe TEXT NOT NULL,
  params TEXT NOT NULL,
  started_at INTEGER NOT NULL,
  finished_at INTEGER NOT NULL,
  summary TEXT NOT NULL
);
`;

function hasTable(name: string) {
  try {
    const row = sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = ?").get(name);
    return Boolean(row);
  } catch (error) {
    console.warn(`[Inferencia] Error verificando tabla ${name}:`, error);
    return false;
  }
}

function ensureSchemaPresence() {
  const missingTable = REQUIRED_TABLES.find((table) => !hasTable(table));
  if (missingTable) {
    console.warn(`[Inferencia] Tabla ${missingTable} ausente tras migraciones. Ejecutando bootstrap inline.`);
    sqlite.exec(bootstrapSchemaSql);
  }
}

// Ejecutamos migraciones bajo demanda para soportar entornos efímeros (e.g. Vercel) donde el archivo SQLite
// aún no tiene tablas creadas al momento de la importación.
let migrationPromise: Promise<void> | null = null;

export async function runMigrations() {
  await migrate(db, { migrationsFolder: path.resolve(process.cwd(), 'drizzle/migrations') });
}

export async function ensureMigrations() {
  if (!migrationPromise) {
    migrationPromise = (async () => {
      try {
        await runMigrations();
      } catch (error) {
        const maybeErrno = error as NodeJS.ErrnoException;
        if (maybeErrno?.code === 'ENOENT') {
          console.warn('[Inferencia] Carpeta de migraciones no encontrada. Aplicando esquema base embebido.');
          sqlite.exec(bootstrapSchemaSql);
        } else {
          throw error;
        }
      }

      ensureSchemaPresence();
    })().catch((error) => {
      migrationPromise = null;
      throw error;
    });
  }

  return migrationPromise;
}

export async function getDb() {
  await ensureMigrations();
  return db;
}
