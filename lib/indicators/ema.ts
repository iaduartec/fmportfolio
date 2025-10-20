export function ema(series: number[], period: number): number[] {
  if (period <= 0) throw new Error('El periodo debe ser positivo');
  const multiplier = 2 / (period + 1);
  const result: number[] = new Array(series.length).fill(NaN);
  let previous: number | undefined;

  series.forEach((value, index) => {
    if (Number.isNaN(value)) {
      result[index] = NaN;
      return;
    }
    if (index === 0) {
      previous = value;
      result[index] = value;
      return;
    }
    if (previous === undefined) {
      previous = value;
    }
    previous = value * multiplier + (previous ?? value) * (1 - multiplier);
    result[index] = previous;
  });

  return result;
}
