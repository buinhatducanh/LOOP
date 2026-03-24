import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import { syncRankFields } from "@/lib/rank/xp";

// POST /api/admin/rank/sync/[memberId]
// Recalculate and persist rank fields for a TeamMember based on all their approved LpAwards.

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ memberId: string }> }
) {
  try {
    await requirePermission("lp-awards", "update");

    const { memberId } = await params;

    // ── Verify member exists ───────────────────────────────────────────────
    const member = await prisma.teamMember.findUnique({
      where: { id: memberId },
      select: { id: true, name: true },
    });

    if (!member) {
      return NextResponse.json({ error: "Team member not found" }, { status: 404 });
    }

    // ── Aggregate all approved LP awards across ALL projects ─────────────────
    const result = await prisma.lpAward.aggregate({
      where: { memberId, status: "approved" },
      _sum: { lpAmount: true },
    });

    const totalApprovedLp = result._sum.lpAmount ?? 0;

    // ── Compute new rank fields ──────────────────────────────────────────────
    const { level, currentXp, maxXp, rank } = syncRankFields(totalApprovedLp);

    // ── Persist to TeamMember ────────────────────────────────────────────────
    const updated = await prisma.teamMember.update({
      where: { id: memberId },
      data: { level, currentXp, maxXp, rank },
      select: {
        id: true,
        name: true,
        level: true,
        currentXp: true,
        maxXp: true,
        rank: true,
      },
    });

    return NextResponse.json({
      data: {
        ...updated,
        totalApprovedLp,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
