/**
 * Simple in-memory per-key rate limiter.
 * For single-instance deployments; use Redis for multi-instance.
 */
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

export class RateLimiter {
  private store = new Map<string, RateLimitEntry>();
  private readonly windowMs: number;
  private readonly max: number;

  constructor({ windowMs, max }: { windowMs: number; max: number }) {
    this.windowMs = windowMs;
    this.max = max;

    // Automatic cleanup of expired entries every 60s
    const cleanup = setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.store) {
        if (now >= entry.resetAt) this.store.delete(key);
      }
    }, 60_000);
    // Don't prevent process exit
    if (cleanup.unref) cleanup.unref();
  }

  check(key: string): { limited: boolean; remaining: number } {
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry || now >= entry.resetAt) {
      this.store.set(key, { count: 1, resetAt: now + this.windowMs });
      return { limited: false, remaining: this.max - 1 };
    }

    entry.count++;
    if (entry.count > this.max) {
      return { limited: true, remaining: 0 };
    }
    return { limited: false, remaining: this.max - entry.count };
  }
}

// Pre-configured limiters for critical endpoints
export const chatLimiter = new RateLimiter({ windowMs: 60_000, max: 20 });
export const syncLimiter = new RateLimiter({ windowMs: 60_000, max: 5 });
export const previewLimiter = new RateLimiter({ windowMs: 60_000, max: 15 });
export const imageLimiter = new RateLimiter({ windowMs: 60_000, max: 60 });
export const avatarLimiter = new RateLimiter({ windowMs: 60_000, max: 60 });
