import type { IncomingMessage } from 'http';
import { parse, type UrlWithParsedQuery } from 'url';

function normalizeProtocol(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return normalizeProtocol(value[0]);
  }
  if (!value) {
    return undefined;
  }
  return value.endsWith(':') ? value : `${value}:`;
}

export function buildParsedUrl(req: IncomingMessage): UrlWithParsedQuery | undefined {
  const forwardedProto = normalizeProtocol(req.headers['x-forwarded-proto']);

  if (!req.url || !forwardedProto) {
    return undefined;
  }

  const parsed = parse(req.url, true);
  parsed.protocol = forwardedProto;
  parsed.slashes = true;

  return parsed;
}
