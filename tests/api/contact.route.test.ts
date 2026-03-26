import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/rate-limit", () => ({
  applyRateLimit: vi.fn(),
}));

vi.mock("@/lib/services/landing/contact.service", () => ({
  submitContactForm: vi.fn(),
  getContactMessages: vi.fn(),
}));

describe("POST /api/contact", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 201 when contact form is submitted successfully", async () => {
    const { applyRateLimit } = await import("@/lib/rate-limit");
    const { submitContactForm } = await import("@/lib/services/landing/contact.service");
    const { POST } = await import("@/app/api/contact/route");

    vi.mocked(applyRateLimit).mockResolvedValue({ allowed: true });
    vi.mocked(submitContactForm).mockResolvedValue({
      success: true,
      data: { id: "msg_1", email: "test@example.com" },
    });

    const req = new NextRequest("http://localhost:3000/api/contact", {
      method: "POST",
      body: JSON.stringify({
        name: "Test User",
        email: "test@example.com",
        message: "Hello LOOP",
      }),
      headers: { "content-type": "application/json" },
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json).toHaveProperty("data.id", "msg_1");
  });

  it("returns 429 when rate limited", async () => {
    const { applyRateLimit } = await import("@/lib/rate-limit");
    const { POST } = await import("@/app/api/contact/route");

    const rateLimitedResponse = new Response(
      JSON.stringify({ error: "Too many requests" }),
      { status: 429, headers: { "content-type": "application/json" } }
    );

    vi.mocked(applyRateLimit).mockResolvedValue({
      allowed: false,
      response: rateLimitedResponse as unknown as Response,
    });

    const req = new NextRequest("http://localhost:3000/api/contact", {
      method: "POST",
      body: JSON.stringify({ name: "A", email: "a@a.com", message: "m" }),
      headers: { "content-type": "application/json" },
    });

    const res = await POST(req);
    expect(res.status).toBe(429);
  });
});
