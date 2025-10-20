import { db } from './db';
import { positions, trades, symbols } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

export async function recalcPositions() {
  const allSymbols = await db.select().from(symbols);
  for (const symbol of allSymbols) {
    const symbolTrades = await db
      .select()
      .from(trades)
      .where(eq(trades.symbolId, symbol.id!))
      .orderBy(trades.ts);

    let qty = 0;
    let cost = 0;

    for (const trade of symbolTrades) {
      const signedQty = trade.side === 'buy' ? trade.qty : -trade.qty;
      const signedCost = trade.price * trade.qty + trade.fees;
      qty += signedQty;
      if (qty !== 0) {
        cost += signedCost * Math.sign(signedQty);
      } else {
        cost = 0;
      }
    }

    const avgPrice = qty !== 0 ? Math.abs(cost / qty) : 0;
    const existing = await db.query.positions.findFirst({ where: eq(positions.symbolId, symbol.id!) });
    if (existing) {
      await db
        .update(positions)
        .set({ qty, avgPrice, updatedAt: Math.floor(Date.now() / 1000) })
        .where(eq(positions.id, existing.id));
    } else {
      await db.insert(positions).values({
        symbolId: symbol.id!,
        qty,
        avgPrice,
        updatedAt: Math.floor(Date.now() / 1000)
      });
    }
  }
}
