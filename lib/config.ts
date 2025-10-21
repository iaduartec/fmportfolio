const defaultDbPath =
  process.env.DATABASE_URL ??
  (process.env.VERCEL || process.env.AWS_REGION ? '/tmp/fmportfolio.db' : 'fmportfolio.db');

export const config = {
  fmpApiKey: process.env.FMP_API_KEY ?? '',
  dbPath: defaultDbPath,
  rateLimitPerMinute: 60
};

export function ensureEnv() {
  if (!config.fmpApiKey) {
    console.warn('[Advertencia] No se encontró FMP_API_KEY. Usa el adaptador mock o configura la clave.');
  }
}
