import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { symbols } from '@/drizzle/schema';

export const dynamic = 'force-dynamic';

export async function GET() {
  const db = await getDb();
  const data = await db.select().from(symbols);
  return NextResponse.json(data);
}
