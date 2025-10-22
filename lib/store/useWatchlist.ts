'use client';

import { create } from 'zustand';

export type WatchItem = { symbol: string; note?: string };

export const DEFAULT_WATCHLIST_ITEMS: WatchItem[] = [
  // [Inferencia] Utilizamos ETF e índices líquidos para representar los mercados pedidos.
  { symbol: 'SPY' }, // S&P 500
  { symbol: 'IBEX' }, // IBEX 35
  { symbol: 'NYA' }, // NYSE Composite
  { symbol: 'QQQ' }, // NASDAQ 100
  { symbol: 'GLD' } // Oro
];

type State = {
  items: WatchItem[];
  add: (item: WatchItem) => void;
  remove: (symbol: string) => void;
};

export const useWatchlist = create<State>((set) => ({
  items: [...DEFAULT_WATCHLIST_ITEMS],
  add: (item) =>
    set((state) => ({
      items: state.items.some((i) => i.symbol === item.symbol)
        ? state.items
        : [...state.items, item]
    })),
  remove: (symbol) =>
    set((state) => ({
      items: state.items.filter((watchItem) => watchItem.symbol !== symbol)
    }))
}));
