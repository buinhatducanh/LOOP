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

// ─── In-memory fallback (dev / no-Redis) ─────────────────────────────────────

interface RateLimitEntry {
  tokens: number;
  lastRefill: number;
}

interface RateLimitConfig {
  limit: number;
  window: number;
  refillRate?: number;
}

/** Sliding-window in-memory rate limiter — do NOT use in production multi-instance deployments */
export class RateLimiter {
  private store = new Map<string, RateLimitEntry>();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  private getKey(request: Request): string {
    const forwarded =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      "unknown";
    return forwarded;
  }

  consume(request: Request): { allowed: boolean; remaining: number; reset: number } {
    const key = this.getKey(request);
    const now = Date.now();
    const { limit, window, refillRate = 1 } = this.config;

    let entry = this.store.get(key);

    if (!entry) {
      entry = { tokens: limit - 1, lastRefill: now };
      this.store.set(key, entry);
      return { allowed: true, remaining: limit - 1, reset: now + window };
    }

    const elapsed = now - entry.lastRefill;
    const tokensToAdd = Math.floor((elapsed / window) * refillRate * limit);

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
 *   if (!result.response) return; // allowed
 *   return result.response;       // denied
 */
export async function applyRateLimit(
  req: NextRequest,
  limiterKey: RateLimiterKey
): Promise<{ allowed: boolean; response?: NextResponse }> {
  const limiter = getRateLimiter(limiterKey);

  // Extract IP from Vercel / standard headers
  const forwarded =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "127.0.0.1";

  try {
    const { success, remaining, reset } = await limiter.limit(forwarded);

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
