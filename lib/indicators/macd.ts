import { ema } from './ema';

export function macd(
  close: number[],
  fast = 12,
  slow = 26,
  signalPeriod = 9
): { macd: number[]; signal: number[]; hist: number[] } {
  if (fast <= 0 || slow <= 0 || signalPeriod <= 0) {
    throw new Error('Los periodos deben ser positivos');
  }
  if (fast >= slow) {
    throw new Error('El periodo rápido debe ser menor al lento');
  }

  const fastEma = ema(close, fast);
  const slowEma = ema(close, slow);
  const macdLine = close.map((_, idx) => fastEma[idx] - slowEma[idx]);
  const signalLine = ema(macdLine, signalPeriod);
  const hist = macdLine.map((value, idx) => value - signalLine[idx]);

  return { macd: macdLine, signal: signalLine, hist };
}
