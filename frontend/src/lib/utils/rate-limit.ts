import { LRUCache } from 'lru-cache';

interface RateLimitOptions {
  uniqueTokenPerInterval?: number;
  interval?: number;
}

export class RateLimit {
  private tokenCache: LRUCache<string, number[]>;

  constructor({ uniqueTokenPerInterval = 500, interval = 60000 }: RateLimitOptions = {}) {
    this.tokenCache = new LRUCache({
      max: uniqueTokenPerInterval,
      ttl: interval,
    });
  }

  async check(key: string, limit: number, duration: string) {
    const durationInMs = ms(duration);
    const tokenCount = this.tokenCache.get(key) || [0];
    const now = Date.now();
    const windowStart = now - durationInMs;

    tokenCount[0] = tokenCount.filter((timestamp: number) => timestamp > windowStart).length;

    if (tokenCount[0] >= limit) {
      throw new Error('Rate limit exceeded');
    }

    tokenCount.push(now);
    this.tokenCache.set(key, tokenCount);
  }
}

// Helper function to convert duration string to milliseconds
function ms(duration: string): number {
  const match = duration.match(/^(\d+)(ms|s|m|h|d)$/);
  if (!match) throw new Error('Invalid duration format');

  const value = parseInt(match[1], 10);
  const unit = match[2];

  const units: { [key: string]: number } = {
    ms: 1,
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  return value * units[unit];
}

export const rateLimit = new RateLimit();
