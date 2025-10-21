import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useIndicators, type IndicatorRequest } from './useIndicators';

type Candle = { open: number; high: number; low: number; close: number; volume: number };

const sampleCandles: Candle[] = [
  { open: 100, high: 102, low: 99, close: 101, volume: 1200 },
  { open: 101, high: 103, low: 100, close: 102, volume: 1350 },
  { open: 102, high: 104, low: 101, close: 103, volume: 1400 },
  { open: 103, high: 105, low: 102, close: 104, volume: 1450 },
  { open: 104, high: 106, low: 103, close: 105, volume: 1500 },
  { open: 105, high: 107, low: 104, close: 106, volume: 1550 }
];

describe('useIndicators', () => {
  it('calcula resultados independientes por indicador', () => {
    const requests: IndicatorRequest[] = [
      { id: 'ema-5', name: 'ema', params: { period: 5 } },
      { id: 'ema-3', name: 'ema', params: { period: 3 } },
      {
        id: 'macd-default',
        name: 'macd',
        params: { fast: 12, slow: 26, signal: 9 }
      }
    ];

    const { result } = renderHook(({ candles, reqs }) => useIndicators(candles, reqs), {
      initialProps: { candles: sampleCandles, reqs: requests }
    });

    expect(result.current).toHaveProperty('ema-5');
    expect(result.current).toHaveProperty('ema-3');
    expect(result.current).toHaveProperty('macd-default');

    const emaFast = result.current['ema-3'];
    const emaSlow = result.current['ema-5'];
    expect(emaFast?.type).toBe('ema');
    expect(emaSlow?.type).toBe('ema');

    const fastValue = emaFast?.type === 'ema' ? emaFast.series.at(-1) : undefined;
    const slowValue = emaSlow?.type === 'ema' ? emaSlow.series.at(-1) : undefined;
    expect(fastValue).not.toBeUndefined();
    expect(slowValue).not.toBeUndefined();
    if (fastValue !== undefined && slowValue !== undefined) {
      expect(fastValue).not.toBeCloseTo(slowValue);
    }

    const macdResult = result.current['macd-default'];
    expect(macdResult?.type).toBe('macd');
    const macdValue = macdResult?.type === 'macd' ? macdResult.macd.at(-1) : undefined;
    expect(macdValue).not.toBeUndefined();
  });

  it('se actualiza al cambiar los parámetros', () => {
    const initialRequests: IndicatorRequest[] = [
      { id: 'rsi-14', name: 'rsi', params: { period: 14 } }
    ];
    const { result, rerender } = renderHook(({ candles, reqs }) => useIndicators(candles, reqs), {
      initialProps: { candles: sampleCandles, reqs: initialRequests }
    });

    const initialValue = result.current['rsi-14'];
    expect(initialValue?.type).toBe('rsi');

    const updatedRequests: IndicatorRequest[] = [
      { id: 'rsi-7', name: 'rsi', params: { period: 7 } }
    ];
    rerender({ candles: sampleCandles, reqs: updatedRequests });

    expect(result.current['rsi-14']).toBeUndefined();
    const updatedValue = result.current['rsi-7'];
    expect(updatedValue?.type).toBe('rsi');
    const updatedNumber = updatedValue?.type === 'rsi' ? updatedValue.series.at(-1) : undefined;
    expect(updatedNumber).not.toBeUndefined();
  });
});
