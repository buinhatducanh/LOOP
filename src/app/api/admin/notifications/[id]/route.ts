import { ok, notFound, handleError } from "@/lib/api/response";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";

/**
 * PATCH /api/admin/notifications/[id]
 * Mark a notification as read.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission("notifications", "read");
    const { id } = await params;

    const notification = await prisma.notification.findUnique({ where: { id } });
    if (!notification) return notFound("Notification not found");

    // Only allow updating own notifications
    if (notification.userId !== session.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });

    return ok(updated);
  } catch (error) {
    return handleError(error);
  }
}

/**
 * DELETE /api/admin/notifications/[id]
 * Delete a notification.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission("notifications", "read");
    const { id } = await params;

    const notification = await prisma.notification.findUnique({ where: { id } });
    if (!notification) return notFound("Notification not found");

    // Only allow deleting own notifications
    if (notification.userId !== session.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.notification.delete({ where: { id } });

    return ok({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
