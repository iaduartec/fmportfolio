import { describe, expect, it } from 'vitest';
import { normalizeCandles, type ChartCandle } from './transformers';

describe('normalizeCandles', () => {
  it('mantiene las velas cuando el timestamp ya esta en segundos', () => {
    const input: ChartCandle[] = [
      { time: 1_696_377_600, open: 100, high: 105, low: 95, close: 102, volume: 10_000 }
    ];

    const result = normalizeCandles(input);

    expect(result).toEqual([
      {
        time: 1_696_377_600,
        open: 100,
        high: 105,
        low: 95,
        close: 102
      }
    ]);
  });

  it('convierte timestamps en milisegundos a segundos', () => {
    const input: ChartCandle[] = [
      { time: 1_696_377_600_000, open: 100, high: 105, low: 95, close: 102, volume: 10_000 }
    ];

    const result = normalizeCandles(input);

    expect(result[0]?.time).toBe(1_696_377_600);
  });
});
