/**
 * Approve a single OffSystemSplit → credit LP to member
 * POST /api/admin/off-system-payments/:id/splits/:splitId/approve
 */

import { handleError, ok, notFound, badRequest } from "@/lib/api/response";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import { syncRankFields } from "@/lib/rank/xp";

interface RouteParams { params: Promise<{ id: string; splitId: string }> }

export async function POST(_req: NextRequest, { params }: RouteParams) {
  try {
    const session = await requirePermission("off_system_payments", "update");
    const { id: _paymentId, splitId } = await params;

    const split = await prisma.offSystemSplit.findUnique({
      where: { id: splitId },
      include: {
        member: true,
        offSystemPayment: true,
      },
    });

    if (!split) return notFound("Split not found");
    if (split.status === "approved") return badRequest("split already approved");
    if (split.status === "rejected") return badRequest("split was rejected");

    // Credit LP to member via atomic transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update member LP
      const updatedMember = await tx.teamMember.update({
        where: { id: split.memberId },
        data: { availableLp: { increment: split.lpAmount } },
      });

      // Create LP transaction
      await tx.lpTransaction.create({
        data: {
          memberId: split.memberId,
          amount: split.lpAmount,
          balanceAfter: updatedMember.availableLp,
          type: "award",
          status: "completed",
          description: `Off-system payment #${split.offSystemPaymentId.slice(0, 8)} — ${split.projectRole} (${split.percentage}%)`,
          source: "award",
          referenceId: split.id,
          referenceType: "off_system_split",
          createdBy: session.userId,
        },
      });

      // Mark split as approved
      const approvedSplit = await tx.offSystemSplit.update({
        where: { id: splitId },
        data: {
          status: "approved",
          approvedBy: session.userId,
          approvedAt: new Date(),
        },
      });

      // Recalculate rank fields
      await syncRankFields(updatedMember.id);

      return approvedSplit;
    });

    return ok(result);
  } catch (error) {
    return handleError(error);
  }
}