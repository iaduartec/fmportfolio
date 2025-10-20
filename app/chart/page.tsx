import { db } from '@/lib/db';
import { prices, symbols } from '@/drizzle/schema';
import { eq, desc } from 'drizzle-orm';
import type { Candle } from './ChartClient';
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
  const chartCandles: Candle[] = initialCandles
    .reverse()
    .map((candle) => ({
      ts: Math.floor((candle.ts as Date).getTime() / 1000),
      open: candle.open,
      high: candle.high,
      low: candle.low,
      close: candle.close,
      volume: candle.volume
    }));

  return (
    <ChartClient initialSymbol={defaultSymbol} initialTimeframe="1D" initialCandles={chartCandles} />
  );
}
