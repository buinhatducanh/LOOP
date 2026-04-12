import { handleError, ok, notFound } from "@/lib/api/response";
import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";
import { markNotificationRead } from "@/lib/services/notification/client-notification.service";

/**
 * GET /api/client/notifications/[id] — get single notification
 * PATCH /api/client/notifications/[id] — mark as read
 */
export async function GET(
 req: NextRequest,
 { params }: { params: Promise<{ id: string }> }
) {
 try {
 const session = await requireAuth();
 const { id } = await params;

 const notification = await prisma.notification.findUnique({
 where: { id, userId: session.userId },
 });

 if (!notification) return notFound("Notification not found");
 return ok(notification);
 } catch (err) {
 return handleError(err);
 }
}

export async function PATCH(
 req: NextRequest,
 { params }: { params: Promise<{ id: string }> }
) {
 try {
 const session = await requireAuth();
 const { id } = await params;

 const success = await markNotificationRead(id, session.userId);
 if (!success) return notFound("Notification not found");
 return ok({ success: true });
 } catch (err) {
 return handleError(err);
 }
}
