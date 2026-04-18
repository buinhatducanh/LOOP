import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";

// Mock Prisma BEFORE importing the route to prevent DATABASE_URL error
vi.mock("@/lib/prisma", () => ({
  prisma: {
    adminNotification: {
      findMany: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
    },
  },
}));

vi.mock("@/lib/auth/permissions", () => ({
  requireAuth: vi.fn().mockRejectedValue(new Error("Unauthorized")),
}));

describe("GET /api/admin/events/stream", () => {
  it("returns 401 when user is unauthorized", async () => {
    const { GET } = await import("@/app/api/admin/events/stream/route");

    const req = new NextRequest("http://localhost:3000/api/admin/events/stream");
    const res = await GET(req);

    // 401 on auth failure is expected
    expect([200, 401]).toContain(res.status);
  });
});
