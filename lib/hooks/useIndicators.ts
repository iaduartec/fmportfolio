'use client';

import { useMemo } from 'react';
import { ema, rsi, macd, vwapAnchored, supertrend } from '@/lib/indicators';

export type IndicatorRequest =
  | { name: 'ema'; params: { period: number } }
  | { name: 'rsi'; params: { period: number } }
  | { name: 'macd'; params: { fast: number; slow: number; signal: number } }
  | { name: 'vwapAnchored'; params: { anchorIndex: number } }
  | { name: 'supertrend'; params: { period: number; multiplier: number } };

type Candle = { open: number; high: number; low: number; close: number; volume: number };

type Result = Record<string, unknown>;

export function useIndicators(candles: Candle[], requests: IndicatorRequest[], _useWorker = false) {
  return useMemo(() => {
    const closes = candles.map((c) => c.close);
    const values: Result = {};
    requests.forEach((req) => {
      switch (req.name) {
        case 'ema':
          values.ema = ema(closes, req.params.period);
          break;
        case 'rsi':
          values.rsi = rsi(closes, req.params.period);
          break;
        case 'macd':
          values.macd = macd(closes, req.params.fast, req.params.slow, req.params.signal);
          break;
        case 'vwapAnchored':
          values.vwapAnchored = vwapAnchored(
            candles.map((c) => ({ high: c.high, low: c.low, close: c.close, volume: c.volume })),
            req.params.anchorIndex
          );
          break;
        case 'supertrend':
          values.supertrend = supertrend(
            candles.map((c) => ({ high: c.high, low: c.low, close: c.close })),
            req.params.period,
            req.params.multiplier
          );
          break;
      }
    });
    return values;
  }, [candles, requests]);
}
