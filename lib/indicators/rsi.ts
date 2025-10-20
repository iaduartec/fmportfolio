export function rsi(close: number[], period = 14): number[] {
  if (period <= 0) throw new Error('El periodo debe ser positivo');
  const result: number[] = new Array(close.length).fill(NaN);
  let gain = 0;
  let loss = 0;

  for (let i = 1; i < close.length; i++) {
    const change = close[i] - close[i - 1];
    if (i <= period) {
      if (change >= 0) {
        gain += change;
      } else {
        loss -= change;
      }
      if (i === period) {
        const avgGain = gain / period;
        const avgLoss = loss / period;
        const rs = avgLoss === 0 ? Infinity : avgGain / avgLoss;
        result[i] = 100 - 100 / (1 + rs);
        gain = avgGain;
        loss = avgLoss;
      }
      continue;
    }

    if (change >= 0) {
      gain = (gain * (period - 1) + change) / period;
      loss = (loss * (period - 1)) / period;
    } else {
      gain = (gain * (period - 1)) / period;
      loss = (loss * (period - 1) - change) / period;
    }

    const rs = loss === 0 ? Infinity : gain / loss;
    result[i] = 100 - 100 / (1 + rs);
  }

  return result;
}
