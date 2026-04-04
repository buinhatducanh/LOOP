/**
 * Rate Limiting — wraps Upstash Ratelimit when Redis is available,
 * falls back to in-memory RateLimiter for local development.
 *
 * For production, set UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN
 * in your environment. The Upstash implementation is distributed
 * (works across multiple Vercel serverless instances) while the
 * in-memory fallback only works for single-instance deployments.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  contactRateLimit,
  searchRateLimit,
  authRateLimit,
  publicApiRateLimit,
} from "@/lib/redis";

// ─── IP extraction utility ─────────────────────────────────────────────────────

/**
 * Extract client IP from request headers.
 *
 * In Vercel, x-forwarded-for is set by the reverse proxy.
 * In other deployments, falls back to x-real-ip.
 * Returns "127.0.0.1" as last resort.
 *
 * ⚠️  x-forwarded-for can be spoofed by clients in untrusted proxy setups.
 *     Only trust it when behind Cloudflare/Vercel or a known reverse proxy.
 */
export function extractClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "127.0.0.1"
  );
}

// ─── In-memory fallback (dev / no-Redis) ─────────────────────────────────────

interface RateLimitEntry {
  tokens: number;
  lastRefill: number;
}

interface RateLimitConfig {
  limit: number;
  window: number;
}

/**
 * Sliding-window in-memory rate limiter.
 *
 * ⚠️  LIMITATION: Do NOT use in production multi-instance deployments.
 *     The in-memory store is per-process and will not share state
 *     across multiple serverless invocations or containers.
 *
 * Memory safety: cleanup runs every 100 consume() calls to prevent
 * unbounded Map growth in long-running processes.
 */
export class RateLimiter {
  private store = new Map<string, RateLimitEntry>();
  private config: RateLimitConfig;
  private consumeCount = 0;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  consume(ip: string): { allowed: boolean; remaining: number; reset: number } {
    const now = Date.now();
    const { limit, window } = this.config;

    // Periodic cleanup every 100 requests to prevent unbounded memory growth
    this.consumeCount++;
    if (this.consumeCount % 100 === 0) {
      this.cleanup(window);
    }

    let entry = this.store.get(ip);

    if (!entry) {
      entry = { tokens: limit - 1, lastRefill: now };
      this.store.set(ip, entry);
      return { allowed: true, remaining: limit - 1, reset: now + window };
    }

    const elapsed = now - entry.lastRefill;
    // Refill tokens based on elapsed time (refillRate = 1 token per window)
    const tokensToAdd = Math.floor((elapsed / window) * limit);

    if (tokensToAdd > 0) {
      entry.tokens = Math.min(limit, entry.tokens + tokensToAdd);
      entry.lastRefill = now;
    }

    if (entry.tokens > 0) {
      entry.tokens -= 1;
      return { allowed: true, remaining: entry.tokens, reset: now + window };
    }

    return { allowed: false, remaining: 0, reset: entry.lastRefill + window };
  }

  /**
   * Remove entries older than maxAgeMs.
   * Called automatically every 100 consume() calls.
   */
  cleanup(maxAgeMs = 5 * 60_000) {
    const cutoff = Date.now() - maxAgeMs;
    for (const [key, entry] of this.store.entries()) {
      if (entry.lastRefill < cutoff) this.store.delete(key);
    }
  }
}

// ─── Re-export Upstash ratelimiters (production) ────────────────────────────────

export { contactRateLimit, searchRateLimit, authRateLimit, publicApiRateLimit };

// ─── Rate limit helper ─────────────────────────────────────────────────────────

export type RateLimiterKey = "contact" | "search" | "auth" | "public";

function getRateLimiter(key: RateLimiterKey) {
  switch (key) {
    case "contact": return contactRateLimit;
    case "search": return searchRateLimit;
    case "auth": return authRateLimit;
    case "public": return publicApiRateLimit;
  }
}

/**
 * Apply rate limiting to an API route handler.
 *
 * Usage:
 *   const result = await applyRateLimit(req, "contact");
 *   if (!result.allowed) return result.response; // denied
 *   // continue with handler...
 */
export async function applyRateLimit(
  req: NextRequest,
  limiterKey: RateLimiterKey
): Promise<{ allowed: boolean; response?: NextResponse }> {
  const limiter = getRateLimiter(limiterKey);
  const ip = extractClientIp(req);

  // Redis unavailable → rate limiting is disabled (fail open for availability)
  if (!limiter) return { allowed: true };

  try {
    const { success, remaining, reset } = await limiter.limit(ip);

    if (success) {
      return { allowed: true };
    }

    const retryAfter = Math.ceil((reset - Date.now()) / 1000);
    const response = NextResponse.json(
      { error: "Too many requests. Please slow down." },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfter),
          "X-RateLimit-Remaining": String(remaining),
          "X-RateLimit-Reset": String(reset),
        },
      }
    );
    return { allowed: false, response };
  } catch (err) {
    // If Redis is down, allow the request (fail open for availability)
    console.warn(`[RateLimit] Upstash error for ${limiterKey}:`, err);
    return { allowed: true };
  }
}
