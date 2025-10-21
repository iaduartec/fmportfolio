'use client';

import type { ReactNode } from 'react';
import type { IndicatorConfig } from './IndicatorPanel';
import type { IndicatorValues } from '@/lib/hooks/useIndicators';

type Props = {
  indicators: IndicatorConfig[];
  values: IndicatorValues;
};

export function IndicatorSummary({ indicators, values }: Props) {
  if (indicators.length === 0) {
    return null;
  }

  return (
    <section className="rounded border border-slate-700 p-4 text-sm" aria-label="Resumen de indicadores">
      <h3 className="text-xs font-semibold uppercase text-slate-400">Indicadores activos</h3>
      <ul className="mt-3 space-y-2" role="list">
        {indicators.map((indicator) => {
          const value = values[indicator.id];
          return (
            <li key={indicator.id} className="rounded bg-slate-900/60 p-3">
              {renderIndicator(indicator, value)}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function renderIndicator(indicator: IndicatorConfig, value: IndicatorValues[string] | undefined): ReactNode {
  const title = getTitle(indicator);

  switch (indicator.name) {
    case 'ema': {
      const latest = findLatestValue(value?.type === 'ema' ? value.series : undefined);
      return (
        <IndicatorBlock title={title} metrics={[{ label: 'Valor', value: formatNumber(latest?.value) }]} />
      );
    }
    case 'rsi': {
      const latest = findLatestValue(value?.type === 'rsi' ? value.series : undefined);
      return (
        <IndicatorBlock title={title} metrics={[{ label: 'Valor', value: formatNumber(latest?.value) }]} />
      );
    }
    case 'macd': {
      if (!value || value.type !== 'macd') {
        return <IndicatorBlock title={title} metrics={[{ label: 'Estado', value: '—' }]} />;
      }
      const macdValue = findLatestValue(value.macd)?.value;
      const signalValue = findLatestValue(value.signal)?.value;
      const histValue = findLatestValue(value.hist)?.value;
      return (
        <IndicatorBlock
          title={title}
          metrics={[
            { label: 'MACD', value: formatNumber(macdValue) },
            { label: 'Señal', value: formatNumber(signalValue) },
            { label: 'Hist', value: formatNumber(histValue) }
          ]}
        />
      );
    }
    case 'vwapAnchored': {
      const latest = findLatestValue(value?.type === 'vwapAnchored' ? value.series : undefined);
      return (
        <IndicatorBlock title={title} metrics={[{ label: 'VWAP', value: formatNumber(latest?.value) }]} />
      );
    }
    case 'supertrend': {
      if (!value || value.type !== 'supertrend') {
        return <IndicatorBlock title={title} metrics={[{ label: 'Estado', value: '—' }]} />;
      }
      const latest = findLatestValue(value.trend);
      const directionIndex = latest?.index ?? value.trend.length - 1;
      const directionValue = value.direction[directionIndex] ?? 1;
      return (
        <IndicatorBlock
          title={title}
          metrics={[
            { label: 'Dirección', value: directionValue === 1 ? 'Alcista' : 'Bajista' },
            { label: 'Nivel', value: formatNumber(latest?.value) }
          ]}
        />
      );
    }
    default:
      return <IndicatorBlock title={title} metrics={[{ label: 'Estado', value: '—' }]} />;
  }
}

type IndicatorBlockProps = {
  title: string;
  metrics: Array<{ label: string; value: string }>;
};

function IndicatorBlock({ title, metrics }: IndicatorBlockProps) {
  return (
    <div>
      <h4 className="font-semibold uppercase tracking-wide text-slate-200">{title}</h4>
      <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1">
        {metrics.map(({ label, value }) => (
          <div key={label} className="flex items-center justify-between gap-2">
            <dt className="text-xs uppercase text-slate-400">{label}</dt>
            <dd className="font-mono text-slate-100">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

type LatestValue = { value: number; index: number } | undefined;

function findLatestValue(series?: number[]): LatestValue {
  if (!series || series.length === 0) {
    return undefined;
  }
  for (let index = series.length - 1; index >= 0; index -= 1) {
    const value = series[index];
    if (typeof value === 'number' && !Number.isNaN(value)) {
      return { value, index };
    }
  }
  return undefined;
}

function formatNumber(value?: number) {
  if (value === undefined || Number.isNaN(value)) {
    return '—';
  }
  if (Math.abs(value) >= 1000) {
    return value.toFixed(0);
  }
  if (Math.abs(value) >= 10) {
    return value.toFixed(2);
  }
  return value.toFixed(4);
}

function getTitle(indicator: IndicatorConfig) {
  switch (indicator.name) {
    case 'ema':
      return `EMA (${indicator.params.period ?? 20})`;
    case 'rsi':
      return `RSI (${indicator.params.period ?? 14})`;
    case 'macd':
      return `MACD (${indicator.params.fast ?? 12}/${indicator.params.slow ?? 26}/${indicator.params.signal ?? 9})`;
    case 'vwapAnchored':
      return 'VWAP Anclado';
    case 'supertrend':
      return `Supertrend (${indicator.params.period ?? 10}, ×${indicator.params.multiplier ?? 3})`;
    default:
      return indicator.name;
  }
}
