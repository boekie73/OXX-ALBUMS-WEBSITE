import { createHmac, randomBytes } from 'node:crypto';

/** Single-process limit only. Use a shared limiter at production scale. No IP logging. */
export function createRateLimiter({ limit = 5, windowMs = 60_000, capacity = 10_000, now = Date.now } = {}) {
  if (![limit, windowMs, capacity].every(n => Number.isSafeInteger(n) && n > 0)) throw new Error('invalid_rate_limit');
  const key = randomBytes(32);
  const entries = new Map();
  return {
    consume(address) {
      const time = now();
      for (const [id, value] of entries) if (value.until <= time) entries.delete(id);
      const id = createHmac('sha256', key).update(address || 'unknown').digest('hex');
      let entry = entries.get(id);
      if (!entry) {
        if (entries.size >= capacity) return false; // fail closed; do not evict active limits
        entry = { count: 0, until: time + windowMs }; entries.set(id, entry);
      }
      return ++entry.count <= limit;
    },
  };
}
