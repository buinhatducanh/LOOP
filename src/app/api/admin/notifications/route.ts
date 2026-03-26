import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/permissions";
import { handleError, list, buildPagination } from "@/lib/api";

/**
 * GET /api/admin/notifications
 * Returns notifications for current authenticated user.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth();

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
    const unreadOnly = searchParams.get("unread") === "true";

    const where = {
      userId: session.userId,
      ...(unreadOnly ? { isRead: false } : {}),
    };

    const [rows, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.notification.count({ where }),
    ]);

    return list(rows, buildPagination(page, limit, total));
  } catch (error) {
    return handleError(error);
  }
}
