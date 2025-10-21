'use client';

import { useEffect, useRef } from 'react';
import { createChart, IChartApi, ISeriesApi, type UTCTimestamp } from 'lightweight-charts';

type Candle = { time: number; open: number; high: number; low: number; close: number; volume: number };

type Props = {
  data: Candle[];
};

const toUtcTimestamp = (value: number): UTCTimestamp => Math.floor(value) as UTCTimestamp;

export function Chart({ data }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const getWidth = () => container.clientWidth || container.getBoundingClientRect().width || 0;
    const getHeight = () => container.clientHeight || 400;

    const chart = createChart(container, {
      layout: { background: { color: '#0f172a' }, textColor: '#e2e8f0' },
      width: getWidth(),
      height: getHeight()
    });

    chartRef.current = chart;
    seriesRef.current = chart.addCandlestickSeries();

    const updateSize = () => {
      if (!chartRef.current) return;
      const width = getWidth();
      const height = getHeight();
      if (width > 0) {
        chartRef.current.applyOptions({ width, height });
      }
    };

    let resizeObserver: ResizeObserver | undefined;
    let cleanupWindow: (() => void) | undefined;

    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        updateSize();
        chart.timeScale().fitContent();
      });
      resizeObserver.observe(container);
    } else {
      const handleResize = () => {
        updateSize();
        chart.timeScale().fitContent();
      };
      window.addEventListener('resize', handleResize);
      cleanupWindow = () => window.removeEventListener('resize', handleResize);
    }

    requestAnimationFrame(() => {
      updateSize();
      chart.timeScale().fitContent();
    });

    return () => {
      resizeObserver?.disconnect();
      cleanupWindow?.();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!seriesRef.current) return;
    const nextData = data.map((bar) => ({
      time: toUtcTimestamp(bar.time),
      open: bar.open,
      high: bar.high,
      low: bar.low,
      close: bar.close
    }));
    seriesRef.current.setData(nextData);
    chartRef.current?.timeScale().fitContent();
  }, [data]);

  return <div ref={containerRef} className="h-[400px] w-full" aria-label="Grafico de velas" />;
}
