/**
 * XP / Rank Formula Library
 *
 * XP Formula:
 *   - XP needed per level = level * 100  (Level 1 = 100 XP, Level 2 = 200 XP, ...)
 *   - 1 approved LpAward LP amount × 10 = XP earned  (XP_PER_LP = 10)
 *
 * Rank thresholds (from teamRanks.ts / BA spec):
 *   IRON     : level  1–14
 *   BRONZE   : level 15–34
 *   SILVER   : level 35–54
 *   GOLD     : level 55–74
 *   PLATINUM : level 75–94
 *   RUBY     : level 95–114
 *   DIAMOND  : level 115+  (uncapped)
 */

import { RANKS, getRankFromLevel, RankKey } from "@/components/team/teamRanks";

export const XP_PER_LP = 10;

// ── XP math ──────────────────────────────────────────────────────────────────

/** XP needed to complete a given level (level N requires N * 100 XP). */
export function xpForLevel(level: number): number {
  return level * 100;
}

/**
 * Convert total accumulated XP → level + remainder XP within current level.
 * Loop: keep subtracting until total < xpForLevel(level+1).
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
 * Full rank sync: takes total approved LP for a member and returns
 * the computed level / XP / rank fields to write to TeamMember.
 */
export function syncRankFields(
  totalApprovedLp: number
): {
  level: number;
  currentXp: number;
  maxXp: number;
  rank: RankKey;
} {
  const totalXp = totalApprovedLp * XP_PER_LP;
  const { level, currentXp } = levelFromXp(totalXp);
  const maxXp = xpForLevel(level);
  const rank = getRankFromLevel(level);

  return { level, currentXp, maxXp, rank };
}
