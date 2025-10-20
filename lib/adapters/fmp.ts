import { config } from '../config';
import { db } from '../db';
import { prices, symbols } from '../../drizzle/schema';
import { eq, and, gte, lte } from 'drizzle-orm';
import { parseISO } from 'date-fns';

type Timeframe = '1m' | '5m' | '15m' | '1h' | '4h' | '1D';

const timeframeMap: Record<Timeframe, string> = {
  '1m': '1min',
  '5m': '5min',
  '15m': '15min',
  '1h': '1hour',
  '4h': '4hour',
  '1D': '1day'
};

let lastCall = 0;
const throttleMs = 200;

async function throttle() {
  const now = Date.now();
  const diff = now - lastCall;
  if (diff < throttleMs) {
    await new Promise((resolve) => setTimeout(resolve, throttleMs - diff));
  }
  lastCall = Date.now();
}

function assertApiKey(apiKey?: string): string {
  const key = apiKey ?? config.fmpApiKey;
  if (!key) {
    throw new Error('FMP_API_KEY no configurado');
  }
  return key;
}

export async function fetchOHLCV(
  symbol: string,
  timeframe: Timeframe,
  start: string,
  end: string,
  apiKey?: string
) {
  const key = assertApiKey(apiKey);
  await throttle();
  const mapped = timeframeMap[timeframe];
  const url = new URL(`https://financialmodelingprep.com/api/v3/historical-chart/${mapped}/${symbol}`);
  url.searchParams.set('from', start);
  url.searchParams.set('to', end);
  url.searchParams.set('apikey', key);

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`FMP error ${response.status}`);
  }
  const json = (await response.json()) as Array<{
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }>;

  if (!json || json.length === 0) {
    throw new Error('Sin datos de FMP');
  }

  const symbolRow = await db.query.symbols.findFirst({ where: eq(symbols.ticker, symbol) });
  if (!symbolRow) {
    throw new Error('Símbolo no registrado');
  }

  const entries = json
    .map((row) => ({
      symbolId: symbolRow.id!,
      timeframe,
      ts: parseISO(row.date),
      open: row.open,
      high: row.high,
      low: row.low,
      close: row.close,
      volume: row.volume
    }))
    .reverse();

  await db.insert(prices).values(entries).onConflictDoNothing();
  return entries;
}

export async function fetchCorporateActions(symbol: string, apiKey?: string) {
  const key = assertApiKey(apiKey);
  await throttle();
  const url = new URL(`https://financialmodelingprep.com/api/v3/historical-price-full/stock_dividend/${symbol}`);
  url.searchParams.set('apikey', key);
  const dividendRes = await fetch(url.toString());
  const dividendJson = await dividendRes.json();

  await throttle();
  const splitUrl = new URL(`https://financialmodelingprep.com/api/v3/historical-price-full/stock_split/${symbol}`);
  splitUrl.searchParams.set('apikey', key);
  const splitRes = await fetch(splitUrl.toString());
  const splitJson = await splitRes.json();

  return {
    dividends: dividendJson?.historical ?? [],
    splits: splitJson?.historical ?? []
  };
}

export async function getCachedOHLCV(
  symbol: string,
  timeframe: Timeframe,
  from: number,
  to: number
) {
  const symbolRow = await db.query.symbols.findFirst({ where: eq(symbols.ticker, symbol) });
  if (!symbolRow) return [];
  const rows = await db
    .select()
    .from(prices)
    .where(
      and(
        eq(prices.symbolId, symbolRow.id!),
        eq(prices.timeframe, timeframe),
        gte(prices.ts, new Date(from * 1000)),
        lte(prices.ts, new Date(to * 1000))
      )
    )
    .orderBy(prices.ts);

  return rows.map((r) => ({
    id: r.id,
    symbolId: r.symbolId,
    timeframe: r.timeframe,
    ts: Math.floor((r.ts as Date).getTime() / 1000),
    open: r.open,
    high: r.high,
    low: r.low,
    close: r.close,
    volume: r.volume
  }));
}
