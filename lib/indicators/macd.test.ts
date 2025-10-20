import { describe, it, expect } from 'vitest';
import { macd } from './macd';

describe('macd', () => {
  it('devuelve macd, signal e hist', () => {
    const data = Array.from({ length: 50 }, (_, i) => i + 1);
    const { macd: line, signal, hist } = macd(data);
    expect(line.length).toBe(data.length);
    expect(signal.length).toBe(data.length);
    expect(hist.length).toBe(data.length);
  });

  it('valida periodos', () => {
    expect(() => macd([1, 2, 3], 26, 12)).toThrow();
  });
});
