import { parse } from 'csv-parse/sync';
import { z } from 'zod';

const tradingViewRowSchema = z.object({
  time: z.string(),
  open: z.coerce.number(),
  high: z.coerce.number(),
  low: z.coerce.number(),
  close: z.coerce.number(),
  volume: z.coerce.number()
});

const tradingViewSchema = z.array(tradingViewRowSchema);

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
    throw new TradingViewCsvError('Timestamp vacío en CSV de TradingView');
  }
  if (/^\d+$/.test(trimmed)) {
    const numeric = Number(trimmed);
    const ms = trimmed.length > 10 ? numeric : numeric * 1000;
    const date = new Date(ms);
    if (Number.isNaN(date.getTime())) {
      throw new TradingViewCsvError(`No se pudo interpretar la marca de tiempo numérica: ${trimmed}`);
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

export function parseTradingViewCsv(input: string): TradingViewCandle[] {
  try {
    const rows = parse(input, { columns: true, skip_empty_lines: true });
    const parsed = tradingViewSchema.parse(rows);
    return parsed.map((row) => ({
      ts: parseTimestamp(row.time),
      open: row.open,
      high: row.high,
      low: row.low,
      close: row.close,
      volume: row.volume
    }));
  } catch (error) {
    if (error instanceof TradingViewCsvError) {
      throw error;
    }
    if (error instanceof z.ZodError) {
      throw new TradingViewCsvError('Formato CSV de TradingView inválido');
    }
    throw new TradingViewCsvError('No se pudo procesar el CSV de TradingView');
  }
}

export { TradingViewCsvError };
