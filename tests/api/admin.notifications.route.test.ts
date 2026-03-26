import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth/permissions", () => ({
  requireAuth: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    notification: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}));

describe("GET /api/admin/notifications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns paginated notifications for current user", async () => {
    const { requireAuth } = await import("@/lib/auth/permissions");
    const { prisma } = await import("@/lib/prisma");
    const { GET } = await import("@/app/api/admin/notifications/route");

    vi.mocked(requireAuth).mockResolvedValue({ userId: "u_1" } as never);
    vi.mocked(prisma.notification.findMany).mockResolvedValue([
      {
        id: "n1",
        userId: "u_1",
        type: "info",
        title: "Welcome",
        message: "Hello",
        isRead: false,
        createdAt: new Date(),
      },
    ] as never);
    vi.mocked(prisma.notification.count).mockResolvedValue(1 as never);

    const req = new NextRequest("http://localhost:3000/api/admin/notifications?page=1&limit=20");
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(Array.isArray(json.data)).toBe(true);
    expect(json.pagination.total).toBe(1);
  });
});
