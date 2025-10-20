const requests: Map<string, { count: number; reset: number }> = new Map();

export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const record = requests.get(key);
  if (!record || record.reset < now) {
    requests.set(key, { count: 1, reset: now + windowMs });
    return { success: true } as const;
  }

  if (record.count >= limit) {
    return { success: false, retryAfter: Math.ceil((record.reset - now) / 1000) } as const;
  }

  record.count += 1;
  return { success: true } as const;
}
