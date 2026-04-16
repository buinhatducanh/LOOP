import { ok, notFound, handleError } from "@/lib/api/response";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";

/**
 * PATCH /api/admin/notifications/[id]
 * Mark an admin notification as read.
 */
export async function PATCH(
 _req: NextRequest,
 { params }: { params: Promise<{ id: string }> }
) {
 try {
 await requirePermission("notifications", "read");
 const { id } = await params;

 const notification = await prisma.adminNotification.findUnique({ where: { id } });
 if (!notification) return notFound("Admin notification not found");

 const updated = await prisma.adminNotification.update({
 where: { id },
 data: { isRead: true, readAt: new Date() },
 });

 return ok(updated);
  } catch (error) {
 return handleError(error);
 }
}

/**
 * DELETE /api/admin/notifications/[id]
 * Delete an admin notification.
 */
export async function DELETE(
 _req: NextRequest,
 { params }: { params: Promise<{ id: string }> }
) {
 try {
 await requirePermission("notifications", "read");
 const { id } = await params;

 const notification = await prisma.adminNotification.findUnique({ where: { id } });
 if (!notification) return notFound("Admin notification not found");

 await prisma.adminNotification.delete({ where: { id } });

 return ok({ success: true });
 } catch (error) {
 return handleError(error);
 }
}
