import { describe, it, expect } from 'vitest';
import { rsi } from './rsi';

describe('rsi', () => {
  it('produce valores en rango', () => {
    const data = Array.from({ length: 100 }, (_, i) => i + 1);
    const values = rsi(data, 14);
    expect(values.filter((v) => !Number.isNaN(v)).every((v) => v >= 0 && v <= 100)).toBe(true);
  });

  it('lanza error periodo inválido', () => {
    expect(() => rsi([1, 2, 3], 0)).toThrow();
  });
});
