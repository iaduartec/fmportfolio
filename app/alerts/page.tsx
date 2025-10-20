import { db } from '@/lib/db';
import { alerts, symbols } from '@/drizzle/schema';
import { AlertsClient } from './AlertsClient';

export default async function AlertsPage() {
  const allAlerts = await db.select().from(alerts);
  const allSymbols = await db.select().from(symbols);
  return <AlertsClient alerts={allAlerts} symbols={allSymbols.map((s) => s.ticker)} />;
}
