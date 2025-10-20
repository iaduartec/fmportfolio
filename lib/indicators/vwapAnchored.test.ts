import { describe, it, expect } from 'vitest';
import { vwapAnchored } from './vwapAnchored';

describe('vwapAnchored', () => {
  it('calcula desde anchor', () => {
    const data = Array.from({ length: 5 }, (_, i) => ({
      high: i + 2,
      low: i,
      close: i + 1,
      volume: 100 + i
    }));
    const result = vwapAnchored(data, 2);
    expect(result.slice(0, 2).every((v) => Number.isNaN(v))).toBe(true);
    expect(result[2]).toBeDefined();
  });

  it('valida anchor', () => {
    expect(() => vwapAnchored([], 0)).toThrow();
  });
});
