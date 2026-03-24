import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import { computeRankFieldsFromLp } from "@/lib/rank/xp";
import { RANKS } from "@/components/team/teamRanks";

// GET /api/admin/rank/leaderboard
// Returns all active team members with real rank data derived from approved LpAwards.
// Supports ?sort=rank|level|lp&order=asc|desc&limit=N&memberId=xxx

export async function GET(req: NextRequest) {
  try {
    await requirePermission("team", "read");

    const { searchParams } = new URL(req.url);
    const sort = searchParams.get("sort") ?? "rank";
    const order = searchParams.get("order") ?? "desc";
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10), 100);
    const memberId = searchParams.get("memberId");

    // ── Fetch active members ────────────────────────────────────────────────
    const where = memberId ? { id: memberId, isActive: true } : { isActive: true };

    const members = await prisma.teamMember.findMany({
      where,
      select: {
        id: true,
        name: true,
        role: true,
        image: true,
        slug: true,
        level: true,
        currentXp: true,
        maxXp: true,
        rank: true,
      },
    });

    // ── Aggregate LP from BOTH sources per member ─────────────────────────
    // 1. Approved LpAward records
    // 2. Completed LpTransaction(type=award) — teaching, referral, lp_allocation, manual
    const memberIds = members.map((m) => m.id);

    // ── Dual-source LP aggregation: LpAward(approved) + LpTransaction(type=award, completed) ──
    const lpMap = new Map<string, number>();

    if (memberIds.length > 0) {
      const [awardAggs, txAggs] = await Promise.all([
        prisma.lpAward.groupBy({
          by: ["memberId"],
          where: { memberId: { in: memberIds }, status: "approved" },
          _sum: { lpAmount: true },
        }),
        prisma.lpTransaction.groupBy({
          by: ["memberId"],
          where: { memberId: { in: memberIds }, type: "award", status: "completed" },
          _sum: { amount: true },
        }),
      ]);

      for (const a of awardAggs) {
        lpMap.set(a.memberId, (lpMap.get(a.memberId) ?? 0) + (a._sum.lpAmount ?? 0));
      }
      for (const t of txAggs) {
        lpMap.set(t.memberId, (lpMap.get(t.memberId) ?? 0) + (t._sum.amount ?? 0));
      }
    }

    // ── Compute rank fields + enrich member data ────────────────────────────
    const enriched = members.map((m) => {
      const totalLp = lpMap.get(m.id) ?? 0;
      const computed = computeRankFieldsFromLp(totalLp);

      // Use persisted DB fields if present and non-zero (real data),
      // otherwise fall back to computed values.
      const level = m.level > 1 || m.currentXp > 0 ? m.level : computed.level;
      const currentXp = m.currentXp > 0 ? m.currentXp : computed.currentXp;
      const maxXp = m.maxXp > 100 || m.maxXp > computed.maxXp ? m.maxXp : computed.maxXp;
      const rank = (m.rank && m.rank !== "iron") ? m.rank : computed.rank;

      const cfg = RANKS[rank as keyof typeof RANKS];

      return {
        id: m.id,
        name: m.name,
        role: m.role,
        image: m.image ?? null,
        slug: m.slug,
        // Rank fields
        level,
        currentXp,
        maxXp,
        rank,
        rankKey: rank,
        tier: cfg?.tier ?? 1,
        color: cfg?.color ?? "#9CA3AF",
        symbol: cfg?.symbol ?? "⬡",
        // LP data
        totalLp,
        // Sorting helpers (numeric for sorting)
        _tier: cfg?.tier ?? 1,
        _level: level,
        _lp: totalLp,
      };
    });

    // ── Sort ────────────────────────────────────────────────────────────────
    const sortKey = sort === "lp" ? "_lp" : sort === "level" ? "_level" : "_tier";
    const asc = order === "asc";

    enriched.sort((a, b) => {
      const av = (a as Record<string, unknown>)[sortKey] as number;
      const bv = (b as Record<string, unknown>)[sortKey] as number;
      // Default leaderboard is highest rank/level/LP first (desc); asc reverses to lowest first
      return asc ? av - bv : bv - av;
    });

    const result = enriched.slice(0, limit).map(({ _tier, _level, _lp, ...rest }) => rest);

    // If querying a single member, return that member directly
    if (memberId) {
      const found = result[0];
      return NextResponse.json({ data: found ?? null });
    }

    return NextResponse.json({ data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
