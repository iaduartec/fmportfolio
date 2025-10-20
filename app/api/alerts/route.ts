import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { alerts, symbols } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';

const createSchema = z.object({
  symbol: z.string(),
  type: z.enum(['price', 'indicator']),
  params: z.record(z.any())
});

export async function GET() {
  const data = await db.select().from(alerts);
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const json = await request.json();
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const symbolRow = await db.query.symbols.findFirst({ where: eq(symbols.ticker, parsed.data.symbol) });
  if (!symbolRow) {
    return NextResponse.json({ error: 'Símbolo no encontrado' }, { status: 404 });
  }
  const inserted = await db
    .insert(alerts)
    .values({
      symbolId: symbolRow.id!,
      type: parsed.data.type,
      params: parsed.data.params,
      isActive: true,
      createdAt: new Date()
    })
    .returning();
  return NextResponse.json(inserted[0]);
}
