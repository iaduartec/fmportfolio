import next from 'next';
import { createServer, type IncomingMessage } from 'http';
import type { ParsedUrlQuery } from 'querystring';
import type { UrlWithParsedQuery } from 'url';
import { getWebSocketServer } from './lib/ws';
import { runMigrations } from './lib/db';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = Number(process.env.PORT ?? 3000);
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

function toParsedQuery(url: URL): ParsedUrlQuery {
  const query: ParsedUrlQuery = {};

  url.searchParams.forEach((value, key) => {
    const current = query[key];

    if (current === undefined) {
      query[key] = value;
    } else if (Array.isArray(current)) {
      current.push(value);
    } else {
      query[key] = [current, value];
    }
  });

  return query;
}

function buildParsedUrl(req: IncomingMessage): UrlWithParsedQuery | undefined {
  if (!req.url) {
    return undefined;
  }

  const protocol = (req.headers['x-forwarded-proto'] as string | undefined) ?? 'http';
  const hostHeader = req.headers.host ?? `${hostname}:${port}`;
  const url = new URL(req.url, `${protocol}://${hostHeader}`);
  const query = toParsedQuery(url);

  return {
    href: url.href,
    protocol: url.protocol,
    slashes: true,
    auth: null,
    host: url.host,
    port: url.port,
    hostname: url.hostname,
    hash: url.hash || null,
    search: url.search || null,
    pathname: url.pathname,
    path: `${url.pathname}${url.search}`,
    query,
  };
}

async function bootstrap() {
  await runMigrations();
  await app.prepare();
  const server = createServer((req, res) => {
    const parsedUrl = buildParsedUrl(req);
    handle(req, res, parsedUrl);
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
