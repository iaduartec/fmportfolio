import { NextResponse } from 'next/server';
import { z } from 'zod';
import { eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { prices, symbols } from '@/drizzle/schema';
import { parseTradingViewCsv, TradingViewCsvError } from '@/lib/adapters/tradingview-csv';

const formSchema = z.object({
  symbol: z.string().min(1),
  timeframe: z.string().min(1),
  file: z.instanceof(File)
});

export async function POST(request: Request) {
  const formData = await request.formData();
  const parsed = formSchema.safeParse({
    symbol: formData.get('symbol'),
    timeframe: formData.get('timeframe'),
    file: formData.get('file')
  });

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const symbolTicker = parsed.data.symbol.trim().toUpperCase();
  const timeframe = parsed.data.timeframe.trim();
  const file = parsed.data.file;

  try {
    const text = await file.text();
    const candles = parseTradingViewCsv(text);

    if (candles.length === 0) {
      return NextResponse.json({ imported: 0 });
    }

    let symbolRow = await db.query.symbols.findFirst({ where: eq(symbols.ticker, symbolTicker) });

    if (!symbolRow) {
      const inserted = await db
        .insert(symbols)
        .values({
          ticker: symbolTicker,
          name: symbolTicker,
          assetClass: 'equity',
          currency: 'USD'
        })
        .onConflictDoNothing()
        .returning();
      symbolRow = inserted[0] ?? (await db.query.symbols.findFirst({ where: eq(symbols.ticker, symbolTicker) }));
    }

    const values = candles.map((candle) => ({
      symbolId: symbolRow!.id!,
      timeframe,
      ts: candle.ts,
      open: candle.open,
      high: candle.high,
      low: candle.low,
      close: candle.close,
      volume: candle.volume
    }));

    const result = await db
      .insert(prices)
      .values(values)
      .onConflictDoUpdate({
        target: [prices.symbolId, prices.timeframe, prices.ts],
        set: {
          open: sql`excluded.open`,
          high: sql`excluded.high`,
          low: sql`excluded.low`,
          close: sql`excluded.close`,
          volume: sql`excluded.volume`
        }
      });

    return NextResponse.json({
      imported: values.length,
      updated: result.rowsAffected ?? values.length,
      symbol: symbolTicker,
      timeframe
    });
  } catch (error) {
    if (error instanceof TradingViewCsvError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Error importando CSV de TradingView' }, { status: 500 });
  }
}
