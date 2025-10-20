import { NextResponse } from 'next/server';
import { z } from 'zod';
import { fetchOHLCV } from '@/lib/adapters/fmp';

const schema = z.object({
  symbol: z.string().min(1),
  timeframe: z.enum(['1m', '5m', '15m', '1h', '4h', '1D']),
  start: z.string(),
  end: z.string()
});

export async function POST(request: Request) {
  const json = await request.json();
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  try {
    const data = await fetchOHLCV(parsed.data.symbol, parsed.data.timeframe, parsed.data.start, parsed.data.end);
    return NextResponse.json({ count: data.length });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
