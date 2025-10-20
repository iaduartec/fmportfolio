'use client';

import { useEffect, useMemo, useState } from 'react';
import { Chart } from '@/components/Chart';
import { IndicatorPanel, IndicatorConfig } from '@/components/IndicatorPanel';
import { useWatchlist } from '@/lib/store/useWatchlist';
import { useIndicators } from '@/lib/hooks/useIndicators';

export type Candle = {
  ts: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

type Props = {
  initialSymbol: string;
  initialTimeframe: string;
  initialCandles: Candle[];
};

type IndicatorRequest = {
  name: IndicatorConfig['name'];
  params: Record<string, number>;
};

export function ChartClient({ initialSymbol, initialTimeframe, initialCandles }: Props) {
  const watchlist = useWatchlist();
  const [symbol, setSymbol] = useState(initialSymbol);
  const [timeframe, setTimeframe] = useState(initialTimeframe);
  const [candles, setCandles] = useState<Candle[]>(initialCandles);
  const [indicators, setIndicators] = useState<IndicatorConfig[]>([]);
  const [anchorIndex, setAnchorIndex] = useState<number>(Math.max(0, initialCandles.length - 50));
  const [newSymbol, setNewSymbol] = useState('');

  const indicatorRequests: IndicatorRequest[] = useMemo(
    () =>
      indicators.map((config) => {
        if (config.name === 'vwapAnchored') {
          return { name: config.name, params: { ...config.params, anchorIndex } };
        }
        return { name: config.name, params: config.params };
      }),
    [indicators, anchorIndex]
  );

  useIndicators(
    candles.map((c) => ({ ...c })),
    indicatorRequests
  );

  useEffect(() => {
    async function fetchCandles() {
      const to = new Date();
      const from = new Date(to.getTime() - 1000 * 60 * 60 * 24 * 60);
      const res = await fetch(
        `/api/quotes?symbol=${symbol}&timeframe=${timeframe}&from=${from.toISOString()}&to=${to.toISOString()}`
      );
      const json = await res.json();
      setCandles(json.map((c: Candle) => ({ ...c })));
    }
    fetchCandles();
  }, [symbol, timeframe]);

  const chartData = candles.map((candle) => ({
    time: candle.ts,
    open: candle.open,
    high: candle.high,
    low: candle.low,
    close: candle.close,
    volume: candle.volume
  }));

  const handleAddSymbol = (event: React.FormEvent) => {
    event.preventDefault();
    if (!newSymbol) return;
    watchlist.add({ symbol: newSymbol.toUpperCase() });
    setNewSymbol('');
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
      <div>
        <div className="mb-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm">
            <label className="flex flex-col gap-1">
              <span className="text-xs uppercase text-slate-400">Símbolo</span>
              <select
                value={symbol}
                onChange={(event) => setSymbol(event.target.value)}
                className="rounded bg-slate-800 px-2 py-1"
              >
                {watchlist.items.map((item) => (
                  <option key={item.symbol}>{item.symbol}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs uppercase text-slate-400">Timeframe</span>
              <select
                value={timeframe}
                onChange={(event) => setTimeframe(event.target.value)}
                className="rounded bg-slate-800 px-2 py-1"
              >
                <option value="1D">1D</option>
                <option value="4h">4h</option>
                <option value="1h">1h</option>
                <option value="15m">15m</option>
              </select>
            </label>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>VWAP anchor:</span>
            <input
              type="range"
              min={0}
              max={Math.max(0, candles.length - 1)}
              value={anchorIndex}
              onChange={(event) => setAnchorIndex(Number(event.target.value))}
            />
          </div>
        </div>
        <Chart data={chartData} />
      </div>
      <div className="space-y-4">
        <IndicatorPanel indicators={indicators} onChange={setIndicators} />
        <div>
          <h3 className="text-sm font-semibold uppercase text-slate-400">Watchlist</h3>
          <form onSubmit={handleAddSymbol} className="mt-2 flex gap-2 text-sm">
            <input
              value={newSymbol}
              onChange={(event) => setNewSymbol(event.target.value)}
              placeholder="Ticker"
              className="flex-1 rounded bg-slate-800 px-2 py-1"
            />
            <button type="submit" className="rounded bg-blue-600 px-3 py-1 hover:bg-blue-500">
              Añadir
            </button>
          </form>
          <ul className="mt-2 space-y-1 text-sm">
            {watchlist.items.map((item) => (
              <li key={item.symbol} className="flex items-center justify-between rounded bg-slate-800 px-2 py-1">
                <span>{item.symbol}</span>
                <button
                  onClick={() => watchlist.remove(item.symbol)}
                  className="text-xs text-red-400 hover:underline"
                >
                  Quitar
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
