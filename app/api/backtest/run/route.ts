import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCachedOHLCV } from '@/lib/adapters/fmp';
import { runEmaRsiBacktest } from '@/lib/backtest/emaRsi';
import { db } from '@/lib/db';
import { backtests, symbols } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';

const schema = z.object({
  symbol: z.string(),
  timeframe: z.enum(['1m', '5m', '15m', '1h', '4h', '1D']),
  strategy: z.literal('ema_rsi'),
  params: z.object({
    fast: z.number().default(9),
    slow: z.number().default(21),
    rsiPeriod: z.number().default(14),
    rsiOverbought: z.number().default(70),
    rsiOversold: z.number().default(30),
    commission: z.number().default(0.001),
    slippage: z.number().default(0.0005)
  })
});

export async function POST(request: Request) {
  const json = await request.json();
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const symbolRow = await db.query.symbols.findFirst({ where: eq(symbols.ticker, parsed.data.symbol) });
  if (!symbolRow) {
    return NextResponse.json({ error: 'Símbolo no encontrado' }, { status: 404 });
  }
  const now = Math.floor(Date.now() / 1000);
  const past = now - 60 * 60 * 24 * 365;
  const candles = await getCachedOHLCV(parsed.data.symbol, parsed.data.timeframe, past, now);
  const summary = runEmaRsiBacktest(candles, parsed.data.params);
  const inserted = await db
    .insert(backtests)
    .values({
      symbolId: symbolRow.id!,
      timeframe: parsed.data.timeframe,
      params: parsed.data.params,
      startedAt: now,
      finishedAt: now,
      summary
    })
    .returning();
  return NextResponse.json({ backtestId: inserted[0].id, summary });
}
