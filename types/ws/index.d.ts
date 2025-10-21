declare module 'ws' {
  import { EventEmitter } from 'events';
  import type { IncomingMessage } from 'http';
  import type { Duplex } from 'stream';

  export interface WebSocket extends EventEmitter {
    readonly readyState: number;
    readonly OPEN: number;
    send(data: string | ArrayBufferLike | ArrayBufferView): void;
    close(code?: number, reason?: string): void;
  }

  export interface WebSocketServerOptions {
    noServer?: boolean;
  }

  export class WebSocketServer extends EventEmitter {
    constructor(options?: WebSocketServerOptions);
    handleUpgrade(
      request: IncomingMessage,
      socket: Duplex,
      head: Buffer,
      callback: (socket: WebSocket, request: IncomingMessage) => void
    ): void;
    clients: Set<WebSocket>;
  }
}
