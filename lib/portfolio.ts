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
      const tradeQty = trade.qty;
      const fees = trade.fees ?? 0;
      const direction = trade.side === 'buy' ? 1 : -1;
      let remainingQty = tradeQty;
      let remainingFees = fees;

      if (qty !== 0 && Math.sign(qty) !== direction) {
        const positionSign = Math.sign(qty);
        const closingQty = Math.min(remainingQty, Math.abs(qty));
        if (closingQty > 0) {
          const avgCost = cost / qty;
          cost -= avgCost * closingQty * positionSign;
          qty -= closingQty * positionSign;
          if (fees > 0) {
            const feePortion = (fees * closingQty) / tradeQty;
            remainingFees = Math.max(0, remainingFees - feePortion);
          }
          remainingQty -= closingQty;
        }
      }

      if (remainingQty > 0) {
        const costContribution = (trade.price * remainingQty + remainingFees) * direction;
        qty += remainingQty * direction;
        cost += costContribution;
        remainingFees = 0;
      }

      if (Math.abs(qty) < 1e-9) {
        qty = 0;
        cost = 0;
      }
    }

    const avgPrice = qty !== 0 ? Math.abs(cost / qty) : 0;
    const existing = await db.query.positions.findFirst({ where: eq(positions.symbolId, symbol.id!) });
    if (existing) {
      await db
        .update(positions)
        .set({ qty, avgPrice, updatedAt: new Date() })
        .where(eq(positions.id, existing.id));
    } else {
      await db.insert(positions).values({
        symbolId: symbol.id!,
        qty,
        avgPrice,
        updatedAt: new Date()
      });
    }
  }
}
