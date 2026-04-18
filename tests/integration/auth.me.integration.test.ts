import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth/permissions", () => ({
  getSession: vi.fn(),
}));

vi.mock("@/lib/logger", () => ({
  authLogger: { withSLO: vi.fn((msg, meta, fn) => fn() },
  lpLogger: { warn: vi.fn(), error: vi.fn() },
  orderLogger: { error: vi.fn() },
}));

describe("GET /api/admin/auth/me integration-style", () => {
  it("returns 401 when no session", async () => {
    const { getSession } = await import("@/lib/auth/permissions");
    const { GET } = await import("@/app/api/admin/auth/me/route");

    vi.mocked(getSession).mockResolvedValue(null as never);

    const req = new NextRequest("http://localhost:3000/api/admin/auth/me");
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error).toBe("Unauthorized");
  });

  it("returns user object when session exists", async () => {
    const { getSession } = await import("@/lib/auth/permissions");
    const { GET } = await import("@/app/api/admin/auth/me/route");

    vi.mocked(getSession).mockResolvedValue({
      userId: "u1",
      email: "admin@loop.vn",
      name: "Admin",
      role: "admin",
      roles: ["admin"],
      avatar: null,
      accountType: "staff",
      teamMemberId: null,
      roleLevel: 1,
      permissions: [],
    } as never);

    const req = new NextRequest("http://localhost:3000/api/admin/auth/me");
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toHaveProperty("user.userId", "u1");
  });
});
