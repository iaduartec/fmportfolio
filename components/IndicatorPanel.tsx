'use client';

import { useState } from 'react';

export type IndicatorConfig = {
  id: string;
  name: 'ema' | 'rsi' | 'macd' | 'vwapAnchored' | 'supertrend';
  params: Record<string, number>;
};

type Props = {
  indicators: IndicatorConfig[];
  onChange: (indicators: IndicatorConfig[]) => void;
};

const indicatorDefaults: Record<IndicatorConfig['name'], Record<string, number>> = {
  ema: { period: 20 },
  rsi: { period: 14 },
  macd: { fast: 12, slow: 26, signal: 9 },
  vwapAnchored: { anchorIndex: 0 },
  supertrend: { period: 10, multiplier: 3 }
};

export function IndicatorPanel({ indicators, onChange }: Props) {
  const [selected, setSelected] = useState<IndicatorConfig['name']>('ema');

  const handleAdd = () => {
    const id = `${selected}-${Date.now()}`;
    onChange([...indicators, { id, name: selected, params: indicatorDefaults[selected] }]);
  };

  const handleParamChange = (id: string, key: string, value: number) => {
    onChange(indicators.map((ind) => (ind.id === id ? { ...ind, params: { ...ind.params, [key]: value } } : ind)));
  };

  const handleRemove = (id: string) => {
    onChange(indicators.filter((ind) => ind.id !== id));
  };

  return (
    <div className="space-y-4" aria-label="Panel de indicadores">
      <div className="flex items-center gap-2">
        <select
          value={selected}
          onChange={(event) => setSelected(event.target.value as IndicatorConfig['name'])}
          className="rounded bg-slate-800 px-2 py-1 text-sm"
        >
          <option value="ema">EMA</option>
          <option value="rsi">RSI</option>
          <option value="macd">MACD</option>
          <option value="vwapAnchored">VWAP Anclado</option>
          <option value="supertrend">Supertrend</option>
        </select>
        <button onClick={handleAdd} className="rounded bg-blue-600 px-3 py-1 text-sm hover:bg-blue-500">
          Añadir
        </button>
      </div>
      <div className="space-y-3">
        {indicators.map((indicator) => (
          <div key={indicator.id} className="rounded border border-slate-700 p-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="font-semibold uppercase">{indicator.name}</span>
              <button onClick={() => handleRemove(indicator.id)} className="text-red-400 hover:underline">
                Quitar
              </button>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {Object.entries(indicator.params).map(([key, value]) => (
                <label key={key} className="flex flex-col gap-1">
                  <span className="text-xs uppercase text-slate-400">{key}</span>
                  <input
                    type="number"
                    value={value}
                    onChange={(event) => handleParamChange(indicator.id, key, Number(event.target.value))}
                    className="rounded bg-slate-800 px-2 py-1"
                  />
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
