import { handleError, ok } from "@/lib/api/response";
import { NextRequest } from "next/server";
import { requirePermission } from "@/lib/auth/permissions";
import { getNotificationStats } from "@/lib/services/notification/admin-notification.service";

/**
 * GET /api/admin/notifications/stats
 * Returns notification statistics: total, unread, by type, by priority, today count.
 */
export async function GET(_req: NextRequest) {
 try {
 await requirePermission("notifications", "read");
 const stats = await getNotificationStats();
 return ok(stats);
 } catch (err) {
 return handleError(err);
 }
}
