/**
 * GET /api/portal/orders — Customer's own orders
 * Requires customer auth (JWT cookie).
 */
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/permissions";
import { list, handleError } from "@/lib/api";
import { buildPagination } from "@/lib/api";

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth();

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(50, parseInt(searchParams.get("limit") ?? "10", 10));

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: { customerEmail: session.email },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          status: true,
          totalAmount: true,
          createdAt: true,
          updatedAt: true,
          package: { select: { title: true } },
          statusHistory: {
            orderBy: { createdAt: "desc" },
            take: 3,
            select: { fromStatus: true, toStatus: true, note: true, createdAt: true },
          },
        },
      }),
      prisma.order.count({ where: { customerEmail: session.email } }),
    ]);

    return list(orders, buildPagination(page, limit, total));
  } catch (err) {
    return handleError(err);
  }
}
