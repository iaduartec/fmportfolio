import { describe, expect, it } from 'vitest';
import { formatAsUtcDateString } from './dates';

describe('formatAsUtcDateString', () => {
  it('formatea la fecha en UTC con formato YYYY-MM-DD', () => {
    const result = formatAsUtcDateString(new Date(Date.UTC(2024, 0, 5, 23, 59, 59)));
    expect(result).toBe('2024-01-05');
  });

  it('usa ceros a la izquierda para mes y día', () => {
    const result = formatAsUtcDateString(new Date(Date.UTC(2024, 8, 9)));
    expect(result).toBe('2024-09-09');
  });
});
