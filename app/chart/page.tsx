import { db } from '@/lib/db';
import { prices, symbols } from '@/drizzle/schema';
import { eq, desc } from 'drizzle-orm';
import { ChartClient } from './ChartClient';

export default async function ChartPage() {
  const defaultSymbol = 'AAPL';
  const symbolRow = await db.query.symbols.findFirst({ where: eq(symbols.ticker, defaultSymbol) });
  const initialCandles = symbolRow
    ? await db
        .select()
        .from(prices)
        .where(eq(prices.symbolId, symbolRow.id!))
        .orderBy(desc(prices.ts))
        .limit(500)
    : [];
  return (
    <ChartClient
      initialSymbol={defaultSymbol}
      initialTimeframe="1D"
      initialCandles={initialCandles.reverse().map((c) => ({
        ts: c.ts,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
        volume: c.volume
      }))}
    />
  );
}
