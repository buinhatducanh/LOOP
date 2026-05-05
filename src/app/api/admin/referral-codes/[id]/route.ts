import { handleError, ok } from "@/lib/api/response";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import { createAuditLog } from "@/lib/auth/audit";
import type { Prisma } from "@/generated/prisma/index.d.ts";
type InputJsonValue = Prisma.InputJsonValue;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission("team", "read");
    const { id } = await params;

    const code = await prisma.referralCode.findUnique({
      where: { id },
      include: {
        member: { select: { id: true, name: true, role: true, image: true } },
        _count: { select: { leads: true, orders: true, tracking: true } },
      },
    });

    if (!code) return NextResponse.json({ error: "Referral code not found" }, { status: 404 });

    // Full tracking breakdown by event type
    const tracking = await prisma.referralTracking.groupBy({
      by: ["event"],
      where: { referralCodeId: id },
      _count: { event: true },
    });

    // Completed orders via this code
    const orders = await prisma.order.findMany({
      where: { referralCodeId: id, status: { in: ["completed", "contracted", "delivered", "paid_full", "paid"] } },
      select: { id: true, orderNumber: true, paidAmount: true, status: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    const lpAwardedAgg = await prisma.referralTracking.aggregate({
      where: { referralCodeId: id, event: "order" },
      _sum: { lpAwarded: true },
    });

    const totalRevenue = orders.reduce((s, o) => s + (o.paidAmount ?? 0), 0);

    return NextResponse.json({
      data: {
        ...code,
        tracking: {
          total: tracking.reduce((s, t) => s + t._count.event, 0),
          clicks:  tracking.find((t) => t.event === "click")?._count.event ?? 0,
          signups: tracking.find((t) => t.event === "signup")?._count.event ?? 0,
          leads:   tracking.find((t) => t.event === "lead")?._count.event ?? 0,
          orders:  tracking.find((t) => t.event === "order")?._count.event ?? 0,
        },
        orders,
        totalRevenue,
        lpAwarded: lpAwardedAgg._sum.lpAwarded ?? 0,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission("team", "update");
    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.referralCode.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Referral code not found" }, { status: 404 });

    // ⚠️ FIX: wrap referral code update + audit log in a transaction.
    const updated = await prisma.$transaction(async (tx) => {
      const u = await tx.referralCode.update({
        where: { id },
        data: {
          name: body.name ?? existing.name,
          campaign: body.campaign !== undefined ? body.campaign : existing.campaign,
          lpRate: body.lpRate !== undefined ? Number(body.lpRate) : existing.lpRate,
          minRevenue: body.minRevenue !== undefined ? Number(body.minRevenue) : existing.minRevenue,
          maxUses: body.maxUses !== undefined ? (body.maxUses === null ? null : Number(body.maxUses)) : existing.maxUses,
          isActive: body.isActive !== undefined ? Boolean(body.isActive) : existing.isActive,
          expiresAt: body.expiresAt !== undefined ? (body.expiresAt ? new Date(body.expiresAt) : null) : existing.expiresAt,
        },
        include: { member: { select: { id: true, name: true } } },
      });
      await tx.auditLog.create({
        data: {
          userId: session.userId,
          action: "update",
          resource: "referral-codes",
          resourceId: id,
          oldValues: existing as unknown as InputJsonValue,
          newValues: body as unknown as InputJsonValue,
        },
      });
      return u;
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission("team", "delete");
    const { id } = await params;

    const existing = await prisma.referralCode.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Referral code not found" }, { status: 404 });

    // ⚠️ FIX: wrap soft delete + audit log in a transaction.
    await prisma.$transaction(async (tx) => {
      await tx.referralCode.update({
        where: { id },
        data: { isActive: false },
      });
      await tx.auditLog.create({
        data: {
          userId: session.userId,
          action: "delete",
          resource: "referral-codes",
          resourceId: id,
          oldValues: existing as unknown as InputJsonValue,
        },
      });
    });

    return ok({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
