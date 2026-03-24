import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTierLpRate } from "@/lib/customer/referral";

// GET /api/ref/[code]/info
// Returns public referral info for the landing page (member name, tier, stats)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const normalized = code.toUpperCase();

    const referralCode = await prisma.referralCode.findUnique({
      where: { code: normalized },
      select: {
        id: true,
        code: true,
        name: true,
        campaign: true,
        lpRate: true,
        isActive: true,
        expiresAt: true,
        member: {
          select: {
            id: true,
            name: true,
            image: true,
            role: true,
          },
        },
      },
    });

    if (!referralCode) {
      return NextResponse.json({ error: "Referral code not found" }, { status: 404 });
    }

    if (!referralCode.isActive) {
      return NextResponse.json({ error: "This referral code is no longer active" }, { status: 410 });
    }

    if (referralCode.expiresAt && new Date(referralCode.expiresAt) < new Date()) {
      return NextResponse.json({ error: "This referral code has expired" }, { status: 410 });
    }

    // Count total referred orders (completed/paid)
    const referredOrders = await prisma.order.count({
      where: {
        referralCodeId: referralCode.id,
        status: { in: ["completed", "delivered", "contracted", "paid_full"] },
      },
    });

    // Compute tier based on total revenue
    const orders = await prisma.order.findMany({
      where: {
        referralCodeId: referralCode.id,
        status: { in: ["completed", "delivered", "contracted", "paid_full"] },
      },
      select: { paidAmount: true },
    });

    const totalRevenue = orders.reduce((s, o) => s + (o.paidAmount ?? 0), 0);

    // Tier: 1 (5%), 2 (7%), 3 (10%)
    const effectiveRate = referralCode.lpRate > 0
      ? referralCode.lpRate
      : getTierLpRate(totalRevenue);
    const tier =
      effectiveRate >= 0.10 ? 3
      : effectiveRate >= 0.07 ? 2
      : 1;

    return NextResponse.json({
      data: {
        code: referralCode.code,
        name: referralCode.name ?? referralCode.code,
        campaign: referralCode.campaign,
        memberName: referralCode.member?.name ?? null,
        memberImage: referralCode.member?.image ?? null,
        memberRole: referralCode.member?.role ?? null,
        totalReferred: referredOrders,
        lpRate: effectiveRate,
        tier,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
