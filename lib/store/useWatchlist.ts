'use client';

import { create } from 'zustand';

export type WatchItem = { symbol: string; note?: string };

type State = {
  items: WatchItem[];
  add: (item: WatchItem) => void;
  remove: (symbol: string) => void;
};

export const useWatchlist = create<State>((set) => ({
  items: [
    { symbol: 'AAPL' },
    { symbol: 'MSFT' },
    { symbol: 'SPY' }
  ],
  add: (item) =>
    set((state) => ({
      items: state.items.some((i) => i.symbol === item.symbol)
        ? state.items
        : [...state.items, item]
    })),
  remove: (symbol) =>
    set((state) => ({
      items: state.items.filter((item) => item.symbol !== symbol)
    }))
}));
