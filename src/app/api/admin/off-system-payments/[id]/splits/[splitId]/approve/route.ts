/**
 * Approve a single OffSystemSplit → credit LP to member
 * POST /api/admin/off-system-payments/:id/splits/:splitId/approve
 *
 * Fix (2026-04-11):
 *   All sequential writes are now wrapped in prisma.$transaction for atomicity.
 *   The protective re-read inside the transaction prevents concurrent duplicates.
 */

import { handleError, ok, notFound, badRequest } from "@/lib/api/response";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import { computeRankFieldsFromLp } from "@/lib/rank/xp";
import type { Prisma } from "@/generated/prisma";

interface RouteParams { params: Promise<{ id: string; splitId: string }> }

export async function POST(_req: NextRequest, { params }: RouteParams) {
  try {
    const session = await requirePermission("off_system_payments", "update");
    const { id: _paymentId, splitId } = await params;

    const split = await prisma.offSystemSplit.findUnique({
      where: { id: splitId },
      include: {
        member: { select: { id: true, availableLp: true, lockedLp: true } },
        offSystemPayment: { select: { id: true } },
      },
    });

    if (!split) return notFound("Split not found");
    if (split.status === "approved") return badRequest("split already approved");
    if (split.status === "rejected") return badRequest("split was rejected");

    // ── Atomic transaction ─────────────────────────────────────────────────────
    const updatedMember = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Protective re-read inside transaction
      const fresh = await tx.offSystemSplit.findUnique({
        where: { id: splitId },
        select: { status: true, memberId: true, lpAmount: true },
      });
      if (!fresh || fresh.status !== "pending") {
        throw new Error("ALREADY_PROCESSED");
      }

      // Update member LP (credit)
      const updated = await tx.teamMember.update({
        where: { id: fresh.memberId },
        data: { availableLp: { increment: fresh.lpAmount } },
      });

      // Ledger entry
      await tx.lpTransaction.create({
        data: {
          memberId: fresh.memberId,
          amount: fresh.lpAmount,
          balanceAfter: updated.availableLp,
          type: "award",
          status: "completed",
          description: `Off-system payment — ${split.projectRole} (${split.percentage}%)`,
          source: "off_system_split",
          referenceId: split.id,
          referenceType: "off_system_split",
          createdBy: session.userId,
        },
      });

      // Mark split as approved
      await tx.offSystemSplit.update({
        where: { id: splitId },
        data: {
          status: "approved",
          approvedBy: session.userId,
          approvedAt: new Date(),
        },
      });

      return updated;
    });

    // ── Rank sync: runs outside transaction (read-only on LP tables) ────────────
    const [awardAgg, txAgg] = await Promise.all([
      prisma.lpAward.aggregate({
        where: { memberId: split.memberId, status: "approved" },
        _sum: { lpAmount: true },
      }),
      prisma.lpTransaction.aggregate({
        where: { memberId: split.memberId, type: "award", status: "completed" },
        _sum: { amount: true },
      }),
    ]);
    const totalLp = (awardAgg._sum.lpAmount ?? 0) + (txAgg._sum.amount ?? 0);
    const fields = computeRankFieldsFromLp(totalLp);
    await prisma.teamMember.update({ where: { id: split.memberId }, data: fields });

    return ok({ splitId, newAvailableLp: updatedMember.availableLp, rank: fields });
  } catch (error) {
    if (error instanceof Error && error.message === "ALREADY_PROCESSED") {
      return badRequest("Split already processed");
    }
    return handleError(error);
  }
}
