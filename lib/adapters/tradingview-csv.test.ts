import { describe, expect, it } from 'vitest';
import { parseTradingViewCsv, TradingViewCsvError } from './tradingview-csv';

const sampleCsv = `time,open,high,low,close,volume
2024-01-02 15:30:00,100,110,95,105,12000
1704303600,105,115,100,110,15000`;

const ledgerCsv = `Symbol,Side,Qty,Fill Price,Commission,Closing Time
NASDAQ:GOOGL,buy,1.0,159.0,0.0,2025-04-28 16:22:15
NASDAQ:GOOGL,Dividend,0.18,,,2025-06-17 00:00:00
NYSE:TGT,sell,2,142.5,0.15,2025-08-12 10:05:00`;

describe('parseTradingViewCsv', () => {
  it('convierte filas de TradingView a velas internas', () => {
    const candles = parseTradingViewCsv(sampleCsv);
    expect(candles).toHaveLength(2);
    expect(candles[0].open).toBe(100);
    expect(candles[0].ts.toISOString()).toBe('2024-01-02T15:30:00.000Z');
    expect(candles[1].ts.getTime()).toBe(1704303600 * 1000);
    expect(candles[1].close).toBe(110);
  });

  it('convierte filas de ledger a velas planas usando Fill Price y omite filas sin precio', () => {
    const candles = parseTradingViewCsv(ledgerCsv);
    expect(candles).toHaveLength(2);
    expect(candles[0].open).toBe(159);
    expect(candles[0].high).toBe(159);
    expect(candles[0].volume).toBe(1);
    expect(candles[0].ts.toISOString()).toBe('2025-04-28T16:22:15.000Z');
    expect(candles[1].close).toBe(142.5);
    expect(candles[1].volume).toBe(2);
    expect(candles[1].ts.toISOString()).toBe('2025-08-12T10:05:00.000Z');
  });

  it('lanza error con CSV inv�lido', () => {
    expect(() => parseTradingViewCsv('time,open\ninvalid,data')).toThrow(TradingViewCsvError);
  });
});
