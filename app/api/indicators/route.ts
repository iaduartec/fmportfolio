import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCachedOHLCV } from '@/lib/adapters/fmp';
import { ema, rsi, macd, vwapAnchored, supertrend } from '@/lib/indicators';
import { rateLimit } from '@/lib/rate-limit';

const schema = z.object({
  symbol: z.string().min(1),
  timeframe: z.enum(['1m', '5m', '15m', '1h', '4h', '1D']),
  range: z.object({ from: z.string(), to: z.string() }),
  indicators: z.array(z.object({ name: z.string(), params: z.record(z.any()).optional() }))
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const limiter = rateLimit('indicators', 60, 60_000);
  if (!limiter.success) {
    return NextResponse.json({ error: 'Rate limit excedido' }, { status: 429 });
  }
  const fromTs = Math.floor(new Date(parsed.data.range.from).getTime() / 1000);
  const toTs = Math.floor(new Date(parsed.data.range.to).getTime() / 1000);
  const candles = await getCachedOHLCV(parsed.data.symbol, parsed.data.timeframe, fromTs, toTs);
  const results: Record<string, unknown> = {};

  const closes = candles.map((c) => c.close);
  parsed.data.indicators.forEach((indicator) => {
    switch (indicator.name) {
      case 'ema': {
        const period = Number(indicator.params?.period ?? 20);
        results.ema = ema(closes, period);
        break;
      }
      case 'rsi': {
        const period = Number(indicator.params?.period ?? 14);
        results.rsi = rsi(closes, period);
        break;
      }
      case 'macd': {
        const fast = Number(indicator.params?.fast ?? 12);
        const slow = Number(indicator.params?.slow ?? 26);
        const signal = Number(indicator.params?.signal ?? 9);
        results.macd = macd(closes, fast, slow, signal);
        break;
      }
      case 'vwapAnchored': {
        const anchorIndex = Number(indicator.params?.anchorIndex ?? 0);
        results.vwapAnchored = vwapAnchored(
          candles.map((c) => ({ high: c.high, low: c.low, close: c.close, volume: c.volume })),
          anchorIndex
        );
        break;
      }
      case 'supertrend': {
        const period = Number(indicator.params?.period ?? 10);
        const multiplier = Number(indicator.params?.multiplier ?? 3);
        results.supertrend = supertrend(
          candles.map((c) => ({ high: c.high, low: c.low, close: c.close })),
          period,
          multiplier
        );
        break;
      }
      default:
        break;
    }
  });

  return NextResponse.json({ candles, indicators: results });
}
