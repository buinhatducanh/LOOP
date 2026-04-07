import { describe, it, expect, beforeEach } from "vitest";
import { RateLimiter } from "@/lib/rate-limit";

// Test the in-memory fallback RateLimiter class
// (The Upstash version is tested separately in integration tests)
describe("RateLimiter (in-memory fallback)", () => {
  let limiter: RateLimiter;

  beforeEach(() => {
    limiter = new RateLimiter({ limit: 3, window: 60_000 });
  });

  it("allows requests within limit", () => {
    const ip = "1.2.3.4";

    const r1 = limiter.consume(ip);
    const r2 = limiter.consume(ip);
    const r3 = limiter.consume(ip);

    expect(r1.allowed).toBe(true);
    expect(r2.allowed).toBe(true);
    expect(r3.allowed).toBe(true);
  });

  it("blocks requests exceeding limit", () => {
    const ip = "5.6.7.8";

    // Exhaust the limit
    limiter.consume(ip); // 1
    limiter.consume(ip); // 2
    limiter.consume(ip); // 3 — last allowed

    const blocked = limiter.consume(ip); // 4 — blocked

    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  it("tracks each IP independently", () => {
    const ip1 = "10.0.0.1";
    const ip2 = "10.0.0.2";

    // Exhaust IP1's limit
    limiter.consume(ip1);
    limiter.consume(ip1);
    limiter.consume(ip1);

    // IP2 should still be allowed
    const ip2Result = limiter.consume(ip2);

    expect(ip2Result.allowed).toBe(true);
  });

  it("returns remaining token count", () => {
    const ip = "192.168.1.1";

    const initial = limiter.consume(ip);
    expect(initial.remaining).toBe(2);

    const second = limiter.consume(ip);
    expect(second.remaining).toBe(1);
  });

  it("returns reset timestamp when blocked", () => {
    const ip = "172.16.0.1";

    limiter.consume(ip);
    limiter.consume(ip);
    limiter.consume(ip);
    const blocked = limiter.consume(ip);

    expect(blocked.allowed).toBe(false);
    expect(blocked.reset).toBeGreaterThan(Date.now());
  });

  it("cleanup removes stale entries", () => {
    const ip = "203.0.113.50";

    limiter.consume(ip);
    limiter.consume(ip);
    limiter.consume(ip);

    // Cleanup with stale threshold (entries are fresh, so they stay)
    limiter.cleanup(5 * 60_000);
    const after = limiter.consume(ip);

    // Fresh entry — still works
    expect(after.allowed).toBe(false); // exhausted
  });
});
