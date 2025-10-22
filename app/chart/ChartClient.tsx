'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Chart } from '@/components/Chart';
import { IndicatorPanel, IndicatorConfig } from '@/components/IndicatorPanel';
import { IndicatorSummary } from '@/components/IndicatorSummary';
import { ImportPricesForm } from '@/components/ImportPricesForm';
import { useIndicators, type IndicatorRequest } from '@/lib/hooks/useIndicators';
import { useWatchlist } from '@/lib/store/useWatchlist';
import { formatAsUtcDateString } from '@/lib/utils/dates';

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
  fallbackSymbol: string;
  fallbackTimeframe: string;
};

export function ChartClient({
  initialSymbol,
  initialTimeframe,
  initialCandles,
  fallbackSymbol,
  fallbackTimeframe
}: Props) {
  const watchlist = useWatchlist();
  const [symbol, setSymbol] = useState(initialSymbol);
  const [timeframe, setTimeframe] = useState(initialTimeframe);
  const [candles, setCandles] = useState<Candle[]>(initialCandles);
  const [indicators, setIndicators] = useState<IndicatorConfig[]>([]);
  const [anchorIndex, setAnchorIndex] = useState<number>(Math.max(0, initialCandles.length - 50));
  const [newSymbol, setNewSymbol] = useState('');
  const [loadError, setLoadError] = useState<string | null>(null);
  const fallbackAttemptedRef = useRef(false);

  const indicatorRequests = useMemo<IndicatorRequest[]>(() => {
    return indicators
      .map((config) => {
        switch (config.name) {
          case 'ema':
            return {
              id: config.id,
              name: 'ema',
              params: { period: config.params.period ?? 20 }
            } satisfies IndicatorRequest;
          case 'rsi':
            return {
              id: config.id,
              name: 'rsi',
              params: { period: config.params.period ?? 14 }
            } satisfies IndicatorRequest;
          case 'macd':
            return {
              id: config.id,
              name: 'macd',
              params: {
                fast: config.params.fast ?? 12,
                slow: config.params.slow ?? 26,
                signal: config.params.signal ?? 9
              }
            } satisfies IndicatorRequest;
          case 'vwapAnchored':
            return {
              id: config.id,
              name: 'vwapAnchored',
              params: { anchorIndex }
            } satisfies IndicatorRequest;
          case 'supertrend':
            return {
              id: config.id,
              name: 'supertrend',
              params: {
                period: config.params.period ?? 10,
                multiplier: config.params.multiplier ?? 3
              }
            } satisfies IndicatorRequest;
          default:
            return undefined;
        }
      })
      .filter((request): request is IndicatorRequest => Boolean(request));
  }, [indicators, anchorIndex]);

  const indicatorValues = useIndicators(
    candles.map((candle) => ({ ...candle })),
    indicatorRequests
  );

  const loadCandles = useCallback(
    async (targetSymbol: string, targetTimeframe: string) => {
      const to = new Date();
      const from = new Date(to.getTime() - 1000 * 60 * 60 * 24 * 60);

      const searchParams = new URLSearchParams({
        symbol: targetSymbol,
        timeframe: targetTimeframe,
        from: from.toISOString(),
        to: to.toISOString()
      });

      const isFallbackTarget =
        targetSymbol === fallbackSymbol && targetTimeframe === fallbackTimeframe;

      const fetchCandles = async () => {
        const response = await fetch(`/api/quotes?${searchParams.toString()}`);
        if (!response.ok) {
          throw new Error('No se pudieron obtener velas');
        }
        return (await response.json()) as Candle[];
      };

      try {
        let fetchedCandles = await fetchCandles();

        if (fetchedCandles.length === 0) {
          // [Inferencia] Intentamos llenar la cache con datos recientes de FMP cuando aun no hay velas locales.
          const refreshResponse = await fetch('/api/symbols/refresh', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              symbol: targetSymbol,
              timeframe: targetTimeframe,
              start: formatAsUtcDateString(from),
              end: formatAsUtcDateString(to)
            })
          });

          if (refreshResponse.ok) {
            fetchedCandles = await fetchCandles();
          }
        }

        if (fetchedCandles.length === 0) {
          if (!isFallbackTarget && !fallbackAttemptedRef.current) {
            fallbackAttemptedRef.current = true;
            setLoadError(
              `No se encontraron velas para ${targetSymbol} en ${targetTimeframe}. Mostrando ${fallbackSymbol} en ${fallbackTimeframe} por defecto.`
            );
            setSymbol(fallbackSymbol);
            setTimeframe(fallbackTimeframe);
            return;
          }

          fallbackAttemptedRef.current = false;
          setCandles([]);
          setLoadError(`No se encontraron velas para ${targetSymbol} en ${targetTimeframe}.`);
        } else {
          fallbackAttemptedRef.current = false;
          setLoadError(null);
          setCandles(fetchedCandles.map((candle) => ({ ...candle })));
        }
      } catch (error) {
        console.error('Error cargando velas', error);
        fallbackAttemptedRef.current = false;
        setCandles([]);
        setLoadError('No se pudieron cargar velas. Revisa la conexión o intenta con otro símbolo.');
      }
    },
    [fallbackSymbol, fallbackTimeframe]
  );

  useEffect(() => {
    loadCandles(symbol, timeframe);
  }, [symbol, timeframe, loadCandles]);

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

  const handleImportCompleted = (payload: { symbol: string; timeframe: string; imported: number }) => {
    const normalizedSymbol = payload.symbol.toUpperCase();
    if (!watchlist.items.some((item) => item.symbol === normalizedSymbol)) {
      watchlist.add({ symbol: normalizedSymbol });
    }
    setSymbol(normalizedSymbol);
    setTimeframe(payload.timeframe);
    void loadCandles(normalizedSymbol, payload.timeframe);
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
      <div>
        <div className="mb-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm">
            <label className="flex flex-col gap-1">
              <span className="text-xs uppercase text-slate-400">Simbolo</span>
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
        <div className="space-y-2">
          <Chart data={chartData} />
          {loadError ? (
            <p className="text-xs text-red-400">{loadError}</p>
          ) : (
            <p className="text-xs text-slate-500">Mostrando {candles.length} velas.</p>
          )}
        </div>
      </div>
      <div className="space-y-4">
        <IndicatorPanel indicators={indicators} onChange={setIndicators} />
        <IndicatorSummary indicators={indicators} values={indicatorValues} />
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
              Anadir
            </button>
          </form>
          <ul className="mt-2 space-y-1 text-sm">
            {watchlist.items.map((item) => (
              <li key={item.symbol} className="flex items-center justify-between rounded bg-slate-800 px-2 py-1">
                <span>{item.symbol}</span>
                <button onClick={() => watchlist.remove(item.symbol)} className="text-xs text-red-400 hover:underline">
                  Quitar
                </button>
              </li>
            ))}
          </ul>
        </div>
        <ImportPricesForm
          symbol={symbol}
          timeframe={timeframe}
          onImported={({ symbol: importedSymbol, timeframe: importedTimeframe, imported }) =>
            handleImportCompleted({ symbol: importedSymbol, timeframe: importedTimeframe, imported })
          }
        />
      </div>
    </div>
  );
}
