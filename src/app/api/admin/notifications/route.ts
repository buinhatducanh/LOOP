import { handleError, ok, badRequest, list, buildPagination } from "@/lib/api/response";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";

/**
 * GET /api/admin/notifications
 * List AdminNotification entries (type, priority, isRead, search + pagination).
 * Requires "notifications" read permission.
 *
 * POST /api/admin/notifications
 * Create an AdminNotification (internal use).
 * Requires "notifications" create permission.
 */

export async function GET(req: NextRequest) {
  try {
    const session = await requirePermission("notifications", "read");
    const { searchParams } = new URL(req.url);

    const where: Record<string, unknown> = {};

    const type = searchParams.get("type");
    if (type && type !== "all") where.type = type;

    const priority = searchParams.get("priority");
    if (priority && priority !== "all") where.priority = priority;

    const isRead = searchParams.get("isRead");
    if (isRead === "true") where.isRead = true;
    else if (isRead === "false") where.isRead = false;

    const search = searchParams.get("search");
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { message: { contains: search, mode: "insensitive" } },
      ];
    }

    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "20");
    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      prisma.adminNotification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.adminNotification.count({ where }),
    ]);

    return list(notifications, buildPagination(page, limit, total));
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requirePermission("notifications", "create");
    const data = await req.json();

    if (!data.type || !data.title || !data.message) {
      return badRequest("type, title, and message are required");
    }

    const notification = await prisma.adminNotification.create({
      data: {
        type: data.type,
        title: data.title,
        message: data.message,
        link: data.link ?? null,
        priority: data.priority ?? "normal",
        isRead: false,
      },
    });

    return ok(notification, 201);
  } catch (err) {
    return handleError(err);
  }
}
