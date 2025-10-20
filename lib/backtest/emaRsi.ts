import { ema, rsi } from '../indicators';

type Candle = {
  ts: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

type Params = {
  fast: number;
  slow: number;
  rsiPeriod: number;
  rsiOverbought: number;
  rsiOversold: number;
  commission: number;
  slippage: number;
};

type Trade = {
  entryTs: number;
  exitTs: number;
  entryPrice: number;
  exitPrice: number;
  qty: number;
  pnl: number;
};

export type BacktestSummary = {
  trades: Trade[];
  winrate: number;
  cagr: number;
  sharpe: number;
  maxDrawdown: number;
  profitFactor: number;
  totalReturn: number;
};

export function runEmaRsiBacktest(data: Candle[], params: Params): BacktestSummary {
  if (data.length === 0) {
    return {
      trades: [],
      winrate: 0,
      cagr: 0,
      sharpe: 0,
      maxDrawdown: 0,
      profitFactor: 0,
      totalReturn: 0
    };
  }

  const closes = data.map((c) => c.close);
  const emaFast = ema(closes, params.fast);
  const emaSlow = ema(closes, params.slow);
  const rsiSeries = rsi(closes, params.rsiPeriod);

  const trades: Trade[] = [];
  let positionQty = 0;
  let entryPrice = 0;
  let entryTs = 0;
  let equity = 1;
  let peakEquity = 1;
  let maxDrawdown = 0;
  const returns: number[] = [];

  data.forEach((bar, idx) => {
    const fast = emaFast[idx];
    const slow = emaSlow[idx];
    const rsiValue = rsiSeries[idx];

    if ([fast, slow, rsiValue].some((v) => Number.isNaN(v))) {
      returns.push(0);
      return;
    }

    const crossover = fast > slow && emaFast[idx - 1] <= emaSlow[idx - 1];
    const crossunder = fast < slow && emaFast[idx - 1] >= emaSlow[idx - 1];

    if (positionQty === 0 && crossover && rsiValue > params.rsiOversold) {
      positionQty = 1;
      entryPrice = bar.close * (1 + params.slippage) + params.commission;
      entryTs = bar.ts;
    } else if (positionQty !== 0 && (crossunder || rsiValue > params.rsiOverbought)) {
      const exitPrice = bar.close * (1 - params.slippage) - params.commission;
      const pnl = (exitPrice - entryPrice) * positionQty;
      equity *= 1 + pnl / entryPrice;
      trades.push({ entryTs, exitTs: bar.ts, entryPrice, exitPrice, qty: positionQty, pnl });
      positionQty = 0;
      entryPrice = 0;
    }

    peakEquity = Math.max(peakEquity, equity);
    maxDrawdown = Math.max(maxDrawdown, (peakEquity - equity) / peakEquity);
    returns.push(equity - 1);
  });

  const wins = trades.filter((t) => t.pnl > 0).length;
  const losses = trades.filter((t) => t.pnl < 0).length;
  const totalReturn = equity - 1;
  const winrate = trades.length > 0 ? wins / trades.length : 0;
  const profitFactor = losses === 0 ? Infinity : Math.abs(trades.filter((t) => t.pnl > 0).reduce((acc, t) => acc + t.pnl, 0) /
    trades.filter((t) => t.pnl < 0).reduce((acc, t) => acc + t.pnl, 0));

  const periodsPerYear = 252;
  const avgReturn = returns.reduce((acc, r) => acc + r, 0) / (returns.length || 1);
  const variance = returns.reduce((acc, r) => acc + Math.pow(r - avgReturn, 2), 0) / (returns.length || 1);
  const stdDev = Math.sqrt(variance);
  const sharpe = stdDev === 0 ? 0 : (avgReturn * periodsPerYear) / (stdDev * Math.sqrt(periodsPerYear));
  const years = (data[data.length - 1].ts - data[0].ts) / (60 * 60 * 24 * 365);
  const cagr = years <= 0 ? totalReturn : Math.pow(1 + totalReturn, 1 / years) - 1;

  return {
    trades,
    winrate,
    cagr,
    sharpe,
    maxDrawdown,
    profitFactor,
    totalReturn
  };
}
