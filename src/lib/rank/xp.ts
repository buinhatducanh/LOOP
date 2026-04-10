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
import { getRankFromLevel, RankKey } from "@/lib/rank/ranks";

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
 * Compute total LP for rank from ALL sources:
 *   1. Approved LpAward records
 *   2. Completed LpTransaction(type=award, amount > 0) — positive adjustments only
 *
 * IMPORTANT: LpTransaction.amount is an absolute value.
 *   Positive = credit (award, bonus, referral, etc.) → counts toward rank
 *   Negative = debit (deduction, penalty) → does NOT count toward rank
 *
 * Rank is based on net positive LP earned, not current balance.
 * availableLp is updated separately to reflect actual spendable balance.
 *
 * Uses sequential queries (Neon HTTP adapter does not support $transaction).
 *
 * Used by: LP award approval, LP transaction creation, member profile update.
 */
export async function syncRankFields(memberId: string): Promise<{
  level: number;
  currentXp: number;
  maxXp: number;
  rank: RankKey;
  availableLp: number;
} | null> {
  // Read all three in parallel
  const [awardAgg, txAgg, member] = await Promise.all([
    prisma.lpAward.aggregate({
      where: { memberId, status: "approved" },
      _sum: { lpAmount: true },
    }),
    // Only count POSITIVE amounts toward rank — negative = deductions/penalties
    // that reduce available balance but do not erase earned XP for rank purposes.
    prisma.lpTransaction.aggregate({
      where: {
        memberId,
        type: "award",
        status: "completed",
        // BUG FIX: exclude negative amounts (deductions) from rank calculation
        // amount > 0 means earned/awarded LP only
        amount: { gt: 0 },
      },
      _sum: { amount: true },
    }),
    // Read current availableLp separately (not affected by rank calculation)
    prisma.teamMember.findUnique({
      where: { id: memberId },
      select: { availableLp: true },
    }),
  ]);

  const awardLp = awardAgg._sum.lpAmount ?? 0;
  const txLp = txAgg._sum.amount ?? 0;
  const totalLp = awardLp + txLp;
  const fields = computeRankFieldsFromLp(totalLp);
  // availableLp: use the actual balance field, not the rank-computed total
  const availableLp = member?.availableLp ?? totalLp;

  await prisma.teamMember.update({
    where: { id: memberId },
    data: {
      ...fields,
      // Always sync availableLp from the authoritative balance field
      availableLp,
    },
  });

  return { ...fields, availableLp };
}
