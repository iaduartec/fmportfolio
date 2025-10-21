'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useWatchlist } from '@/lib/store/useWatchlist';

type Props = {
  symbol: string;
  timeframe: string;
  onImported: (payload: { symbol: string; timeframe: string; imported: number }) => void;
};

type Status =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'success'; message: string }
  | { kind: 'error'; message: string };

export function ImportPricesForm({ symbol, timeframe, onImported }: Props) {
  const watchlist = useWatchlist();
  const [currentSymbol, setCurrentSymbol] = useState(symbol);
  const [currentTimeframe, setCurrentTimeframe] = useState(timeframe);
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<Status>({ kind: 'idle' });

  useEffect(() => {
    setCurrentSymbol(symbol);
  }, [symbol]);

  useEffect(() => {
    setCurrentTimeframe(timeframe);
  }, [timeframe]);

  const options = useMemo(() => watchlist.items.map((item) => item.symbol), [watchlist.items]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) {
      setStatus({ kind: 'error', message: 'Selecciona un archivo CSV.' });
      return;
    }
    setStatus({ kind: 'loading' });

    const formData = new FormData();
    formData.set('symbol', currentSymbol.trim().toUpperCase());
    formData.set('timeframe', currentTimeframe);
    formData.set('file', file);

    try {
      const response = await fetch('/api/prices/import', {
        method: 'POST',
        body: formData
      });
      const payload = await response.json();
      if (!response.ok) {
        const message = typeof payload.error === 'string' ? payload.error : 'No se pudo importar el CSV.';
        setStatus({ kind: 'error', message });
        return;
      }
      onImported({ symbol: currentSymbol.trim().toUpperCase(), timeframe: currentTimeframe, imported: payload.imported });
      setStatus({ kind: 'success', message: `Importadas ${payload.imported} velas.` });
      setFile(null);
    } catch {
      setStatus({ kind: 'error', message: 'Fallo la comunicación con el servidor.' });
    }
  }

  return (
    <div className="rounded border border-slate-800 bg-slate-900 p-3">
      <h3 className="text-sm font-semibold uppercase text-slate-400">Importar CSV de TradingView</h3>
      <form onSubmit={handleSubmit} className="mt-3 space-y-3 text-sm" aria-label="Formulario de importación">
        <label className="flex flex-col gap-1">
          <span className="text-xs uppercase text-slate-500">Símbolo</span>
          <input
            list="import-symbols"
            value={currentSymbol}
            onChange={(event) => setCurrentSymbol(event.target.value)}
            placeholder="Ej. AAPL"
            className="rounded bg-slate-800 px-2 py-1"
            required
          />
          <datalist id="import-symbols">
            {options.map((option) => (
              <option key={option} value={option} />
            ))}
          </datalist>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs uppercase text-slate-500">Timeframe</span>
          <select
            value={currentTimeframe}
            onChange={(event) => setCurrentTimeframe(event.target.value)}
            className="rounded bg-slate-800 px-2 py-1"
          >
            <option value="1D">1D</option>
            <option value="4h">4h</option>
            <option value="1h">1h</option>
            <option value="15m">15m</option>
            <option value="5m">5m</option>
            <option value="1m">1m</option>
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs uppercase text-slate-500">Archivo CSV</span>
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={(event) => {
              const selected = event.target.files?.[0] ?? null;
              setFile(selected);
            }}
            className="text-xs text-slate-300"
            required
          />
        </label>
        <button
          type="submit"
          className="w-full rounded bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={status.kind === 'loading'}
        >
          {status.kind === 'loading' ? 'Importando…' : 'Importar'}
        </button>
        <div className="min-h-[1.5rem] text-xs" aria-live="polite">
          {status.kind === 'success' && <span className="text-emerald-400">{status.message}</span>}
          {status.kind === 'error' && <span className="text-red-400">{status.message}</span>}
        </div>
      </form>
    </div>
  );
}
