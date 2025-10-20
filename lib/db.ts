import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import path from 'path';
import fs from 'fs';
import { config } from './config';

const databaseFile = path.resolve(process.cwd(), config.dbPath);

if (!fs.existsSync(path.dirname(databaseFile))) {
  fs.mkdirSync(path.dirname(databaseFile), { recursive: true });
}

export const sqlite = new Database(databaseFile);
export const db = drizzle(sqlite);

export async function runMigrations() {
  migrate(db, { migrationsFolder: path.resolve(process.cwd(), 'drizzle/migrations') });
}
