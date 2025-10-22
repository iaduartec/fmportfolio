import next from 'next';
import { createServer } from 'http';
import type { UrlWithParsedQuery } from 'url';
import { getWebSocketServer } from './lib/ws';
import { runMigrations } from './lib/db';
import { buildParsedUrl } from './lib/server/parsed-url';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = Number(process.env.PORT ?? 3000);
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

async function bootstrap() {
  await runMigrations();
  await app.prepare();
  const server = createServer((req, res) => {
    const parsedUrl = buildParsedUrl(req);
    if (parsedUrl) {
      handle(req, res, parsedUrl);
    } else {
      handle(req, res);
    }
  });

  getWebSocketServer(server);

  server.listen(port, () => {
    console.log(`> Server ready on http://${hostname}:${port}`);
  });
}

bootstrap().catch((error) => {
  console.error('Error iniciando el servidor', error);
  process.exit(1);
});
