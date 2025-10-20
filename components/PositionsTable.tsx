'use client';

type Position = {
  id: number;
  ticker?: string | null;
  qty: number;
  avgPrice: number;
  marketPrice?: number;
  unrealized?: number;
};

type Props = {
  positions: Position[];
};

export function PositionsTable({ positions }: Props) {
  return (
    <table className="min-w-full text-sm" aria-label="Tabla de posiciones">
      <thead className="bg-slate-800 text-left text-xs uppercase tracking-wide text-slate-400">
        <tr>
          <th className="px-3 py-2">Símbolo</th>
          <th className="px-3 py-2">Cantidad</th>
          <th className="px-3 py-2">Precio Promedio</th>
          <th className="px-3 py-2">Precio Mercado</th>
          <th className="px-3 py-2">PnL Latente</th>
        </tr>
      </thead>
      <tbody>
        {positions.map((position) => (
          <tr key={position.id} className="border-b border-slate-800">
            <td className="px-3 py-2 font-semibold">{position.ticker}</td>
            <td className="px-3 py-2">{position.qty}</td>
            <td className="px-3 py-2">{position.avgPrice.toFixed(2)}</td>
            <td className="px-3 py-2">{position.marketPrice?.toFixed(2) ?? '—'}</td>
            <td className={`px-3 py-2 ${Number(position.unrealized) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {position.unrealized?.toFixed(2) ?? '—'}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
