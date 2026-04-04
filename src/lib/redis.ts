/**
 * Redis Cache Layer using Upstash Redis.
 *
 * Provides:
 * - `redis` client for data caching (upstash/redis)
 * - `ratelimit` middleware for API routes (upstash/ratelimit)
 * - `cacheFetch()` helper — wraps any async function with Redis caching
 *
 * Setup:
 *   1. Create a free Redis database at https://console.upstash.com
 *   2. Copy REST token and database URL into .env.local:
 *      UPSTASH_REDIS_REST_URL=...
 *      UPSTASH_REDIS_REST_TOKEN=...
 *   3. The `redis` export below will automatically connect.
 *
 * Development fallback:
 *   When UPSTASH_REDIS_REST_URL is not set, all cache operations
 *   become no-ops (data is fetched fresh each time). This keeps
 *   the app working in dev without requiring a Redis instance.
 */

import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

// ─── Redis Client ─────────────────────────────────────────────────────────────

export const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null; // Null = cache disabled (dev fallback)

// ─── Rate Limiting ─────────────────────────────────────────────────────────────

/**
 * Guard: Ratelimit requires a live Redis client.
 * If UPSTASH_REDIS_REST_URL is missing, rate limiting is silently disabled
 * (the applyRateLimit() helper handles null ratelimit gracefully).
 */
function makeRatelimit(window: number, prefix: string) {
  if (!redis) {
    console.warn(`[RateLimit] Redis unavailable — rate limiting disabled (prefix: ${prefix})`);
    return null;
  }
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(window, "1 m"),
    analytics: true,
    prefix,
  });
}

/** 100 requests per minute per IP — public API routes */
export const publicApiRateLimit = makeRatelimit(100, "rl:public");

/** 20 requests per minute per IP — auth routes */
export const authRateLimit = makeRatelimit(20, "rl:auth");

/** 10 requests per minute per IP — contact form */
export const contactRateLimit = makeRatelimit(10, "rl:contact");

/** 30 requests per minute per IP — search */
export const searchRateLimit = makeRatelimit(30, "rl:search");

// ─── Cache-Fetch Helper ───────────────────────────────────────────────────────

export interface CacheOptions {
  /** Cache key — must be unique per data type + parameters */
  key: string;
  /** Time-to-live in seconds (default: 5 minutes) */
  ttl?: number;
}

/**
 * Cache-first data fetcher.
 *
 * Usage:
 *   const data = await cacheFetch({
 *     key: `services:${locale}`,
 *     ttl: 3600,
 *     fetcher: () => db.prisma.service.findMany(),
 *   });
 *
 * In development (no Redis), this simply calls `fetcher()` every time.
 */
export async function cacheFetch<T>(
  options: CacheOptions,
  fetcher: () => Promise<T>
): Promise<T> {
  const { key, ttl = 300 } = options;

  // No Redis — bypass cache entirely
  if (!redis) {
    return fetcher();
  }

  try {
    const cached = await redis.get<T>(key);

    if (cached !== null) {
      // Cache hit
      return cached;
    }

    // Cache miss — fetch fresh data
    const data = await fetcher();

    // Store in cache
    await redis.set(key, data, { ex: ttl });

    return data;
  } catch (err) {
    // Redis error — degrade gracefully to direct DB call
    console.warn(`[Cache] Redis error for key "${key}":`, err);
    return fetcher();
  }
}

/**
 * Invalidate a cache key (call after mutations).
 *
 * Usage in API routes after creating/updating content:
 *   await invalidateCache(`services:${locale}`);
 */
export async function invalidateCache(...keys: string[]): Promise<void> {
  if (!redis) return;
  try {
    await redis.del(...keys);
  } catch (err) {
    console.warn("[Cache] Failed to invalidate keys:", keys, err);
  }
}

/**
 * Invalidate all keys matching a prefix pattern.
 * Useful for sweeping stale data after major updates.
 *
 * ⚠️  SAFETY: Uses SCAN (not KEYS) to iterate in batches to avoid
 *     blocking the Redis event loop on large keyspaces.
 *     Keys are deleted asynchronously with UNLINK.
 *     Threshold guard: aborts if >10,000 keys match to prevent
 *     accidental mass eviction in production.
 */
export async function invalidateCachePattern(prefix: string): Promise<void> {
  if (!redis) return;

  const MAX_KEYS = 10_000;
  let cursor = 0;
  let totalFound = 0;

  try {
    do {
      // SCAN returns [nextCursor, keys[]]
      const [nextCursor, keys] = await redis.scan(cursor, {
        match: `${prefix}*`,
        count: 100, // process 100 keys per iteration
      });
      cursor = Number(nextCursor);

      if (keys.length > 0) {
        totalFound += keys.length;
        if (totalFound > MAX_KEYS) {
          console.warn(
            `[Cache] Pattern "${prefix}" matched ${totalFound} keys (>${MAX_KEYS} threshold). Aborting.`
          );
          return;
        }
        // UNLINK is async — non-blocking key deletion
        await redis.unlink(...(keys as string[]));
      }
    } while (cursor !== 0);
  } catch (err) {
    console.warn(`[Cache] Failed to invalidate pattern "${prefix}":`, err);
  }
}
