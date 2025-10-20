import { WebSocketServer } from 'ws';
import http from 'http';

export type AlertPayload = {
  type: 'alert';
  data: {
    id: number;
    symbol: string;
    message: string;
    triggeredAt: number;
  };
};

let wss: WebSocketServer | undefined;

export function getWebSocketServer(server: http.Server) {
  if (!wss) {
    wss = new WebSocketServer({ noServer: true });
    server.on('upgrade', (request, socket, head) => {
      if (request.url !== '/ws') {
        socket.destroy();
        return;
      }
      wss?.handleUpgrade(request, socket, head, (ws) => {
        wss?.emit('connection', ws, request);
      });
    });
  }
  return wss;
}

export function sendAlert(payload: AlertPayload) {
  if (!wss) return;
  const message = JSON.stringify(payload);
  wss.clients.forEach((client) => {
    if (client.readyState === client.OPEN) {
      client.send(message);
    }
  });
}
