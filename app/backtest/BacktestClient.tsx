'use client';

import { useState } from 'react';

export type SymbolOption = { ticker: string };

type Props = {
  symbols: SymbolOption[];
};

type Summary = {
  trades: unknown[];
  winrate: number;
  cagr: number;
  sharpe: number;
  maxDrawdown: number;
  profitFactor: number;
  totalReturn: number;
};

export function BacktestClient({ symbols }: Props) {
  const [symbol, setSymbol] = useState(symbols[0]?.ticker ?? 'AAPL');
  const [params, setParams] = useState({ fast: 9, slow: 21, rsiPeriod: 14, rsiOverbought: 70, rsiOversold: 30 });
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRun = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    const res = await fetch('/api/backtest/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbol, timeframe: '1D', strategy: 'ema_rsi', params })
    });
    const json = await res.json();
    setSummary(json.summary);
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleRun} className="grid gap-3 rounded border border-slate-800 p-4 text-sm">
        <label className="flex flex-col gap-1">
          <span className="text-xs uppercase text-slate-400">Símbolo</span>
          <select value={symbol} onChange={(event) => setSymbol(event.target.value)} className="rounded bg-slate-800 px-2 py-1">
            {symbols.map((option) => (
              <option key={option.ticker}>{option.ticker}</option>
            ))}
          </select>
        </label>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(params).map(([key, value]) => (
            <label key={key} className="flex flex-col gap-1">
              <span className="text-xs uppercase text-slate-400">{key}</span>
              <input
                type="number"
                value={value}
                onChange={(event) => setParams((prev) => ({ ...prev, [key]: Number(event.target.value) }))}
                className="rounded bg-slate-800 px-2 py-1"
              />
            </label>
          ))}
        </div>
        <button type="submit" className="rounded bg-emerald-600 px-3 py-2 font-semibold hover:bg-emerald-500">
          {loading ? 'Calculando...' : 'Run'}
        </button>
      </form>
      {summary && (
        <div className="rounded border border-slate-800 p-4 text-sm">
          <h3 className="text-base font-semibold">Resultados</h3>
          <ul className="mt-2 space-y-1">
            <li>Winrate: {(summary.winrate * 100).toFixed(2)}%</li>
            <li>CAGR: {(summary.cagr * 100).toFixed(2)}%</li>
            <li>Sharpe: {summary.sharpe.toFixed(2)}</li>
            <li>Max Drawdown: {(summary.maxDrawdown * 100).toFixed(2)}%</li>
            <li>Profit Factor: {summary.profitFactor.toFixed(2)}</li>
            <li>Retorno total: {(summary.totalReturn * 100).toFixed(2)}%</li>
          </ul>
          <a
            href={`data:application/json,${encodeURIComponent(JSON.stringify(summary, null, 2))}`}
            download={`backtest-${symbol}.json`}
            className="mt-3 inline-block rounded bg-blue-600 px-3 py-2 text-sm hover:bg-blue-500"
          >
            Descargar JSON
          </a>
        </div>
      )}
    </div>
  );
}
