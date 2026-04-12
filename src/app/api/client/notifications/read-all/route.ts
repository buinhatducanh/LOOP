import { handleError, ok } from "@/lib/api/response";
import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth/permissions";
import { markAllRead } from "@/lib/services/notification/client-notification.service";

/**
 * POST /api/client/notifications/read-all — mark all notifications as read
 */
export async function POST(_req: NextRequest) {
 try {
 const session = await requireAuth();
 await markAllRead(session.userId);
 return ok({ success: true });
 } catch (err) {
 return handleError(err);
 }
}
