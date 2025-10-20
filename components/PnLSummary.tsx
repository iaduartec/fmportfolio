'use client';

type Props = {
  daily: number;
  unrealized: number;
};

export function PnLSummary({ daily, unrealized }: Props) {
  return (
    <div className="rounded border border-slate-700 p-4 text-sm">
      <h3 className="text-base font-semibold">Resumen PnL</h3>
      <div className="mt-2 space-y-1">
        <p className={daily >= 0 ? 'text-emerald-400' : 'text-red-400'}>PnL Diario: {daily.toFixed(2)}</p>
        <p className={unrealized >= 0 ? 'text-emerald-400' : 'text-red-400'}>
          PnL Latente: {unrealized.toFixed(2)}
        </p>
      </div>
    </div>
  );
}
