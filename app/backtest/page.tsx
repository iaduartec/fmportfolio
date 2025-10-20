import { db } from '@/lib/db';
import { symbols } from '@/drizzle/schema';
import { BacktestClient } from './BacktestClient';

export default async function BacktestPage() {
  const allSymbols = await db.select().from(symbols);
  return <BacktestClient symbols={allSymbols.map((symbol) => ({ ticker: symbol.ticker }))} />;
}
