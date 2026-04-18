/**
 * Sync all active team members' rank/level from actual LP.
 * Run: npx tsx scripts/sync-all-member-ranks.ts
 *
 * Computes rank/level from:
 *   1. Approved LpAward.lpAmount
 *   2. Completed LpTransaction(type=award, amount > 0)
 *
 * Updates TeamMember.{rank, level, currentXp, maxXp} for every isActive member.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const XP_PER_LP = 10;

function xpForLevel(level: number): number {
  return level * 100;
}

function levelFromXp(totalXp: number): { level: number; currentXp: number } {
  let level = 1;
  let remaining = totalXp;
  while (xpForLevel(level) <= remaining) {
    remaining -= xpForLevel(level);
    level++;
  }
  return { level, currentXp: remaining };
}

function getRankFromLevel(level: number): string {
  if (level >= 115) return "diamond";
  if (level >= 95)  return "ruby";
  if (level >= 75)  return "platinum";
  if (level >= 55)  return "gold";
  if (level >= 35)  return "silver";
  if (level >= 15)  return "bronze";
  return "iron";
}

function computeRankFieldsFromLp(totalLp: number) {
  const totalXp = totalLp * XP_PER_LP;
  const { level, currentXp } = levelFromXp(totalXp);
  const maxXp = xpForLevel(level);
  const rank = getRankFromLevel(level);
  return { level, currentXp, maxXp, rank };
}

async function main() {
  console.log("🔄 Syncing rank/level for all active members...\n");

  const members = await prisma.teamMember.findMany({
    where: { isActive: true },
    select: { id: true, name: true, rank: true, level: true },
  });
  console.log(`Found ${members.length} active members\n`);

  const memberIds = members.map((m) => m.id);

  // Aggregate LP
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
  let synced = 0;
  for (const member of members) {
    const totalLp = lpMap.get(member.id) ?? 0;
    const fields = computeRankFieldsFromLp(totalLp);

    const changed =
      member.level !== fields.level ||
      member.rank !== fields.rank ||
      fields.level > 1; // always sync if level > 1 (member earned LP)

    if (changed || fields.level > 1) {
      await prisma.teamMember.update({
        where: { id: member.id },
        data: fields,
      });
      synced++;
      console.log(
        `  ✅ ${member.name.padEnd(20)} LP=${totalLp.toString().padStart(6)} → ${fields.rank.padEnd(10)} Lv.${fields.level}`
      );
    } else {
      console.log(
        `  ⬜ ${member.name.padEnd(20)} LP=${totalLp.toString().padStart(6)} → ${member.rank} Lv.${member.level} (unchanged)`
      );
    }
  }

  console.log(`\n✅ Done. Synced ${synced} members.`);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error("❌ Sync failed:", e);
  await prisma.$disconnect();
  process.exit(1);
});
