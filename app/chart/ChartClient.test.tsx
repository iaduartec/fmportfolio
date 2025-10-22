import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Mock } from 'vitest';

vi.mock('@/components/Chart', () => ({
  Chart: () => null
}));

vi.mock('@/components/IndicatorPanel', () => ({
  IndicatorPanel: () => null
}));

vi.mock('@/components/IndicatorSummary', () => ({
  IndicatorSummary: () => null
}));

vi.mock('@/components/ImportPricesForm', () => ({
  ImportPricesForm: () => null
}));

vi.mock('@/lib/hooks/useIndicators', () => ({
  useIndicators: () => ({})
}));

import { ChartClient } from './ChartClient';

type JsonResponse = { ok: boolean; json: () => Promise<unknown> };
type FetchMock = Mock<[RequestInfo | URL, RequestInit | undefined], Promise<JsonResponse>>;

const originalFetch = global.fetch;

describe('ChartClient', () => {
  let fetchMock: FetchMock;

  beforeAll(() => {
    (globalThis as typeof globalThis & { React?: typeof React }).React = React;
  });

  beforeEach(() => {
    const fallbackCandles = [
      { ts: 1, open: 1, high: 1, low: 1, close: 1, volume: 10 },
      { ts: 2, open: 2, high: 2, low: 2, close: 2, volume: 20 }
    ];

    fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url =
        typeof input === 'string'
          ? input
          : input instanceof URL
          ? input.toString()
          : input instanceof Request
          ? input.url
          : '';

      if (url.startsWith('/api/quotes?') && url.includes('symbol=MSFT')) {
        return { ok: true, json: async () => [] } satisfies JsonResponse;
      }

      if (url === '/api/symbols/refresh') {
        return { ok: true, json: async () => ({ refreshed: true }) } satisfies JsonResponse;
      }

      if (url.startsWith('/api/quotes?') && url.includes('symbol=SPY')) {
        return { ok: true, json: async () => fallbackCandles } satisfies JsonResponse;
      }

      return { ok: false, json: async () => ({}) } satisfies JsonResponse;
    }) as FetchMock;

    global.fetch = fetchMock as unknown as typeof fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.clearAllMocks();
  });

  it('muestra el activo por defecto cuando faltan velas para el símbolo seleccionado', async () => {
    render(
      <ChartClient
        initialSymbol="MSFT"
        initialTimeframe="1D"
        initialCandles={[]}
        fallbackSymbol="SPY"
        fallbackTimeframe="1D"
      />
    );

    await waitFor(() => {
      expect(
        fetchMock.mock.calls.some(([input]) =>
          typeof input === 'string' ? input.includes('symbol=SPY') : false
        )
      ).toBe(true);
    });

    await waitFor(() => {
      const symbolSelect = screen.getByLabelText('Simbolo') as HTMLSelectElement;
      expect(symbolSelect.value).toBe('SPY');
    });

    const summary = await screen.findByText('Mostrando 2 velas.');
    expect(summary).toBeTruthy();
  });
});
