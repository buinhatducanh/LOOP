import { handleError, ok } from "@/lib/api/response";
import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth/permissions";
import { getUnreadCount } from "@/lib/services/notification/client-notification.service";

/**
 * GET /api/client/notifications/unread-count — get unread notification count
 */
export async function GET(_req: NextRequest) {
 try {
 const session = await requireAuth();
 const count = await getUnreadCount(session.userId);
 return ok({ unreadCount: count });
 } catch (err) {
 return handleError(err);
 }
}
