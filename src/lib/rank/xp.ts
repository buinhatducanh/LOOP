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
 * Compute total awarded LP for a member from ALL sources:
 *   1. Approved LpAward records
 *   2. Completed LpTransaction(type=award) records (admin adjustment, etc.)
 *
 * Then persist rank fields AND availableLp to TeamMember and return them.
 *
 * availableLp is kept in sync with the sum of approved awards so the rank display
 * is always consistent with actual awarded LP (not inflated by manual deductions).
 *
 * Uses sequential queries (Neon HTTP adapter does not support $transaction).
 * The read gap is small (~ms) — a race on concurrent approval is acceptable
 * for a rank sync (self-heals on next trigger).
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
  // Sequential reads — Neon PostgreSQL HTTP adapter does NOT support $transaction
  const [awardAgg, txAgg] = await Promise.all([
    prisma.lpAward.aggregate({
      where: { memberId, status: "approved" },
      _sum: { lpAmount: true },
    }),
    // NOTE: exclude "spend" transactions from the rank total.
    // Spend transactions are deductions (negative amounts) that are also
    // directly reflected in TeamMember.availableLp via redemption.service.ts.
    // Including them here would double-count the deduction inside a redemption
    // $transaction (the spend is uncommitted so the re-read sees old totals,
    // then P2002-style stale totals overwrite the already-deducted availableLp).
    prisma.lpTransaction.aggregate({
      where: { memberId, type: "award", status: "completed" },
      _sum: { amount: true },
    }),
  ]);

  const awardLp = awardAgg._sum.lpAmount ?? 0;
  const txLp = txAgg._sum.amount ?? 0;
  const totalLp = awardLp + txLp;
  const fields = computeRankFieldsFromLp(totalLp);

  await prisma.teamMember.update({
    where: { id: memberId },
    data: { ...fields, availableLp: totalLp },
  });

  return { ...fields, availableLp: totalLp };
}
