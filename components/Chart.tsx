'use client';

import { useEffect, useRef } from 'react';
import { createChart, IChartApi, ISeriesApi } from 'lightweight-charts';

type Candle = { time: number; open: number; high: number; low: number; close: number; volume: number };

type Props = {
  data: Candle[];
};

export function Chart({ data }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    if (!chartRef.current) {
      chartRef.current = createChart(containerRef.current, {
        layout: { background: { color: '#0f172a' }, textColor: '#e2e8f0' },
        width: containerRef.current.clientWidth,
        height: 400
      });
      seriesRef.current = chartRef.current.addCandlestickSeries();
    }

    const chart = chartRef.current;
    function handleResize() {
      if (!containerRef.current || !chart) return;
      chart.applyOptions({ width: containerRef.current.clientWidth });
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!seriesRef.current) return;
    seriesRef.current.setData(
      data.map((bar) => ({
        time: bar.time as number,
        open: bar.open,
        high: bar.high,
        low: bar.low,
        close: bar.close
      }))
    );
  }, [data]);

  return <div ref={containerRef} className="h-[400px] w-full" aria-label="Gráfico de velas" />;
}
