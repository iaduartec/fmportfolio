'use client';

import { useEffect, useState } from 'react';
import { AlertForm, AlertInput } from '@/components/AlertForm';

export type AlertRecord = {
  id: number;
  symbolId: number;
  type: 'price' | 'indicator';
  params: Record<string, unknown>;
  isActive: number;
  lastTriggeredAt?: number | null;
};

type Props = {
  alerts: AlertRecord[];
  symbols: string[];
};

type FeedItem = {
  message: string;
  triggeredAt: number;
  symbol: string;
};

export function AlertsClient({ alerts: initialAlerts, symbols }: Props) {
  const [alerts, setAlerts] = useState(initialAlerts);
  const [feed, setFeed] = useState<FeedItem[]>([]);

  useEffect(() => {
    const protocol = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'wss' : 'ws';
    const host = typeof window !== 'undefined' ? window.location.host : 'localhost:3000';
    const ws = new WebSocket(`${protocol}://${host}/ws`);
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'alert') {
        setFeed((prev) => [{ message: data.data.message, triggeredAt: data.data.triggeredAt, symbol: data.data.symbol }, ...prev]);
      }
    };
    return () => ws.close();
  }, []);

  const handleSubmit = async (payload: AlertInput) => {
    const res = await fetch('/api/alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    setAlerts((prev) => [...prev, json]);
  };

  const toggleAlert = async (id: number, isActive: boolean) => {
    const res = await fetch(`/api/alerts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive })
    });
    const json = await res.json();
    setAlerts((prev) => prev.map((alert) => (alert.id === id ? json : alert)));
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
      <div className="space-y-4">
        <AlertForm symbols={symbols} onSubmit={handleSubmit} />
        <div className="rounded border border-slate-800 p-4 text-sm">
          <h3 className="text-base font-semibold">Alertas activas</h3>
          <ul className="mt-3 space-y-2">
            {alerts.map((alert) => (
              <li key={alert.id} className="flex items-center justify-between rounded bg-slate-800 px-3 py-2">
                <span>
                  #{alert.id} · {alert.type}
                </span>
                <button
                  onClick={() => toggleAlert(alert.id, !alert.isActive)}
                  className="text-xs text-blue-400 hover:underline"
                >
                  {alert.isActive ? 'Desactivar' : 'Activar'}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="rounded border border-slate-800 p-4 text-sm">
        <h3 className="text-base font-semibold">Feed en tiempo real</h3>
        <ul className="mt-3 space-y-2">
          {feed.map((item, index) => (
            <li key={index} className="rounded bg-slate-900 px-3 py-2">
              <p className="font-semibold">{item.symbol}</p>
              <p>{item.message}</p>
              <p className="text-xs text-slate-500">{new Date(item.triggeredAt * 1000).toLocaleString()}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
