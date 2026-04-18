import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock all external deps so the route can be imported in jsdom
vi.mock("@/lib/auth/permissions", () => ({
  requirePermission: vi.fn().mockResolvedValue({ userId: "u1" }),
}));

vi.mock("@/lib/api/search-utils", () => ({
  buildQueryFromParams: vi.fn().mockReturnValue({ where: {}, orderBy: {} }),
  parsePagination: vi.fn().mockReturnValue({ page: 1, limit: 20 }),
  buildPaginationResponse: vi.fn().mockReturnValue({ page: 1, limit: 20, total: 0, totalPages: 0 }),
}));

vi.mock("@/lib/auth/audit", () => ({ createAuditLog: vi.fn() }));
vi.mock("@/lib/idempotency", () => ({ withIdempotency: (key: string, fn: () => unknown) => fn }));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    order: {
      findMany: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
    },
  },
}));

describe("GET /api/admin/orders integration-style", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns paginated orders for authorized user", async () => {
    const { GET } = await import("@/app/api/admin/orders/route");

    const req = new NextRequest("http://localhost:3000/api/admin/orders?page=1&limit=20");
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(Array.isArray(json.data)).toBe(true);
  });
});
