import { parse } from 'csv-parse/sync';
import { z } from 'zod';

const candleRowSchema = z.object({
  time: z.string(),
  open: z.coerce.number(),
  high: z.coerce.number(),
  low: z.coerce.number(),
  close: z.coerce.number(),
  volume: z.coerce.number()
});

const candleSchema = z.array(candleRowSchema);

const ledgerRowSchema = z.object({
  Symbol: z.string(),
  Side: z.string(),
  Qty: z.string().optional(),
  'Fill Price': z.string().optional(),
  Commission: z.string().optional(),
  'Closing Time': z.string()
});

const ledgerSchema = z.array(ledgerRowSchema);

export type TradingViewCandle = {
  ts: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

class TradingViewCsvError extends Error {}

function parseTimestamp(value: string): Date {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new TradingViewCsvError('Timestamp vac�o en CSV de TradingView');
  }
  if (/^\d+$/.test(trimmed)) {
    const numeric = Number(trimmed);
    const ms = trimmed.length > 10 ? numeric : numeric * 1000;
    const date = new Date(ms);
    if (Number.isNaN(date.getTime())) {
      throw new TradingViewCsvError(`No se pudo interpretar la marca de tiempo num�rica: ${trimmed}`);
    }
    return date;
  }
  const isoCandidate = trimmed.includes(' ') && !trimmed.endsWith('Z') ? `${trimmed.replace(' ', 'T')}Z` : trimmed;
  const date = new Date(isoCandidate);
  if (Number.isNaN(date.getTime())) {
    throw new TradingViewCsvError(`No se pudo interpretar la marca de tiempo: ${trimmed}`);
  }
  return date;
}

function parseLedgerRows(input: Array<Record<string, unknown>>): TradingViewCandle[] {
  const parsed = ledgerSchema.parse(input);

  const candles = parsed
    .map((row) => {
      const side = row.Side.trim().toLowerCase();
      if (side !== 'buy' && side !== 'sell') {
        return null;
      }

      const rawPrice = row['Fill Price']?.trim();
      if (!rawPrice) {
        return null;
      }
      const price = Number(rawPrice);
      if (!Number.isFinite(price) || price <= 0) {
        return null;
      }

      const qtyValue = row.Qty?.trim();
      const quantity = qtyValue ? Number(qtyValue) : 0;
      const volume = Number.isFinite(quantity) ? Math.abs(quantity) : 0;

      return {
        ts: parseTimestamp(row['Closing Time']),
        open: price,
        high: price,
        low: price,
        close: price,
        volume
      } satisfies TradingViewCandle;
    })
    .filter((value): value is TradingViewCandle => value !== null);

  return candles.sort((a, b) => a.ts.getTime() - b.ts.getTime());
}

function parseCandleRows(input: Array<Record<string, unknown>>): TradingViewCandle[] {
  const parsed = candleSchema.parse(input);
  return parsed.map((row) => ({
    ts: parseTimestamp(row.time),
    open: row.open,
    high: row.high,
    low: row.low,
    close: row.close,
    volume: row.volume
  }));
}

export function parseTradingViewCsv(input: string): TradingViewCandle[] {
  try {
    const rows = parse(input, { columns: true, skip_empty_lines: true, trim: true }) as Array<Record<string, unknown>>;

    if (rows.length === 0) {
      return [];
    }

    const sample = rows[0] ?? {};
    if (typeof sample === 'object' && sample !== null) {
      if ('time' in sample) {
        return parseCandleRows(rows);
      }
      if ('Closing Time' in sample) {
        return parseLedgerRows(rows);
      }
    }

    throw new TradingViewCsvError('Encabezados de CSV desconocidos');
  } catch (error) {
    if (error instanceof TradingViewCsvError) {
      throw error;
    }
    if (error instanceof z.ZodError) {
      throw new TradingViewCsvError('Formato CSV de TradingView inv�lido');
    }
    throw new TradingViewCsvError('No se pudo procesar el CSV de TradingView');
  }
}

export { TradingViewCsvError };
