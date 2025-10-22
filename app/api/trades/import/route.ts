import { NextResponse } from 'next/server';
import { parse } from 'csv-parse/sync';
import { z } from 'zod';
import { getDb } from '@/lib/db';
import { trades, symbols } from '@/drizzle/schema';
import { recalcPositions } from '@/lib/portfolio';
import { eq } from 'drizzle-orm';

const rowSchema = z.object({
  symbol: z.string(),
  side: z.enum(['buy', 'sell']),
  qty: z.coerce.number(),
  price: z.coerce.number(),
  ts: z.string(),
  fees: z.coerce.number().default(0)
});

export async function POST(request: Request) {
  const db = await getDb();
  const text = await request.text();
  const rows = parse(text, { columns: true, skip_empty_lines: true });
  const parsed = z.array(rowSchema).safeParse(rows);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  for (const row of parsed.data) {
    const symbolRow = await db.query.symbols.findFirst({ where: eq(symbols.ticker, row.symbol) });
    if (!symbolRow) continue;
    await db.insert(trades).values({
      symbolId: symbolRow.id!,
      side: row.side,
      qty: row.qty,
      price: row.price,
      ts: new Date(row.ts),
      fees: row.fees
    });
  }
  await recalcPositions();
  return NextResponse.json({ imported: parsed.data.length });
}
