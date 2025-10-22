import type { IncomingMessage } from 'http';
import type { ParsedUrlQuery } from 'querystring';
import type { UrlWithParsedQuery } from 'url';

function normalizeProtocol(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return normalizeProtocol(value[0]);
  }
  if (!value) {
    return undefined;
  }
  return value.endsWith(':') ? value : `${value}:`;
}

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

function normalizeHost(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return normalizeHost(value[0]);
  }
  if (!value) {
    return undefined;
  }

  return value.split(',')[0]?.trim();
}

export function buildParsedUrl(req: IncomingMessage): UrlWithParsedQuery | undefined {
  const forwardedProto = normalizeProtocol(req.headers['x-forwarded-proto']);

  if (!req.url || !forwardedProto) {
    return undefined;
  }

  const forwardedHost = normalizeHost(req.headers['x-forwarded-host']);
  const hostHeader = forwardedHost ?? normalizeHost(req.headers.host) ?? 'localhost:3000';
  const url = new URL(req.url, `${forwardedProto}//${hostHeader}`);
  const query = toParsedQuery(url);

  return {
    href: url.href,
    protocol: url.protocol,
    slashes: true,
    auth: null,
    host: url.host,
    port: url.port || null,
    hostname: url.hostname,
    hash: url.hash || null,
    search: url.search || null,
    pathname: url.pathname,
    path: `${url.pathname}${url.search}`,
    query
  } satisfies UrlWithParsedQuery;
}
