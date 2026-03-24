/**
 * XP / Rank Formula Library
 *
 * XP Formula:
 *   - XP needed per level = level * 100  (Level 1 = 100 XP, Level 2 = 200 XP, ...)
 *   - 1 LP = 10 XP  (XP_PER_LP = 10)
 *
 * Rank thresholds (from teamRanks.ts / BA spec):
 *   IRON     : level  1–14
 *   BRONZE   : level 15–34
 *   SILVER   : level 35–54
 *   GOLD     : level 55–74
 *   PLATINUM : level 75–94
 *   RUBY     : level 95–114
 *   DIAMOND  : level 115+  (uncapped)
 *
 * Total LP for rank = approved LpAward.lpAmount + all completed LpTransaction
 * (award type, sources: lp_allocation, teaching, referral, manual)
 */

import { prisma } from "@/lib/prisma";
import { RANKS, getRankFromLevel, RankKey } from "@/components/team/teamRanks";

export const XP_PER_LP = 10;

// ── Pure computation (no DB) ────────────────────────────────────────────────

/** XP needed to complete a given level (level N requires N * 100 XP). */
export function xpForLevel(level: number): number {
  return level * 100;
}

/**
 * Convert total accumulated XP → level + remainder XP within current level.
 */
export function levelFromXp(totalXp: number): { level: number; currentXp: number } {
  let level = 1;
  let remaining = totalXp;
  while (xpForLevel(level) <= remaining) {
    remaining -= xpForLevel(level);
    level++;
  }
  return { level, currentXp: remaining };
}

/**
 * Pure: compute rank fields from a numeric total LP amount.
 * No DB reads — safe for read-only use (leaderboard, team list, etc.).
 */
export function computeRankFieldsFromLp(
  totalLp: number
): { level: number; currentXp: number; maxXp: number; rank: RankKey } {
  const totalXp = totalLp * XP_PER_LP;
  const { level, currentXp } = levelFromXp(totalXp);
  const maxXp = xpForLevel(level);
  const rank = getRankFromLevel(level);
  return { level, currentXp, maxXp, rank };
}

// ── DB-backed rank sync ──────────────────────────────────────────────────

/**
 * Compute total awarded LP for a member from ALL sources:
 *   1. Approved LpAward records
 *   2. Completed LpTransaction(type=award) records (teaching, referral, etc.)
 *
 * Then persist rank fields to TeamMember and return them.
 *
 * Used by: LP award approve/reject, EDU payment.
 */
export async function syncRankFields(memberId: string): Promise<{
  level: number;
  currentXp: number;
  maxXp: number;
  rank: RankKey;
} | null> {
  const [awardAgg, txAgg] = await Promise.all([
    prisma.lpAward.aggregate({
      where: { memberId, status: "approved" },
      _sum: { lpAmount: true },
    }),
    prisma.lpTransaction.aggregate({
      where: { memberId, type: "award", status: "completed" },
      _sum: { amount: true },
    }),
  ]);

  const awardLp = awardAgg._sum.lpAmount ?? 0;
  const txLp = txAgg._sum.amount ?? 0;
  const fields = computeRankFieldsFromLp(awardLp + txLp);

  await prisma.teamMember.update({
    where: { id: memberId },
    data: fields,
  });

  return fields;
}
