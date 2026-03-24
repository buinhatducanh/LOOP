import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import { createAuditLog } from "@/lib/auth/audit";
import { syncRankFields } from "@/lib/rank/xp";

// POST /api/admin/lp-awards/[id]/approve
// PM approves → credit LP to member → create LpTransaction → update rank
// PM rejects  → release locked LP → create LpTransaction (expire) → update locked balance

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requirePermission("lp-awards", "update");
    const { id } = await params;
    const { action, reason } = await req.json(); // "approve" | "reject"

    const award = await prisma.lpAward.findUnique({ where: { id } });
    if (!award) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (award.status !== "pending") {
      return NextResponse.json({ error: "Award already processed" }, { status: 400 });
    }

    if (action !== "approve" && action !== "reject") {
      return NextResponse.json({ error: "Invalid action: must be 'approve' or 'reject'" }, { status: 400 });
    }

    // ── Look up approver's TeamMember.id ────────────────────────────────────
    const approver = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { teamMember: { select: { id: true } } },
    });
    const approverMemberId = approver?.teamMember?.id ?? null;
    const now = new Date();

    // ── Atomic approval / rejection block ────────────────────────────────────
    const result = await prisma.$transaction(async (tx) => {
      if (action === "reject") {
        // ── Reject: release locked LP back to zero ────────────────────────────
        // No LP is awarded; the member's pending locked LP simply decreases.
        // We record this as an "expire" transaction for audit clarity.
        const member = await tx.teamMember.findUnique({
          where: { id: award.memberId },
          select: { lockedLp: true, availableLp: true },
        });

        if (member) {
          const releasedAmount = Math.min(award.lpAmount, member.lockedLp);
          const newLocked = member.lockedLp - releasedAmount;

          await tx.lpTransaction.create({
            data: {
              memberId: award.memberId,
              amount: 0, // no net LP change on rejection
              balanceAfter: member.availableLp,
              type: "expire",
              status: "completed",
              description: `LP award rejected: ${award.lpAmount} LP returned to pool. Reason: ${reason ?? "Rejected by PM"}`,
              source: award.source,
              referenceId: award.id,
              referenceType: "LpAward",
            },
          });

          await tx.teamMember.update({
            where: { id: award.memberId },
            data: { lockedLp: newLocked },
          });
        }

        const updated = await tx.lpAward.update({
          where: { id },
          data: { status: "rejected", rejectedReason: reason ?? "Rejected by PM", approvedBy: approverMemberId, approvedAt: now },
        });

        return { award: updated, type: "rejected" as const };
      }

      // ── Approve ────────────────────────────────────────────────────────────
      // 1. Update LpAward status
      const updatedAward = await tx.lpAward.update({
        where: { id },
        data: { status: "approved", approvedBy: approverMemberId, approvedAt: now },
      });

      // 2. Update ProjectMember earnedLp/exp
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

      // 3. Update TeamMember balances (decrease locked, increase available)
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

        // 4. Create LpTransaction ledger entry
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

      // 5. Re-rank based on total approved LP
      const lpAgg = await tx.lpAward.aggregate({
        where: { memberId: award.memberId, status: "approved" },
        _sum: { lpAmount: true },
      });
      const totalLp = lpAgg._sum.lpAmount ?? 0;
      const { level, currentXp, maxXp, rank } = syncRankFields(totalLp);
      await tx.teamMember.update({
        where: { id: award.memberId },
        data: { level, currentXp, maxXp, rank },
      });

      return { award: updatedAward, type: "approved" as const };
    });

    await createAuditLog({
      userId: session.userId,
      action,
      resource: "lp-awards",
      resourceId: id,
      newValues: { lpAmount: award.lpAmount, memberId: award.memberId, action },
    });

    return NextResponse.json({ data: result.award });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
