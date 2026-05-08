/**
 * POST /api/admin/rank/sync-all
 *
 * Batch sync rank/level for ALL active team members.
 * Computes total LP from LpAward(approved) + LpTransaction(award,completed)
 * and updates TeamMember.{rank, level, currentXp, maxXp} fields.
 *
 * Used after seed fixes or bulk data corrections.
 */
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import { handleError, ok } from "@/lib/api";
import { computeRankFieldsFromLp } from "@/lib/rank/xp";

export async function POST(_req: NextRequest) {
  try {
    await requirePermission("lp-awards", "update");

    // Fetch all active members
    const members = await prisma.teamMember.findMany({
      where: { isActive: true },
      select: { id: true },
    });
    const memberIds = members.map((m) => m.id);

    if (memberIds.length === 0) {
      return ok({ synced: 0, message: "No active members found" });
    }

    // Aggregate LP from both sources
    const [awardAggs, txAggs] = await Promise.all([
      prisma.lpAward.groupBy({
        by: ["memberId"],
        where: { memberId: { in: memberIds }, status: "approved" },
        _sum: { lpAmount: true },
      }),
      prisma.lpTransaction.groupBy({
        by: ["memberId"],
        where: {
          memberId: { in: memberIds },
          type: "award",
          status: "completed",
          amount: { gt: 0 },
        },
        _sum: { amount: true },
      }),
    ]);

    const lpMap = new Map<string, number>();
    for (const a of awardAggs) {
      lpMap.set(a.memberId, (lpMap.get(a.memberId) ?? 0) + (a._sum.lpAmount ?? 0));
    }
    for (const t of txAggs) {
      lpMap.set(t.memberId, (lpMap.get(t.memberId) ?? 0) + (t._sum.amount ?? 0));
    }

    // Sync each member
    const results = await Promise.allSettled(
      memberIds.map(async (memberId) => {
        const totalLp = lpMap.get(memberId) ?? 0;
        const fields = computeRankFieldsFromLp(totalLp);
        await prisma.teamMember.update({
          where: { id: memberId },
          data: fields,
        });
        return { memberId, ...fields };
      })
    );

    const synced = results.filter((r: typeof results[number]) => r.status === "fulfilled").length;
    const failed = results.filter((r: typeof results[number]) => r.status === "rejected");

    return ok({
      synced,
      failed: failed.length,
      errors: failed.map((r: PromiseRejectedResult) =>
        r.status === "rejected" ? String(r.reason) : null
      ),
      syncedAt: new Date().toISOString(),
    });
  } catch (error) {
    return handleError(error);
  }
}
