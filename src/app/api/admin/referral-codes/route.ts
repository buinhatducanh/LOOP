import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import { createAuditLog } from "@/lib/auth/audit";

// GET /api/admin/referral-codes
// Query: ?memberId=&campaign=&isActive=&page=&limit=
export async function GET(req: NextRequest) {
  try {
    await requirePermission("team", "read");
    const { searchParams } = new URL(req.url);
    const memberId = searchParams.get("memberId");
    const campaign = searchParams.get("campaign");
    const isActive = searchParams.get("isActive");
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(50, parseInt(searchParams.get("limit") ?? "20", 10));

    const where: Record<string, unknown> = {};
    if (memberId) where.memberId = memberId;
    if (campaign) where.campaign = campaign;
    if (isActive !== null) where.isActive = isActive === "true";

    const [codes, total] = await Promise.all([
      prisma.referralCode.findMany({
        where,
        include: {
          member: { select: { id: true, name: true, role: true, image: true } },
          _count: {
            select: {
              leads: true,
              orders: true,
              tracking: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.referralCode.count({ where }),
    ]);

    // Aggregate stats per code
    const codesWithStats = await Promise.all(
      codes.map(async (code) => {
        const orders = await prisma.order.findMany({
          where: { referralCodeId: code.id, status: { in: ["completed", "contracted", "delivered", "paid_full", "paid"] } },
          select: { id: true, paidAmount: true },
        });
        const totalRevenue = orders.reduce((s, o) => s + (o.paidAmount ?? 0), 0);
        const tracking = await prisma.referralTracking.groupBy({
          by: ["event"],
          where: { referralCodeId: code.id },
          _count: { event: true },
        });
        const clicks = tracking.find((t) => t.event === "click")?._count.event ?? 0;
        const signups = tracking.find((t) => t.event === "signup")?._count.event ?? 0;
        const leads = tracking.find((t) => t.event === "lead")?._count.event ?? 0;
        const conversions = tracking.find((t) => t.event === "order")?._count.event ?? 0;
        const lpAwardedAgg = await prisma.referralTracking.aggregate({
          where: { referralCodeId: code.id },
          _sum: { lpAwarded: true },
        });

        return {
          ...code,
          stats: {
            totalRevenue,
            clicks,
            signups,
            leads,
            conversions,
            lpAwarded: lpAwardedAgg._sum.lpAwarded ?? 0,
            conversionRate: clicks > 0 ? Math.round((conversions / clicks) * 10000) / 100 : 0,
          },
        };
      })
    );

    return NextResponse.json({
      data: codesWithStats,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

// POST /api/admin/referral-codes
// Body: { code, name, memberId, campaign?, lpRate?, minRevenue?, maxUses?, expiresAt? }
export async function POST(req: NextRequest) {
  try {
    const session = await requirePermission("team", "create");
    const body = await req.json();

    const { code, name, memberId, campaign, lpRate, minRevenue, maxUses, expiresAt } = body;

    if (!code || !name || !memberId) {
      return NextResponse.json({ error: "code, name, and memberId are required" }, { status: 400 });
    }

    // Validate code format (alphanumeric, uppercase, 3-20 chars)
    const normalized = code.toUpperCase().replace(/[^A-Z0-9_-]/g, "");
    if (normalized.length < 3 || normalized.length > 20) {
      return NextResponse.json({ error: "Code must be 3–20 alphanumeric characters" }, { status: 400 });
    }

    // Verify member exists
    const member = await prisma.teamMember.findUnique({
      where: { id: memberId },
      select: { id: true, name: true },
    });
    if (!member) return NextResponse.json({ error: "Team member not found" }, { status: 404 });

    // Check uniqueness
    const existing = await prisma.referralCode.findUnique({ where: { code: normalized } });
    if (existing) {
      return NextResponse.json({ error: `Code "${normalized}" already exists` }, { status: 409 });
    }

    const referralCode = await prisma.referralCode.create({
      data: {
        code: normalized,
        name,
        memberId,
        campaign: campaign ?? null,
        lpRate: lpRate ?? 0.05,
        minRevenue: minRevenue ?? 0,
        maxUses: maxUses ?? null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
      include: { member: { select: { id: true, name: true } } },
    });

    await createAuditLog({
      userId: session.userId,
      action: "create",
      resource: "referral-codes",
      resourceId: referralCode.id,
      newValues: { code: normalized, name, memberId },
    });

    return NextResponse.json({ data: referralCode }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
