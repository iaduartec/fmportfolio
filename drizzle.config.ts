import { config } from './lib/config';
import type { Config } from 'drizzle-kit';

const drizzleConfig = {
  schema: './drizzle/schema.ts',
  out: './drizzle/migrations',
  driver: 'better-sqlite',
  dbCredentials: {
    url: config.dbPath
  }
} satisfies Config & {
  driver: 'better-sqlite';
  dbCredentials: { url: string };
};

export default drizzleConfig;
