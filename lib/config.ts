export const config = {
  fmpApiKey: process.env.FMP_API_KEY ?? '',
  dbPath: process.env.DATABASE_URL ?? 'fmportfolio.db',
  rateLimitPerMinute: 60
};

export function ensureEnv() {
  if (!config.fmpApiKey) {
    console.warn('[Advertencia] No se encontró FMP_API_KEY. Usa el adaptador mock o configura la clave.');
  }
}
