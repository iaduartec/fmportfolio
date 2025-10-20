import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { symbols } from '@/drizzle/schema';

export const dynamic = 'force-dynamic';

export async function GET() {
  const data = await db.select().from(symbols);
  return NextResponse.json(data);
}
