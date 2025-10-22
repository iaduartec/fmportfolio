import { getDb } from '../lib/db';
import { symbols } from '../drizzle/schema';

async function seed() {
  const db = await getDb();
  await db
    .insert(symbols)
    .values([
      { ticker: 'AAPL', name: 'Apple Inc.', assetClass: 'Equity', currency: 'USD' },
      { ticker: 'MSFT', name: 'Microsoft Corp.', assetClass: 'Equity', currency: 'USD' },
      { ticker: 'SPY', name: 'SPDR S&P 500 ETF', assetClass: 'ETF', currency: 'USD' }
    ])
    .onConflictDoNothing();
  console.log('Seed completado');
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
