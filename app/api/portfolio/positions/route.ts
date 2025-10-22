import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { positions, symbols } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  const db = await getDb();
  const rows = await db.select().from(positions);
  const withSymbols = await Promise.all(
    rows.map(async (row) => {
      const symbol = await db.query.symbols.findFirst({ where: eq(symbols.id, row.symbolId) });
      return { ...row, ticker: symbol?.ticker };
    })
  );
  return NextResponse.json(withSymbols);
}
