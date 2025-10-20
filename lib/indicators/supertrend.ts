export type OHLC = { high: number; low: number; close: number };

function trueRange(current: OHLC, previous?: OHLC): number {
  if (!previous) {
    return current.high - current.low;
  }
  return Math.max(
    current.high - current.low,
    Math.abs(current.high - previous.close),
    Math.abs(current.low - previous.close)
  );
}

function averageTrueRange(data: OHLC[], period: number): number[] {
  const result: number[] = new Array(data.length).fill(NaN);
  let sum = 0;
  for (let i = 0; i < data.length; i++) {
    const tr = trueRange(data[i], i > 0 ? data[i - 1] : undefined);
    if (i < period) {
      sum += tr;
      if (i === period - 1) {
        result[i] = sum / period;
      }
      continue;
    }
    const prevAtr = result[i - 1] ?? tr;
    result[i] = (prevAtr * (period - 1) + tr) / period;
  }
  return result;
}

export function supertrend(
  data: OHLC[],
  period = 10,
  multiplier = 3
): { trend: number[]; direction: (1 | -1)[] } {
  if (period <= 0) throw new Error('El periodo debe ser positivo');
  const trend = new Array<number>(data.length).fill(NaN);
  const direction = new Array<1 | -1>(data.length).fill(1);
  const atr = averageTrueRange(data, period);
  let upperBand = NaN;
  let lowerBand = NaN;

  for (let i = 0; i < data.length; i++) {
    const hl2 = (data[i].high + data[i].low) / 2;
    const atrValue = atr[i];
    if (Number.isNaN(atrValue)) {
      continue;
    }
    const calcUpper = hl2 + multiplier * atrValue;
    const calcLower = hl2 - multiplier * atrValue;

    if (i === period - 1) {
      upperBand = calcUpper;
      lowerBand = calcLower;
      direction[i] = 1;
      trend[i] = lowerBand;
      continue;
    }

    if ((trend[i - 1] ?? 0) === upperBand) {
      if (data[i].close > upperBand) {
        direction[i] = 1;
      } else {
        direction[i] = -1;
      }
    } else {
      if (data[i].close < lowerBand) {
        direction[i] = -1;
      } else {
        direction[i] = 1;
      }
    }

    upperBand = direction[i] === 1 ? Math.min(calcUpper, upperBand) : calcUpper;
    lowerBand = direction[i] === -1 ? Math.max(calcLower, lowerBand) : calcLower;
    trend[i] = direction[i] === 1 ? lowerBand : upperBand;
  }

  return { trend, direction };
}
