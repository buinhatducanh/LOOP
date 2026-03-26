import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth/permissions", () => ({
  requireAuth: vi.fn(),
}));

describe("GET /api/admin/events/stream", () => {
  it("returns 401 when user is unauthorized", async () => {
    const { requireAuth } = await import("@/lib/auth/permissions");
    const { GET } = await import("@/app/api/admin/events/stream/route");

    vi.mocked(requireAuth).mockRejectedValue(new Error("Unauthorized"));

    const req = new NextRequest("http://localhost:3000/api/admin/events/stream");
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error).toBe("Unauthorized");
  });
});
