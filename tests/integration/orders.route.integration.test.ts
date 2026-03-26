import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth/permissions", () => ({
  requirePermission: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    order: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}));

describe("GET /api/admin/orders integration-style", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns paginated orders for authorized user", async () => {
    const { requirePermission } = await import("@/lib/auth/permissions");
    const { prisma } = await import("@/lib/prisma");
    const { GET } = await import("@/app/api/admin/orders/route");

    vi.mocked(requirePermission).mockResolvedValue({ userId: "u1" } as never);
    vi.mocked(prisma.order.findMany).mockResolvedValue([
      {
        id: "ord_1",
        orderNumber: "ORD-0001",
        customerName: "Nguyen Van A",
        customerEmail: "a@example.com",
        status: "pending",
      },
    ] as never);
    vi.mocked(prisma.order.count).mockResolvedValue(1 as never);

    const req = new NextRequest("http://localhost:3000/api/admin/orders?page=1&limit=20");
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(Array.isArray(json.data)).toBe(true);
  });
});
