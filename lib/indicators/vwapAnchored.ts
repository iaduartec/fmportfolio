export type OHLCV = { high: number; low: number; close: number; volume: number };

export function vwapAnchored(data: OHLCV[], anchorIndex: number): number[] {
  if (anchorIndex < 0 || anchorIndex >= data.length) {
    throw new Error('anchorIndex fuera de rango');
  }
  const result: number[] = new Array(data.length).fill(NaN);
  let cumulativeVolume = 0;
  let cumulativeTypicalPriceVolume = 0;

  for (let i = anchorIndex; i < data.length; i++) {
    const bar = data[i];
    const typicalPrice = (bar.high + bar.low + bar.close) / 3;
    cumulativeVolume += bar.volume;
    cumulativeTypicalPriceVolume += typicalPrice * bar.volume;
    result[i] = cumulativeVolume === 0 ? NaN : cumulativeTypicalPriceVolume / cumulativeVolume;
  }

  return result;
}
