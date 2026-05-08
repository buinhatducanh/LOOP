/**
 * POST /api/admin/team/members/pending/:id/reject
 *
 * CEO rejects a pending member request:
 *  1. Find the MemberRequest
 *  2. Mark as rejected with reason
 *  3. Deactivate user if exists
 *  4. Send rejection notification
 */
import { NextRequest } from "next/server";
import { requirePermissionFast, isSuperAdmin, requireAuth } from "@/lib/auth/permissions";
import { ok, handleError, notFound, badRequest } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();

    // Only CEO or super_admin can reject
    if (!isSuperAdmin(session)) {
      requirePermissionFast(session, "users", "create");
    }

    const { id } = await params;

    const memberRequest = await prisma.memberRequest.findUnique({
      where: { id },
    });

    if (!memberRequest) {
      return notFound("MemberRequest not found");
    }

    if (memberRequest.status !== "pending") {
      return badRequest(`Request đã ở trạng thái "${memberRequest.status}", không thể từ chối`);
    }

    const body = await req.json().catch(() => ({}));
    const { reason } = body;

    if (!reason || typeof reason !== "string" || reason.trim().length === 0) {
      return badRequest("Lý do từ chối là bắt buộc");
    }

    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Update request status
      const _updated = await tx.memberRequest.update({
        where: { id },
        data: {
          status: "rejected",
          rejectReason: reason.trim(),
          processedBy: session.userId,
          processedAt: new Date(),
        },
      });

      // Deactivate user if exists
      if (memberRequest.userId) {
        await tx.user.update({
          where: { id: memberRequest.userId },
          data: { isActive: false },
        });
      }

      // Create notification for HR
      await tx.notification.create({
        data: {
          userId: session.userId,
          title: "Từ chối nhân sự",
          message: `Đã từ chối: ${memberRequest.name} (${memberRequest.email}) — Lý do: ${reason.trim()}`,
          type: "member_rejected",
        },
      });

      return _updated;
    });

    return ok(result);
  } catch (err) {
    return handleError(err);
  }
}
