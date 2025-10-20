import { describe, it, expect } from 'vitest';
import { supertrend } from './supertrend';

describe('supertrend', () => {
  it('calcula tendencia y dirección', () => {
    const data = Array.from({ length: 50 }, (_, i) => ({
      high: i + 2,
      low: i,
      close: i + 1
    }));
    const { trend, direction } = supertrend(data, 10, 3);
    expect(trend.length).toBe(data.length);
    expect(direction.length).toBe(data.length);
  });

  it('valida periodo', () => {
    expect(() => supertrend([], 0, 3)).toThrow();
  });
});
