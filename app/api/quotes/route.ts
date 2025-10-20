import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getCachedOHLCV } from '@/lib/adapters/fmp';
import { rateLimit } from '@/lib/rate-limit';

const querySchema = z.object({
  symbol: z.string().min(1),
  timeframe: z.enum(['1m', '5m', '15m', '1h', '4h', '1D']),
  from: z.string(),
  to: z.string()
});

export async function GET(request: NextRequest) {
  const params = Object.fromEntries(request.nextUrl.searchParams.entries());
  const parsed = querySchema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const limiter = rateLimit(request.ip ?? 'global', 60, 60_000);
  if (!limiter.success) {
    return NextResponse.json({ error: 'Rate limit excedido' }, { status: 429 });
  }
  const fromTs = Math.floor(new Date(parsed.data.from).getTime() / 1000);
  const toTs = Math.floor(new Date(parsed.data.to).getTime() / 1000);
  const data = await getCachedOHLCV(parsed.data.symbol, parsed.data.timeframe, fromTs, toTs);
  return NextResponse.json(data);
}
