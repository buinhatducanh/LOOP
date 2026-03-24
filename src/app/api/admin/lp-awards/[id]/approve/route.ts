import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import { createAuditLog } from "@/lib/auth/audit";
import { syncRankFields } from "@/lib/rank/xp";

// POST /api/admin/lp-awards/[id]/approve
// action: "approve" → credit LP + rank sync
// action: "reject"  → release locked LP + rank sync

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission("lp-awards", "update");
    const { id } = await params;
    const { action, reason } = await req.json() as {
      action: "approve" | "reject";
      reason?: string;
    };

    if (action !== "approve" && action !== "reject") {
      return NextResponse.json(
        { error: "Invalid action: must be 'approve' or 'reject'" },
        { status: 400 }
      );
    }

    const award = await prisma.lpAward.findUnique({ where: { id } });
    if (!award) return NextResponse.json({ error: "Award not found" }, { status: 404 });
    if (award.status !== "pending") {
      return NextResponse.json({ error: "Award already processed" }, { status: 400 });
    }

    // Look up approver's TeamMember.id for the audit trail
    const approver = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { teamMember: { select: { id: true } } },
    });
    const approverMemberId = approver?.teamMember?.id ?? null;
    const now = new Date();

    // ── Atomic DB writes ─────────────────────────────────────────────────────────
    await prisma.$transaction(async (tx) => {
      if (action === "reject") {
        // Release locked LP back to available balance (no LP awarded on rejection)
        const member = await tx.teamMember.findUnique({
          where: { id: award.memberId },
          select: { lockedLp: true, availableLp: true },
        });

        if (member) {
          const releasedAmount = Math.min(award.lpAmount, member.lockedLp);
          const newLocked = member.lockedLp - releasedAmount;
          // Restore to availableLp so member regains purchasing power
          const newAvailable = member.availableLp + releasedAmount;

          await tx.teamMember.update({
            where: { id: award.memberId },
            data: { lockedLp: newLocked, availableLp: newAvailable },
          });

          // Ledger entry recording the rejection (zero amount since LP was never credited)
          await tx.lpTransaction.create({
            data: {
              memberId: award.memberId,
              amount: 0,
              balanceAfter: newAvailable,
              type: "expire",
              status: "completed",
              description: `LP award rejected: ${award.lpAmount} LP returned. Reason: ${reason ?? "Rejected by PM"}`,
              source: award.source,
              referenceId: award.id,
              referenceType: "LpAward",
            },
          });
        }

        await tx.lpAward.update({
          where: { id },
          data: {
            status: "rejected",
            rejectedReason: reason ?? "Rejected by PM",
            approvedBy: approverMemberId,
            approvedAt: now,
          },
        });

        return;
      }

      // ── Approve ──────────────────────────────────────────────────────────
      // 1. Mark award approved
      await tx.lpAward.update({
        where: { id },
        data: { status: "approved", approvedBy: approverMemberId, approvedAt: now },
      });

      // 2. Update ProjectMember earned LP + EXP
      const pmRecord = await tx.projectMember.findUnique({
        where: {
          projectId_memberId: { projectId: award.projectId, memberId: award.memberId },
        },
      });
      if (pmRecord) {
        await tx.projectMember.update({
          where: { id: pmRecord.id },
          data: {
            earnedLp: pmRecord.earnedLp + award.lpAmount,
            exp: pmRecord.exp + award.expAmount,
          },
        });
      }

      // 3. Move LP from locked → available
      const member = await tx.teamMember.findUnique({
        where: { id: award.memberId },
        select: { lockedLp: true, availableLp: true },
      });
      if (member) {
        const newLocked = Math.max(0, member.lockedLp - award.lpAmount);
        const newAvailable = member.availableLp + award.lpAmount;

        await tx.teamMember.update({
          where: { id: award.memberId },
          data: { lockedLp: newLocked, availableLp: newAvailable },
        });

        // 4. Ledger entry
        await tx.lpTransaction.create({
          data: {
            memberId: award.memberId,
            amount: award.lpAmount,
            balanceAfter: newAvailable,
            type: "award",
            status: "completed",
            description: `LP awarded via ${award.source}: +${award.lpAmount} LP`,
            source: award.source,
            referenceId: award.id,
            referenceType: "LpAward",
            createdBy: approverMemberId,
          },
        });
      }
    });

    // ── Rank sync (outside the main tx — reads fresh committed state) ────────────
    // Re-sync on both approve and reject so rank always reflects current totals
    const rank = await syncRankFields(award.memberId);

    await createAuditLog({
      userId: session.userId,
      action,
      resource: "lp-awards",
      resourceId: id,
      newValues: { lpAmount: award.lpAmount, memberId: award.memberId, action, reason },
    });

    return NextResponse.json({
      data: { awardId: id, action, rank },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Server error";
    const status =
      msg === "Unauthorized" ? 401
        : msg === "Forbidden" ? 403
        : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
