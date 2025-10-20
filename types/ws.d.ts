import type { IncomingMessage } from 'http';
import type { Duplex } from 'stream';
import type { EventEmitter } from 'events';

declare module 'ws' {
  export interface WebSocket extends EventEmitter {
    readonly readyState: number;
    readonly OPEN: number;
    send(data: string | ArrayBufferLike | ArrayBufferView | Buffer | Buffer[], cb?: (err?: Error) => void): void;
    close(code?: number, reason?: string): void;
  }

  export interface WebSocketServerOptions {
    noServer?: boolean;
  }

  export class WebSocketServer extends EventEmitter {
    constructor(options?: WebSocketServerOptions);
    clients: Set<WebSocket>;
    handleUpgrade(
      request: IncomingMessage,
      socket: Duplex,
      head: Buffer,
      callback: (socket: WebSocket, request: IncomingMessage) => void
    ): void;
  }
}
