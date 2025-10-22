import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, describe, expect, test, vi } from 'vitest';

const originalDbUrl = process.env.DATABASE_URL;
const tempDirs: string[] = [];

function createTempDbPath() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fm-db-'));
  tempDirs.push(tmpDir);
  return path.join(tmpDir, 'test.sqlite');
}

afterEach(() => {
  process.env.DATABASE_URL = originalDbUrl;
  vi.resetModules();
  vi.clearAllMocks();
  vi.doUnmock('drizzle-orm/better-sqlite3/migrator');
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop();
    if (dir) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  }
});

describe('getDb', () => {
  test('crea las tablas requeridas al iniciar una base nueva', async () => {
    process.env.DATABASE_URL = createTempDbPath();

    const { getDb, sqlite } = await import('@/lib/db');
    const { symbols } = await import('@/drizzle/schema');

    const db = await getDb();
    await expect(db.select().from(symbols)).resolves.toEqual([]);

    const exists = sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='symbols'").get();
    expect(exists).toBeTruthy();
    sqlite.close();
  });

  test('usa el bootstrap embebido si faltan las migraciones', async () => {
    process.env.DATABASE_URL = createTempDbPath();

    vi.doMock('drizzle-orm/better-sqlite3/migrator', () => ({
      migrate: vi.fn().mockRejectedValue(Object.assign(new Error('missing folder'), { code: 'ENOENT' }))
    }));

    const { getDb, sqlite } = await import('@/lib/db');

    await expect(getDb()).resolves.toBeDefined();
    const exists = sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='symbols'").get();
    expect(exists).toBeTruthy();
    sqlite.close();
  });
});
