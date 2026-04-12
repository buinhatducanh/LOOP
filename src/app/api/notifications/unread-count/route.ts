import { handleError, ok } from "@/lib/api/response";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/permissions";

/**
 * GET /api/notifications/unread-count
 * Lightweight endpoint to get the unread notification count for the current user
 */
export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth(req);

    const count = await prisma.notification.count({
      where: {
        userId: session.userId,
        isRead: false,
      },
    });

    return ok({ count });
  } catch (err) {
    return handleError(err);
  }
}
