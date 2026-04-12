import { handleError, ok, list, buildPagination, badRequest } from "@/lib/api/response";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/permissions";

/**
 * GET /api/notifications
 * List notifications for the current user
 */
export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth(req);
    const { searchParams } = new URL(req.url);

    const where: Record<string, unknown> = {
      userId: session.userId,
    };

    const isRead = searchParams.get("isRead");
    if (isRead === "true") where.isRead = true;
    else if (isRead === "false") where.isRead = false;

    const type = searchParams.get("type");
    if (type && type !== "all") where.type = type;

    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "20");
    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where }),
    ]);

    return list(notifications, buildPagination(page, limit, total));
  } catch (err) {
    return handleError(err);
  }
}

/**
 * POST /api/notifications/mark-read
 * Mark notifications as read for the current user
 */
export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth(req);
    const data = await req.json();

    if (data.all) {
      // Mark all as read
      await prisma.notification.updateMany({
        where: {
          userId: session.userId,
          isRead: false,
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });
      return ok({ success: true, message: "All notifications marked as read" });
    }

    if (Array.isArray(data.ids) && data.ids.length > 0) {
      // Mark specific IDs as read
      await prisma.notification.updateMany({
        where: {
          id: { in: data.ids },
          userId: session.userId,
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });
      return ok({ success: true, count: data.ids.length });
    }

    return badRequest("Please provide 'all: true' or an array of 'ids'");
  } catch (err) {
    return handleError(err);
  }
}
