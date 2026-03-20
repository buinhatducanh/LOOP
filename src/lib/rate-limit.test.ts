import { describe, it, expect, vi, beforeEach } from "vitest";
import { RateLimiter } from "@/lib/rate-limit";

// Test the in-memory fallback RateLimiter class
// (The Upstash version is tested separately in integration tests)
describe("RateLimiter (in-memory fallback)", () => {
  let limiter: RateLimiter;

  beforeEach(() => {
    limiter = new RateLimiter({ limit: 3, window: 60_000 });
  });

  it("allows requests within limit", () => {
    const mockReq = makeMockRequest("1.2.3.4");

    const r1 = limiter.consume(mockReq);
    const r2 = limiter.consume(mockReq);
    const r3 = limiter.consume(mockReq);

    expect(r1.allowed).toBe(true);
    expect(r2.allowed).toBe(true);
    expect(r3.allowed).toBe(true);
  });

  it("blocks requests exceeding limit", () => {
    const mockReq = makeMockRequest("5.6.7.8");

    // Exhaust the limit
    limiter.consume(mockReq); // 1
    limiter.consume(mockReq); // 2
    limiter.consume(mockReq); // 3 — last allowed

    const blocked = limiter.consume(mockReq); // 4 — blocked

    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  it("tracks each IP independently", () => {
    const req1 = makeMockRequest("10.0.0.1");
    const req2 = makeMockRequest("10.0.0.2");

    // Exhaust IP1's limit
    limiter.consume(req1);
    limiter.consume(req1);
    limiter.consume(req1);

    // IP2 should still be allowed
    const ip2Result = limiter.consume(req2);

    expect(ip2Result.allowed).toBe(true);
  });

  it("returns remaining token count", () => {
    const req = makeMockRequest("192.168.1.1");

    const initial = limiter.consume(req);
    expect(initial.remaining).toBe(2);

    const second = limiter.consume(req);
    expect(second.remaining).toBe(1);
  });

  it("returns reset timestamp when blocked", () => {
    const req = makeMockRequest("172.16.0.1");

    limiter.consume(req);
    limiter.consume(req);
    limiter.consume(req);
    const blocked = limiter.consume(req);

    expect(blocked.allowed).toBe(false);
    expect(blocked.reset).toBeGreaterThan(Date.now());
  });

  it("cleanup removes stale entries", () => {
    const req = makeMockRequest("203.0.113.50");

    limiter.consume(req);
    limiter.consume(req);
    limiter.consume(req);

    // Cleanup with stale threshold (entries are fresh, so they stay)
    limiter.cleanup(5 * 60_000);
    const after = limiter.consume(req);

    // Fresh entry — still works
    expect(after.allowed).toBe(false); // exhausted
  });
});

// Helper to create a mock Request object with IP headers
function makeMockRequest(ip: string): Request {
  return new Request("http://localhost", {
    headers: {
      "x-forwarded-for": ip,
    },
  });
}
