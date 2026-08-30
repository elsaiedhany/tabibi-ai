export interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Simple in-memory Rate Limiter
 * @param key Unique key (e.g. IP address + route name)
 * @param limit Maximum allowed requests within window
 * @param windowMs Time window in milliseconds (default 60000ms = 1 minute)
 */
export function checkRateLimit(
  key: string,
  limit: number = 5,
  windowMs: number = 60000
): { allowed: boolean; remaining: number; resetMs: number } {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetMs: windowMs };
  }

  if (record.count >= limit) {
    return { allowed: false, remaining: 0, resetMs: record.resetAt - now };
  }

  record.count += 1;
  rateLimitStore.set(key, record);

  return { allowed: true, remaining: limit - record.count, resetMs: record.resetAt - now };
}

export function resetRateLimit(key: string): void {
  rateLimitStore.delete(key);
}
