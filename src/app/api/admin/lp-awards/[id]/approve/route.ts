import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import { createAuditLog } from "@/lib/auth/audit";
import { syncRankFields } from "@/lib/rank/xp";
import { handleError } from "@/lib/api";
import { lpLogger } from "@/lib/logger";
import type { Prisma } from "@/generated/prisma";

// ── LP award cap (configurable ceiling per award) ──────────────────────────
const MAX_APPROVE_LP = 5_000_000;

// POST /api/admin/lp-awards/[id]/approve
// action: "approve" → credit LP + rank sync
// action: "reject"  → release locked LP + rank sync
//
// Fixes applied (2026-04-11):
//  1. $transaction wraps all sequential writes for atomicity (PrismaNeon WebSocket mode).
//  2. Protective re-read inside the transaction ensures retry requests see
//     status === "approved" and fail fast (idempotency).
//  3. LP cap check prevents awards exceeding MAX_APPROVE_LP from being processed.

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

    // ── LP cap check (before entering transaction) ───────────────────────────────
    if (action === "approve" && award.lpAmount > MAX_APPROVE_LP) {
      lpLogger.warn("LP award cap exceeded", {
        awardId: id,
        lpAmount: award.lpAmount,
        cap: MAX_APPROVE_LP,
        actor: session.userId,
      });
      return NextResponse.json(
        { error: `LP amount exceeds maximum allowed (${MAX_APPROVE_LP.toLocaleString()} LP per award)` },
        { status: 400 }
      );
    }

    // Look up approver's TeamMember.id for the audit trail
    const approver = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { teamMember: { select: { id: true } } },
    });
    const approverMemberId = approver?.teamMember?.id ?? null;
    const now = new Date();

    // ── Atomic transaction: all sequential writes wrapped ───────────────────────
    if (action === "reject") {
      // Within the transaction: re-read award status (idempotency guard), then write.
      const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        const fresh = await tx.lpAward.findUnique({
          where: { id },
          select: { status: true, lpAmount: true, memberId: true },
        });
        if (!fresh || fresh.status !== "pending") {
          throw new Error("ALREADY_PROCESSED");
        }

        const member = await tx.teamMember.findUnique({
          where: { id: fresh.memberId },
          select: { lockedLp: true, availableLp: true },
        });

        if (member) {
          const releasedAmount = Math.min(fresh.lpAmount, member.lockedLp);
          const newLocked = member.lockedLp - releasedAmount;
          const newAvailable = member.availableLp + releasedAmount;

          await tx.teamMember.update({
            where: { id: fresh.memberId },
            data: { lockedLp: newLocked, availableLp: newAvailable },
          });

          await tx.lpTransaction.create({
            data: {
              memberId: fresh.memberId,
              amount: 0,
              balanceAfter: newAvailable,
              type: "reject",
              status: "completed",
              description: `LP award rejected: ${fresh.lpAmount} LP returned. Reason: ${reason ?? "Rejected by PM"}`,
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

        return { ok: true };
      });

      return NextResponse.json({ data: { awardId: id, action: "reject", rank: null } });
    }

    // ── Approve ───────────────────────────────────────────────────────────────
    const txResult = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Protective re-read inside transaction — prevents concurrent approve attempts
      const fresh = await tx.lpAward.findUnique({
        where: { id },
        select: { status: true, lpAmount: true, memberId: true, projectId: true, expAmount: true },
      });
      if (!fresh || fresh.status !== "pending") {
        throw new Error("ALREADY_PROCESSED");
      }

      // 1. Mark award approved
      await tx.lpAward.update({
        where: { id },
        data: { status: "approved", approvedBy: approverMemberId, approvedAt: now },
      });

      // 2. Update ProjectMember earned LP + EXP (only if linked to a project)
      if (fresh.projectId) {
        const pmRecord = await tx.projectMember.findUnique({
          where: {
            projectId_memberId: { projectId: fresh.projectId, memberId: fresh.memberId },
          },
        });
        if (pmRecord) {
          await tx.projectMember.update({
            where: { id: pmRecord.id },
            data: {
              earnedLp: pmRecord.earnedLp + fresh.lpAmount,
              exp: pmRecord.exp + fresh.expAmount,
            },
          });
        }
      }

      // 3. Read current LP balance inside transaction → write atomically
      const member = await tx.teamMember.findUnique({
        where: { id: fresh.memberId },
        select: { lockedLp: true, availableLp: true, rank: true, level: true },
      });

      let syncedRank = null;
      if (member) {
        const newLocked = Math.max(0, member.lockedLp - fresh.lpAmount);
        const newAvailable = member.availableLp + fresh.lpAmount;

        await tx.teamMember.update({
          where: { id: fresh.memberId },
          data: { lockedLp: newLocked, availableLp: newAvailable },
        });

        // 4. Ledger entry
        await tx.lpTransaction.create({
          data: {
            memberId: fresh.memberId,
            amount: fresh.lpAmount,
            balanceAfter: newAvailable,
            type: "award",
            status: "completed",
            description: `LP awarded via ${award.source}: +${fresh.lpAmount} LP`,
            source: award.source,
            referenceId: award.id,
            referenceType: "LpAward",
            createdBy: approverMemberId,
          },
        });

        syncedRank = { rank: member.rank, level: member.level };
      }

      return { syncedRank };
    });

    // ── Rank sync: runs outside transaction (read-only on LP tables) ────────────
    const oldRank = { rank: txResult?.syncedRank?.rank ?? "", level: txResult?.syncedRank?.level ?? 0 };
    const updatedRank = await syncRankFields(award.memberId);

    if (
      updatedRank &&
      (oldRank.rank !== updatedRank.rank || oldRank.level !== updatedRank.level)
    ) {
      await prisma.lpTransaction.create({
        data: {
          memberId: award.memberId,
          amount: 0,
          balanceAfter: 0,
          type: "rank_up",
          status: "completed",
          description: `Rank up: ${oldRank.rank} Lv.${oldRank.level} → ${updatedRank.rank} Lv.${updatedRank.level}`,
          source: "rank_sync",
          referenceId: award.id,
          referenceType: "LpAward",
          createdBy: approverMemberId,
        },
      });
    }

    // Audit log — non-critical, fire-and-forget
    await createAuditLog({
      userId: session.userId,
      action,
      resource: "lp-awards",
      resourceId: id,
      newValues: { lpAmount: award.lpAmount, memberId: award.memberId, action, reason } as unknown as Record<string, unknown>,
    }).catch(() => { /* non-critical */ });

    return NextResponse.json({
      data: { awardId: id, action, rank: updatedRank },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "ALREADY_PROCESSED") {
      return NextResponse.json({ error: "Award already processed" }, { status: 400 });
    }
    return handleError(error);
  }
}
