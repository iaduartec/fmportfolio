import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { trades, positions, prices } from '@/drizzle/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET() {
  const pos = await db.select().from(positions);
  const results = [] as Array<{ symbolId: number; qty: number; avgPrice: number; marketPrice: number; unrealized: number }>;

  for (const position of pos) {
    const latest = await db
      .select()
      .from(prices)
      .where(eq(prices.symbolId, position.symbolId))
      .orderBy(desc(prices.ts))
      .limit(1);
    const marketPrice = latest[0]?.close ?? position.avgPrice;
    const unrealized = (marketPrice - position.avgPrice) * position.qty;
    results.push({ symbolId: position.symbolId, qty: position.qty, avgPrice: position.avgPrice, marketPrice, unrealized });
  }

  const realized = await db.select().from(trades);
  const dailyPnl = realized.reduce((acc, trade) => acc + (trade.side === 'sell' ? (trade.price - trade.fees) * trade.qty : 0), 0);

  return NextResponse.json({ positions: results, dailyPnl });
}
