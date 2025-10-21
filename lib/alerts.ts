import fs from 'fs';
import path from 'path';
import { eq, desc } from 'drizzle-orm';
import { db } from './db';
import { alerts, prices, symbols } from '../drizzle/schema';
import { fetchOHLCV } from './adapters/fmp';
import { sendAlert } from './ws';
import { rsi } from './indicators';

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

    type PriceBar = {
      ts: Date | number;
      open: number;
      high: number;
      low: number;
      close: number;
      volume: number;
    };

    const latestPrice = await db
      .select()
      .from(prices)
      .where(eq(prices.symbolId, alert.symbolId))
      .orderBy(desc(prices.ts))
      .limit(1);

    let bar: PriceBar | undefined = latestPrice[0];
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

    const params = alert.params as Record<string, unknown>;
    const nowTs = Math.floor(Date.now() / 1000);
    const lastTs =
      alert.lastTriggeredAt instanceof Date
        ? Math.floor(alert.lastTriggeredAt.getTime() / 1000)
        : typeof alert.lastTriggeredAt === 'number'
        ? Math.floor(alert.lastTriggeredAt)
        : null;

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
      if (triggered && (!lastTs || nowTs - lastTs > 60)) {
        await db
          .update(alerts)
          .set({ lastTriggeredAt: new Date() })
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
          if (crossed && (!lastTs || nowTs - lastTs > 60)) {
            await db
              .update(alerts)
              .set({ lastTriggeredAt: new Date() })
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
        const period = Number(params.period ?? 14);
        const limit = Math.max(period + 5, period * 2);

        let closes: number[] = [];
        const storedBars = await db
          .select()
          .from(prices)
          .where(eq(prices.symbolId, alert.symbolId))
          .orderBy(desc(prices.ts))
          .limit(limit);

        if (storedBars.length >= period + 1) {
          closes = storedBars.reverse().map((candle) => Number(candle.close));
        }

        if (closes.length < period + 1) {
          try {
            const now = new Date();
            const lookbackDays = Math.max(period + 10, 30);
            const past = new Date(now.getTime() - lookbackDays * 24 * 60 * 60 * 1000);
            const fetched = await fetchOHLCV(
              symbolRow.ticker,
              '1D',
              past.toISOString().slice(0, 10),
              now.toISOString().slice(0, 10)
            );
            if (fetched.length >= period + 1) {
              closes = fetched.map((candle) => Number(candle.close));
            }
          } catch (error) {
            writeLog(`[Inferencia] Error calculando RSI para alerta ${alert.id}: ${String(error)}`);
            continue;
          }
        }

        if (closes.length < period + 1) {
          writeLog(
            `[Inferencia] Datos insuficientes para RSI alerta ${alert.id}, se requieren al menos ${
              period + 1
            } cierres`
          );
          continue;
        }

        const rsiSeries = rsi(closes, period);
        const latestRsi = rsiSeries[rsiSeries.length - 1];

        if (
          Number.isFinite(latestRsi) &&
          !Number.isNaN(latestRsi) &&
          latestRsi > threshold &&
          (!lastTs || nowTs - lastTs > 60)
        ) {
          await db
            .update(alerts)
            .set({ lastTriggeredAt: new Date() })
            .where(eq(alerts.id, alert.id));
          const message = `Alerta RSI ${symbolRow.ticker} ${latestRsi.toFixed(2)} superó ${threshold}`;
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
