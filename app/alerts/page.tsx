import { getDb } from '@/lib/db';
import { alerts, symbols } from '@/drizzle/schema';
import { AlertsClient } from './AlertsClient';
import type { AlertRecord } from './AlertsClient';

export const dynamic = 'force-dynamic';

export default async function AlertsPage() {
  const db = await getDb();
  const [alertRows, symbolRows] = await Promise.all([
    db.select().from(alerts),
    db.select({ ticker: symbols.ticker }).from(symbols)
  ]);

  const serializableAlerts: AlertRecord[] = alertRows.map((alert) => ({
    id: alert.id,
    symbolId: alert.symbolId,
    type: alert.type,
    params: (alert.params ?? {}) as Record<string, unknown>,
    isActive: alert.isActive ? 1 : 0,
    lastTriggeredAt: alert.lastTriggeredAt
      ? Math.floor((alert.lastTriggeredAt as Date).getTime() / 1000)
      : null
  }));

  const tickers = symbolRows.map((symbol) => symbol.ticker);

  return <AlertsClient alerts={serializableAlerts} symbols={tickers} />;
}
