'use client';

import { useMemo } from 'react';
import { ema, rsi, macd, vwapAnchored, supertrend } from '@/lib/indicators';

export type IndicatorRequest =
  | { id: string; name: 'ema'; params: { period: number } }
  | { id: string; name: 'rsi'; params: { period: number } }
  | { id: string; name: 'macd'; params: { fast: number; slow: number; signal: number } }
  | { id: string; name: 'vwapAnchored'; params: { anchorIndex: number } }
  | { id: string; name: 'supertrend'; params: { period: number; multiplier: number } };

type Candle = { open: number; high: number; low: number; close: number; volume: number };

export type IndicatorValues = Record<string, IndicatorValue>;

type IndicatorValue =
  | { type: 'ema'; series: number[] }
  | { type: 'rsi'; series: number[] }
  | { type: 'macd'; macd: number[]; signal: number[]; hist: number[] }
  | { type: 'vwapAnchored'; series: number[] }
  | { type: 'supertrend'; trend: number[]; direction: (1 | -1)[] };

export function useIndicators(candles: Candle[], requests: IndicatorRequest[]): IndicatorValues {
  return useMemo(() => {
    const closes = candles.map((c) => c.close);
    const highLowClose = candles.map((candle) => ({
      high: candle.high,
      low: candle.low,
      close: candle.close
    }));
    const highLowCloseVolume = candles.map((candle) => ({
      high: candle.high,
      low: candle.low,
      close: candle.close,
      volume: candle.volume
    }));

    const values: IndicatorValues = {};

    requests.forEach((req) => {
      switch (req.name) {
        case 'ema':
          values[req.id] = { type: 'ema', series: ema(closes, req.params.period) };
          break;
        case 'rsi':
          values[req.id] = { type: 'rsi', series: rsi(closes, req.params.period) };
          break;
        case 'macd': {
          const result = macd(closes, req.params.fast, req.params.slow, req.params.signal);
          values[req.id] = { type: 'macd', ...result };
          break;
        }
        case 'vwapAnchored':
          values[req.id] = {
            type: 'vwapAnchored',
            series: vwapAnchored(highLowCloseVolume, req.params.anchorIndex)
          };
          break;
        case 'supertrend': {
          const result = supertrend(highLowClose, req.params.period, req.params.multiplier);
          values[req.id] = { type: 'supertrend', ...result };
          break;
        }
      }
    });

    return values;
  }, [candles, requests]);
}
