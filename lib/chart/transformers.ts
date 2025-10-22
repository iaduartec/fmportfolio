import { type CandlestickData, type UTCTimestamp } from 'lightweight-charts';

export type ChartCandle = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

function normalizeTimestamp(value: number): UTCTimestamp {
  const inMilliseconds = value > 1_000_000_000_000;
  const seconds = inMilliseconds ? Math.floor(value / 1000) : Math.floor(value);
  // [Inferencia] Algunos orígenes (TradingView CSV, FMP) alternan entre ms y s.
  // Normalizamos a segundos UTC para que Lightweight Charts pinte los valores correctos.
  return seconds as UTCTimestamp;
}

export function normalizeCandles(data: ChartCandle[]): CandlestickData[] {
  return data.map((bar) => ({
    time: normalizeTimestamp(bar.time),
    open: bar.open,
    high: bar.high,
    low: bar.low,
    close: bar.close
  }));
}
