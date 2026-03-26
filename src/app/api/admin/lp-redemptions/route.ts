import { handleError } from "@/lib/api/response";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import { createAuditLog } from "@/lib/auth/audit";
import { redeemLp, listRedeemableItems } from "@/lib/services/gamification/redemption.service";

// GET /api/admin/lp-redemptions
// Query params:
//   ?items=1           → return list of LP-redeemable AddonServices
//   ?memberId=&page=&limit=  → redemption history (admin view)

export async function GET(req: NextRequest) {
  try {
    await requirePermission("lp-redemptions", "read");
    const { searchParams } = new URL(req.url);

    // ── Return redeemable catalog ──────────────────────────────────────────────
    if (searchParams.get("items") === "1") {
      const items = await listRedeemableItems();
      return NextResponse.json({ data: items });
    }

    // ── Redemption history ───────────────────────────────────────────────────
    const memberId = searchParams.get("memberId");
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(50, parseInt(searchParams.get("limit") ?? "20", 10));

    const where = memberId ? { memberId } : {};
    const [redemptions, total] = await Promise.all([
      prisma.lpRedemption.findMany({
        where,
        include: {
          member: { select: { id: true, name: true, role: true, image: true } },
          addon: {
            select: { id: true, name: true, nameVi: true, icon: true, lpCost: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.lpRedemption.count({ where }),
    ]);

    return NextResponse.json({
      data: redemptions,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return handleError(error);
  }
}

// POST /api/admin/lp-redemptions
// Redeem LP for an AddonService.
// Body: { memberId, addonId, quantity? }

export async function POST(req: NextRequest) {
  try {
    const session = await requirePermission("lp-redemptions", "update");
    const { memberId, addonId, quantity } = await req.json();

    if (!memberId || !addonId) {
      return NextResponse.json(
        { error: "memberId and addonId are required" },
        { status: 400 }
      );
    }

    // Only the member themselves or an admin can redeem
    const isAdmin =
      session.roles.includes("super_admin") ||
      session.roles.includes("admin");

    if (!isAdmin && memberId !== session.teamMemberId) {
      return NextResponse.json(
        { error: "You can only redeem LP for yourself" },
        { status: 403 }
      );
    }

    const result = await redeemLp({
      memberId,
      addonId,
      quantity: quantity ?? 1,
      createdBy: session.teamMemberId ?? session.userId,
    });

    if (!result.ok) {
      const status = result.error?.includes("Insufficient") ? 400
        : result.error?.includes("not found") ? 404
        : 400;
      return NextResponse.json({ error: result.error }, { status });
    }

    await createAuditLog({
      userId: session.userId,
      action: "redeem",
      resource: "lp-redemptions",
      resourceId: result.redemption?.id ?? "unknown",
      newValues: { memberId, addonId, lpCost: result.lpCost, totalCost: result.totalCost },
    });

    return NextResponse.json({
      data: {
        redemption: result.redemption,
        lpCost: result.lpCost,
        totalCost: result.totalCost,
        newBalance: result.newBalance,
      },
    }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
