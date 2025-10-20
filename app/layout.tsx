import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'FM Portfolio',
  description: 'Aplicación estilo TradingView para uso personal'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-slate-950 text-slate-100">
        <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-6">
          <header className="mb-8 flex items-center justify-between">
            <h1 className="text-2xl font-semibold">FM Portfolio</h1>
            <nav className="flex gap-4 text-sm">
              <a className="hover:underline" href="/chart">
                Gráfico
              </a>
              <a className="hover:underline" href="/portfolio">
                Cartera
              </a>
              <a className="hover:underline" href="/alerts">
                Alertas
              </a>
              <a className="hover:underline" href="/backtest">
                Backtest
              </a>
            </nav>
          </header>
          <main className="flex-1 rounded-md bg-slate-900 p-4 shadow-lg">{children}</main>
        </div>
      </body>
    </html>
  );
}
