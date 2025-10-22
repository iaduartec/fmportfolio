'use client';

import { useEffect, useMemo, useState } from 'react';
import { ImportPricesForm } from '@/components/ImportPricesForm';
import { useWatchlist } from '@/lib/store/useWatchlist';

const DEFAULT_TIMEFRAME = '1D';
const FALLBACK_SYMBOL = 'SPY';

type ImportPayload = { symbol: string; timeframe: string; imported: number };

export function PortfolioSidebar() {
  const watchlist = useWatchlist();
  const symbols = useMemo(() => watchlist.items.map((item) => item.symbol), [watchlist.items]);
  const [lastImportedSymbol, setLastImportedSymbol] = useState<string | null>(null);
  const [lastImportedTimeframe, setLastImportedTimeframe] = useState(DEFAULT_TIMEFRAME);

  useEffect(() => {
    if (lastImportedSymbol) {
      return;
    }
    if (symbols.length > 0) {
      setLastImportedSymbol(symbols[0]);
    }
  }, [symbols, lastImportedSymbol]);

  const handleImported = ({ symbol, timeframe }: ImportPayload) => {
    const normalizedSymbol = symbol.toUpperCase();
    watchlist.add({ symbol: normalizedSymbol });
    setLastImportedSymbol(normalizedSymbol);
    setLastImportedTimeframe(timeframe);
  };

  const currentSymbol = lastImportedSymbol ?? symbols[0] ?? FALLBACK_SYMBOL;

  return (
    <div className="space-y-4">
      <section className="rounded border border-slate-800 bg-slate-900 p-3">
        <h3 className="text-sm font-semibold uppercase text-slate-400">Watchlist de cartera</h3>
        {symbols.length === 0 ? (
          <p className="mt-3 text-xs text-slate-500">No hay símbolos en la watchlist todavía.</p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {symbols.map((symbolItem) => (
              <li
                key={symbolItem}
                className="flex items-center justify-between rounded bg-slate-800 px-2 py-1"
              >
                <span>{symbolItem}</span>
                <button
                  type="button"
                  onClick={() => watchlist.remove(symbolItem)}
                  className="text-xs text-red-400 hover:underline"
                >
                  Quitar
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
      <ImportPricesForm
        symbol={currentSymbol}
        timeframe={lastImportedTimeframe}
        onImported={handleImported}
      />
    </div>
  );
}
