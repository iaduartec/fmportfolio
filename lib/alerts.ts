import fs from 'fs';
import path from 'path';
import { eq, desc } from 'drizzle-orm';
import { db } from './db';
import { alerts, prices, symbols } from '../drizzle/schema';
import { fetchOHLCV } from './adapters/fmp';
import { sendAlert } from './ws';

const logPath = path.resolve(process.cwd(), 'alerts.log');

function writeLog(message: string) {
  fs.appendFileSync(logPath, `${new Date().toISOString()} ${message}\n`);
  console.log(message);
}

export async function evaluateAlerts() {
  const activeAlerts = await db.select().from(alerts).where(eq(alerts.isActive, true));
  for (const alert of activeAlerts) {
    const symbolRow = await db.query.symbols.findFirst({ where: eq(symbols.id, alert.symbolId) });
    if (!symbolRow) continue;

    const latestPrice = await db
      .select()
      .from(prices)
      .where(eq(prices.symbolId, alert.symbolId))
      .orderBy(desc(prices.ts))
      .limit(1);

    let bar = latestPrice[0];
    if (!bar) {
      try {
        const now = new Date();
        const past = new Date(now.getTime() - 1000 * 60 * 60 * 24 * 30);
        const fetched = await fetchOHLCV(
          symbolRow.ticker,
          '1D',
          past.toISOString().slice(0, 10),
          now.toISOString().slice(0, 10)
        );
        bar = fetched[fetched.length - 1];
      } catch (error) {
        writeLog(`[Inferencia] Error obteniendo datos para alerta ${alert.id}: ${String(error)}`);
        continue;
      }
    }

    if (!bar) continue;

    const params = alert.params as unknown as Record<string, unknown>;
    const nowTs = Math.floor(Date.now() / 1000);

    if (alert.type === 'price') {
      const operator = params.operator as string;
      const level = Number(params.level);
      const value = Number(bar.close);
      let triggered = false;
      switch (operator) {
        case '>':
          triggered = value > level;
          break;
        case '<':
          triggered = value < level;
          break;
        case '>=':
          triggered = value >= level;
          break;
        case '<=':
          triggered = value <= level;
          break;
      }
      if (triggered && (!alert.lastTriggeredAt || nowTs - alert.lastTriggeredAt > 60)) {
        await db
          .update(alerts)
          .set({ lastTriggeredAt: nowTs })
          .where(eq(alerts.id, alert.id));
        const message = `Alerta ${alert.id} ${symbolRow.ticker} precio ${operator} ${level}`;
        writeLog(message);
        sendAlert({
          type: 'alert',
          data: {
            id: alert.id!,
            symbol: symbolRow.ticker,
            message,
            triggeredAt: nowTs
          }
        });
      }
    } else if (alert.type === 'indicator') {
      const indicator = params.indicator as string;
      if (indicator === 'ema_cross') {
        const fast = Number(params.fast ?? 9);
        const slow = Number(params.slow ?? 21);
        const bars = await db
          .select()
          .from(prices)
          .where(eq(prices.symbolId, alert.symbolId))
          .orderBy(desc(prices.ts))
          .limit(slow + 5);
        const sorted = bars.reverse();
        if (sorted.length >= slow + 1) {
          const closes = sorted.map((b) => b.close);
          const fastEma = closes.slice(-fast - 1).reduce((a, b) => a + b, 0) / (fast + 1);
          const slowEma = closes.slice(-slow - 1).reduce((a, b) => a + b, 0) / (slow + 1);
          const crossed = fastEma > slowEma;
          if (crossed && (!alert.lastTriggeredAt || nowTs - alert.lastTriggeredAt > 60)) {
            await db
              .update(alerts)
              .set({ lastTriggeredAt: nowTs })
              .where(eq(alerts.id, alert.id));
            const message = `Alerta indicador EMA cruzada ${symbolRow.ticker}`;
            writeLog(message);
            sendAlert({
              type: 'alert',
              data: { id: alert.id!, symbol: symbolRow.ticker, message, triggeredAt: nowTs }
            });
          }
        }
      }
      if (indicator === 'rsi_threshold') {
        const threshold = Number(params.threshold ?? 70);
        if (bar.close > threshold && (!alert.lastTriggeredAt || nowTs - alert.lastTriggeredAt > 60)) {
          await db
            .update(alerts)
            .set({ lastTriggeredAt: nowTs })
            .where(eq(alerts.id, alert.id));
          const message = `Alerta RSI ${symbolRow.ticker} superó ${threshold}`;
          writeLog(message);
          sendAlert({
            type: 'alert',
            data: { id: alert.id!, symbol: symbolRow.ticker, message, triggeredAt: nowTs }
          });
        }
      }
    }
  }
}
