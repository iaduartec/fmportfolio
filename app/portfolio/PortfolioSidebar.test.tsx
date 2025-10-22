import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/components/ImportPricesForm', () => ({
  ImportPricesForm: ({ onImported }: { onImported: (payload: { symbol: string; timeframe: string; imported: number }) => void }) => (
    <button type="button" onClick={() => onImported({ symbol: 'TSLA', timeframe: '1D', imported: 10 })}>
      Mock importar
    </button>
  )
}));

import { PortfolioSidebar } from './PortfolioSidebar';
import { DEFAULT_WATCHLIST_ITEMS, useWatchlist } from '@/lib/store/useWatchlist';

describe('PortfolioSidebar', () => {
  beforeAll(() => {
    (globalThis as typeof globalThis & { React?: typeof React }).React = React;
  });

  beforeEach(() => {
    useWatchlist.setState({ items: [...DEFAULT_WATCHLIST_ITEMS] });
  });

  it('agrega el simbolo importado a la watchlist', () => {
    render(<PortfolioSidebar />);

    expect(screen.getByText('SPY')).toBeTruthy();

    const importButton = screen.getByRole('button', { name: 'Mock importar' });
    fireEvent.click(importButton);

    expect(screen.getByText('TSLA')).toBeTruthy();
  });
});
