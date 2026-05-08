import { ok, notFound, forbidden, handleError } from "@/lib/api/response";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import { listRedeemableItems } from "@/lib/services/gamification/redemption.service";
import { addAvatar } from "@/lib/api/mappings";

// GET /api/growth-loop/[memberId]
// Returns the full "Growth Loop" view for a staff member:
//   - LP balance (available, locked, total)
//   - Recent LP transactions
//   - Redeemable catalog
//   - Referral codes + stats + shareable link
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ memberId: string }> }
) {
  try {
    const session = await requirePermission("team", "read");
    const { memberId } = await params;
    const { searchParams } = new URL(req.url);
    const limit = Math.min(50, parseInt(searchParams.get("limit") ?? "10", 10));

    const isAdmin =
      session.roles.includes("super_admin") ||
      session.roles.includes("admin");

    if (!isAdmin && memberId !== session.teamMemberId)
      return forbidden("You can only view your own growth loop data");

    const member = await prisma.teamMember.findUnique({
      where: { id: memberId },
      select: {
        id: true,
        name: true,
        role: true,
        image: true,
        availableLp: true,
        lockedLp: true,
        level: true,
        rank: true,
        currentXp: true,
        maxXp: true,
      },
    });

    if (!member) return notFound("Member not found");

    const transactions = await prisma.lpTransaction.findMany({
      where: { memberId },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        amount: true,
        balanceAfter: true,
        type: true,
        status: true,
        description: true,
        source: true,
        createdAt: true,
        counterparty: { select: { id: true, name: true } },
      },
    });

    const redemptions = await prisma.lpRedemption.findMany({
      where: { memberId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        lpCost: true,
        quantity: true,
        status: true,
        expiresAt: true,
        createdAt: true,
        addon: { select: { id: true, name: true, nameVi: true, icon: true } },
      },
    });

    const redeemableItems = await listRedeemableItems();

    const referralCodes = await prisma.referralCode.findMany({
      where: { memberId, isActive: true },
      select: {
        id: true,
        code: true,
        name: true,
        campaign: true,
        lpRate: true,
        useCount: true,
        maxUses: true,
        expiresAt: true,
        _count: { select: { orders: true, tracking: true } },
      },
    });

    const completedStatuses = ["completed", "contracted", "delivered", "paid_full", "paid"] as string[];
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.loops.vn";

    const codesWithStats = await Promise.all(
      referralCodes.map(async (code: typeof referralCodes[number]) => {
        const completedOrders = await prisma.order.findMany({
          where: { referralCodeId: code.id, status: { in: completedStatuses } },
          select: { paidAmount: true },
        });
        const totalRevenue = completedOrders.reduce((s: number, o: typeof completedOrders[number]) => s + (o.paidAmount ?? 0), 0);
        const lpAgg = await prisma.lpTransaction.aggregate({
          where: { memberId, source: "referral", referenceType: "Order" },
          _sum: { amount: true },
        });
        const tierLabel =
          totalRevenue >= 200_000_000 ? "Tier 3 (10%)"
            : totalRevenue >= 50_000_000 ? "Tier 2 (7%)"
            : "Tier 1 (5%)";

        return {
          ...code,
          stats: {
            totalRevenue,
            conversions: completedOrders.length,
            lpEarned: lpAgg._sum.amount ?? 0,
          },
          shareUrl: `${baseUrl}/ref/${code.code}`,
          tierLabel,
        };
      })
    );

    return ok({
      member: {
        ...addAvatar(member),
        availableLp: member.availableLp,
        lockedLp: member.lockedLp,
        totalLp: member.availableLp + member.lockedLp,
        rank: { level: member.level, key: member.rank, currentXp: member.currentXp, maxXp: member.maxXp },
      },
      transactions,
      recentRedemptions: redemptions,
      redeemableCatalog: redeemableItems,
      referralCodes: codesWithStats,
    });
  } catch (error) {
    return handleError(error);
  }
}
