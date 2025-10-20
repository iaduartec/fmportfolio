'use client';

import { useState } from 'react';

export type AlertInput = {
  symbol: string;
  type: 'price' | 'indicator';
  params: Record<string, unknown>;
};

type Props = {
  symbols: string[];
  onSubmit: (input: AlertInput) => Promise<void>;
};

export function AlertForm({ symbols, onSubmit }: Props) {
  const [symbol, setSymbol] = useState(symbols[0] ?? 'AAPL');
  const [type, setType] = useState<'price' | 'indicator'>('price');
  const [status, setStatus] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload: AlertInput = {
      symbol,
      type,
      params:
        type === 'price'
          ? { operator: form.get('operator'), level: Number(form.get('level')) }
          : { indicator: form.get('indicator'), threshold: Number(form.get('threshold') ?? 70) }
    };
    setStatus('Creando...');
    await onSubmit(payload);
    setStatus('Guardado');
    event.currentTarget.reset();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3" aria-label="Formulario de alertas">
      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-xs uppercase text-slate-400">Símbolo</span>
          <select value={symbol} onChange={(event) => setSymbol(event.target.value)} className="rounded bg-slate-800 px-2 py-1">
            {symbols.map((sym) => (
              <option key={sym}>{sym}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-xs uppercase text-slate-400">Tipo</span>
          <select value={type} onChange={(event) => setType(event.target.value as 'price' | 'indicator')} className="rounded bg-slate-800 px-2 py-1">
            <option value="price">Precio</option>
            <option value="indicator">Indicador</option>
          </select>
        </label>
      </div>
      {type === 'price' ? (
        <div className="grid grid-cols-2 gap-2 text-sm">
          <label className="flex flex-col gap-1">
            <span className="text-xs uppercase text-slate-400">Operador</span>
            <select name="operator" className="rounded bg-slate-800 px-2 py-1">
              <option value=">">Mayor que</option>
              <option value="<">Menor que</option>
              <option value=">=">Mayor o igual</option>
              <option value="<=">Menor o igual</option>
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs uppercase text-slate-400">Nivel</span>
            <input name="level" type="number" step="0.01" required className="rounded bg-slate-800 px-2 py-1" />
          </label>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 text-sm">
          <label className="flex flex-col gap-1">
            <span className="text-xs uppercase text-slate-400">Indicador</span>
            <select name="indicator" className="rounded bg-slate-800 px-2 py-1">
              <option value="ema_cross">Cruce EMA</option>
              <option value="rsi_threshold">RSI mayor que</option>
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs uppercase text-slate-400">Umbral</span>
            <input name="threshold" type="number" step="0.1" defaultValue={70} className="rounded bg-slate-800 px-2 py-1" />
          </label>
        </div>
      )}
      <button type="submit" className="w-full rounded bg-emerald-600 px-3 py-2 text-sm font-semibold hover:bg-emerald-500">
        Guardar alerta
      </button>
      {status && <p className="text-xs text-slate-400">{status}</p>}
    </form>
  );
}
