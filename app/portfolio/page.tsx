import { db } from '@/lib/db';
import { positions, prices, symbols, trades } from '@/drizzle/schema';
import { eq, desc } from 'drizzle-orm';
import { PositionsTable } from '@/components/PositionsTable';
import { PnLSummary } from '@/components/PnLSummary';

export default async function PortfolioPage() {
  const rows = await db.select().from(positions);
  const enriched = await Promise.all(
    rows.map(async (position) => {
      const symbol = await db.query.symbols.findFirst({ where: eq(symbols.id, position.symbolId) });
      const latest = await db
        .select()
        .from(prices)
        .where(eq(prices.symbolId, position.symbolId))
        .orderBy(desc(prices.ts))
        .limit(1);
      const marketPrice = latest[0]?.close ?? position.avgPrice;
      const unrealized = (marketPrice - position.avgPrice) * position.qty;
      return {
        ...position,
        ticker: symbol?.ticker,
        marketPrice,
        unrealized
      };
    })
  );

  const realized = await db.select().from(trades);
  const dailyPnl = realized.reduce((acc, trade) => acc + (trade.side === 'sell' ? trade.price * trade.qty : 0), 0);
  const totalUnrealized = enriched.reduce((acc, row) => acc + (row.unrealized ?? 0), 0);

  return (
    <div className="space-y-6">
      <PnLSummary daily={dailyPnl} unrealized={totalUnrealized} />
      <PositionsTable positions={enriched} />
    </div>
  );
}
