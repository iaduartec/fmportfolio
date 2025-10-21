import { describe, expect, it } from 'vitest';
import { parseTradingViewCsv, TradingViewCsvError } from './tradingview-csv';

const sampleCsv = `time,open,high,low,close,volume\n2024-01-02 15:30:00,100,110,95,105,12000\n1704303600,105,115,100,110,15000`;

describe('parseTradingViewCsv', () => {
  it('convierte filas de TradingView a velas internas', () => {
    const candles = parseTradingViewCsv(sampleCsv);
    expect(candles).toHaveLength(2);
    expect(candles[0].open).toBe(100);
    expect(candles[0].ts.toISOString()).toBe('2024-01-02T15:30:00.000Z');
    expect(candles[1].ts.getTime()).toBe(1704303600 * 1000);
    expect(candles[1].close).toBe(110);
  });

  it('lanza error con CSV inválido', () => {
    expect(() => parseTradingViewCsv('time,open\ninvalid,data')).toThrow(TradingViewCsvError);
  });
});
