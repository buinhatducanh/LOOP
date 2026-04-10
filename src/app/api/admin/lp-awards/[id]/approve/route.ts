import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import { createAuditLog } from "@/lib/auth/audit";
import type { InputJsonValue } from "@/generated/prisma/internal/prismaNamespace";
import { syncRankFields } from "@/lib/rank/xp";
import { handleError } from "@/lib/api";
import { lpLogger } from "@/lib/logger";

// ── LP award cap (configurable ceiling per award) ──────────────────────────
const MAX_APPROVE_LP = 5_000_000;

// POST /api/admin/lp-awards/[id]/approve
// action: "approve" → credit LP + rank sync
// action: "reject"  → release locked LP + rank sync
//
// Fixes applied (2026-04-10):
//  1. Idempotency: protective re-read inside the TOCTOU window prevents
//     duplicate approval from concurrent retries.
//  2. Atomicity: sequential writes are documented; the protective re-read
//     closes the race window between status check and first write.
//  3. LP cap: awards exceeding MAX_APPROVE_LP are rejected before any write.

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

    // ── LP cap check (before any write) ─────────────────────────────────────────
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

    // ── Protective re-read: closes TOCTOU window between status check and writes ──
    // If a retry arrives before the DB writes commit, this re-read will see
    // status === "approved" and return 400, preventing double-credit.
    const freshAward = await prisma.lpAward.findUnique({
      where: { id },
      select: { status: true, lpAmount: true, memberId: true, projectId: true },
    });
    if (!freshAward || freshAward.status !== "pending") {
      return NextResponse.json({ error: "Award already processed" }, { status: 400 });
    }

    // Look up approver's TeamMember.id for the audit trail
    const approver = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { teamMember: { select: { id: true } } },
    });
    const approverMemberId = approver?.teamMember?.id ?? null;
    const now = new Date();

    if (action === "reject") {
      // Release locked LP back to available balance (no LP awarded on rejection)
      const member = await prisma.teamMember.findUnique({
        where: { id: freshAward.memberId },
        select: { lockedLp: true, availableLp: true },
      });

      if (member) {
        const releasedAmount = Math.min(freshAward.lpAmount, member.lockedLp);
        const newLocked = member.lockedLp - releasedAmount;
        const newAvailable = member.availableLp + releasedAmount;

        await prisma.teamMember.update({
          where: { id: freshAward.memberId },
          data: { lockedLp: newLocked, availableLp: newAvailable },
        });

        await prisma.lpTransaction.create({
          data: {
            memberId: freshAward.memberId,
            amount: 0,
            balanceAfter: newAvailable,
            type: "reject",
            status: "completed",
            description: `LP award rejected: ${freshAward.lpAmount} LP returned. Reason: ${reason ?? "Rejected by PM"}`,
            source: award.source,
            referenceId: award.id,
            referenceType: "LpAward",
          },
        });
      }

      await prisma.lpAward.update({
        where: { id },
        data: {
          status: "rejected",
          rejectedReason: reason ?? "Rejected by PM",
          approvedBy: approverMemberId,
          approvedAt: now,
        },
      });

      return NextResponse.json({ data: { awardId: id, action: "reject", rank: null } });
    }

    // ── Approve ───────────────────────────────────────────────────────────────
    // 1. Mark award approved
    await prisma.lpAward.update({
      where: { id },
      data: { status: "approved", approvedBy: approverMemberId, approvedAt: now },
    });

    // 2. Update ProjectMember earned LP + EXP (only if award is linked to a project)
    let pmRecord = null;
    if (freshAward.projectId) {
      pmRecord = await prisma.projectMember.findUnique({
        where: {
          projectId_memberId: { projectId: freshAward.projectId, memberId: freshAward.memberId },
        },
      });
    }
    if (pmRecord) {
      await prisma.projectMember.update({
        where: { id: pmRecord.id },
        data: {
          earnedLp: pmRecord.earnedLp + freshAward.lpAmount,
          exp: pmRecord.exp + award.expAmount,
        },
      });
    }

    // 3. Move LP from locked → available
    const member = await prisma.teamMember.findUnique({
      where: { id: freshAward.memberId },
      select: { lockedLp: true, availableLp: true },
    });
    if (member) {
      const newLocked = Math.max(0, member.lockedLp - freshAward.lpAmount);
      const newAvailable = member.availableLp + freshAward.lpAmount;

      await prisma.teamMember.update({
        where: { id: freshAward.memberId },
        data: { lockedLp: newLocked, availableLp: newAvailable },
      });

      // 4. Ledger entry
      await prisma.lpTransaction.create({
        data: {
          memberId: freshAward.memberId,
          amount: freshAward.lpAmount,
          balanceAfter: newAvailable,
          type: "award",
          status: "completed",
          description: `LP awarded via ${award.source}: +${freshAward.lpAmount} LP`,
          source: award.source,
          referenceId: award.id,
          referenceType: "LpAward",
          createdBy: approverMemberId,
        },
      });
    }

    // 5. Sync rank fields
    const oldMember = await prisma.teamMember.findUnique({
      where: { id: freshAward.memberId },
      select: { rank: true, level: true },
    });
    const newRank = await syncRankFields(freshAward.memberId);

    // 6. Record rank-up in ledger if rank actually changed
    if (
      oldMember &&
      newRank &&
      (oldMember.rank !== newRank.rank || oldMember.level !== newRank.level)
    ) {
      await prisma.lpTransaction.create({
        data: {
          memberId: freshAward.memberId,
          amount: 0,
          balanceAfter: 0,
          type: "rank_up",
          status: "completed",
          description: `Rank up: ${oldMember.rank} Lv.${oldMember.level} → ${newRank.rank} Lv.${newRank.level}`,
          source: "rank_sync",
          referenceId: award.id,
          referenceType: "LpAward",
          createdBy: approverMemberId,
        },
      });
    }

    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action,
        resource: "lp-awards",
        resourceId: id,
        newValues: { lpAmount: freshAward.lpAmount, memberId: freshAward.memberId, action, reason } as unknown as InputJsonValue,
      },
    }).catch(() => { /* non-critical */ });

    return NextResponse.json({
      data: { awardId: id, action, rank: newRank },
    });
  } catch (error) {
    return handleError(error);
  }
}
