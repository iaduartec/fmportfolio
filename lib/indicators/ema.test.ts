import { describe, it, expect } from 'vitest';
import { ema } from './ema';

describe('ema', () => {
  it('calcula EMA correctamente', () => {
    const series = [1, 2, 3, 4, 5];
    const result = ema(series, 3);
    expect(result[0]).toBeCloseTo(1);
    expect(result[result.length - 1]).toBeGreaterThan(result[0]);
  });

  it('lanza error con periodo inválido', () => {
    expect(() => ema([1, 2, 3], 0)).toThrow();
  });
});
