export function generateMockOHLCV(length = 500) {
  const data: Array<{ ts: number; open: number; high: number; low: number; close: number; volume: number }> = [];
  let price = 100;
  for (let i = 0; i < length; i++) {
    const change = (Math.random() - 0.5) * 2;
    const open = price;
    price = Math.max(1, price + change);
    const close = price;
    const high = Math.max(open, close) + Math.random() * 1.5;
    const low = Math.min(open, close) - Math.random() * 1.5;
    const volume = 1000 + Math.random() * 500;
    data.push({ ts: Date.now() / 1000 - (length - i) * 60, open, high, low, close, volume });
  }
  return data;
}
