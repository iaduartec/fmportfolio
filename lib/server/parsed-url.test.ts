import type { IncomingMessage } from 'http';
import { describe, expect, it } from 'vitest';
import { buildParsedUrl } from './parsed-url';

describe('buildParsedUrl', () => {
  const createRequest = (overrides: Partial<IncomingMessage>): IncomingMessage => {
    return {
      headers: {} as IncomingMessage['headers'],
      method: 'GET',
      ...overrides
    } as unknown as IncomingMessage;
  };

  it('devuelve undefined cuando no se especifica x-forwarded-proto', () => {
    const req = createRequest({
      url: '/chart?foo=bar',
      headers: { host: 'localhost:3000' } as IncomingMessage['headers']
    });

    expect(buildParsedUrl(req)).toBeUndefined();
  });

  it('respeta encabezados x-forwarded-proto para reconstruir la url', () => {
    const req = createRequest({
      url: '/chart',
      headers: {
        host: 'internal.local:8080',
        'x-forwarded-host': 'example.com',
        'x-forwarded-proto': 'https'
      } as IncomingMessage['headers']
    });

    const parsed = buildParsedUrl(req);

    expect(parsed?.protocol).toBe('https:');
    expect(parsed?.slashes).toBe(true);
    expect(parsed?.pathname).toBe('/chart');
    expect(parsed?.host).toBe('example.com');
    expect(parsed?.hostname).toBe('example.com');
  });

  it('devuelve undefined si falta la url original', () => {
    const req = createRequest({ url: undefined });

    expect(buildParsedUrl(req)).toBeUndefined();
  });

  it('usa el encabezado host cuando no hay x-forwarded-host', () => {
    const req = createRequest({
      url: '/overview',
      headers: {
        host: 'charts.fm:4000',
        'x-forwarded-proto': 'https'
      } as IncomingMessage['headers']
    });

    const parsed = buildParsedUrl(req);

    expect(parsed?.host).toBe('charts.fm:4000');
    expect(parsed?.protocol).toBe('https:');
  });
});
