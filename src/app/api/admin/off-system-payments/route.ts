/**
 * OffSystemPayment API
 * GET  /api/admin/off-system-payments   → list payments + optional summary
 * POST /api/admin/off-system-payments   → create payment + auto-split
 */

import { handleError, ok, badRequest } from "@/lib/api/response";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";

async function getLpRate(): Promise<number> {
  const setting = await prisma.siteSetting.findUnique({
    where: { key: "lp_rate_config" },
  });
  if (!setting) return 1_000; // fallback
  try {
    const cfg = JSON.parse(setting.value);
    return cfg.lp_to_vnd ?? 1_000;
  } catch {
    return 1_000;
  }
}

export async function GET(req: NextRequest) {
  try {
    await requirePermission("off_system_payments", "read");

    const { searchParams } = req.nextUrl;
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 20));
    const skip = (page - 1) * limit;

    const [payments, total] = await Promise.all([
      prisma.offSystemPayment.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          order: { select: { orderNumber: true, customerName: true } },
          splits: {
            include: { member: { select: { name: true, rank: true, image: true } } },
          },
        },
      }),
      prisma.offSystemPayment.count(),
    ]);

    const data = payments.map((p) => ({
      id: p.id,
      orderId: p.orderId,
      amountVnd: p.amountVnd,
      lpRate: p.lpRate,
      totalLp: p.totalLp,
      description: p.description,
      note: p.note,
      createdBy: p.createdBy,
      createdAt: p.createdAt,
      order: p.order,
      splits: p.splits.map((s) => ({
        id: s.id,
        memberId: s.memberId,
        memberName: s.member.name,
        memberRank: s.member.rank,
        memberAvatar: (s.member as unknown as { image?: string }).image ?? null,
        projectRole: s.projectRole,
        percentage: s.percentage,
        lpAmount: s.lpAmount,
        status: s.status,
        approvedBy: s.approvedBy,
        approvedAt: s.approvedAt,
      })),
    }));

    return ok({
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      summary: { totalCount: total, totalVnd: payments.reduce((s, p) => s + p.amountVnd, 0) },
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requirePermission("off_system_payments", "create");
    const body = await req.json();

    const { amountVnd, orderId, description, note } = body;

    if (typeof amountVnd !== "number" || amountVnd <= 0) {
      return badRequest("amountVnd must be a positive number");
    }

    // Validate orderId if provided
    if (orderId) {
      const order = await prisma.order.findUnique({ where: { id: orderId } });
      if (!order) return badRequest("order not found");
    }

    const lpRate = await getLpRate();
    const totalLp = Math.floor(amountVnd / lpRate);

    // Load active RevenueSplitConfig — exclude "company" from splits (it's the remainder)
    const splitConfigs = await prisma.revenueSplitConfig.findMany({
      where: { isActive: true, key: { not: "company" } },
      orderBy: { percentage: "desc" },
    });

    // Build split data (no memberId yet — splits are role-based, approved individually)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const splitData: any[] = splitConfigs
      .filter((c) => c.percentage > 0)
      .map((c) => ({
        projectRole: c.key,
        percentage: c.percentage,
        lpAmount: Math.floor((totalLp * c.percentage) / 100),
        status: "pending",
      }));

    const payment = await prisma.offSystemPayment.create({
      data: {
        orderId: orderId ?? null,
        amountVnd,
        lpRate,
        totalLp,
        description: description ?? null,
        note: note ?? null,
        createdBy: session.userId,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        splits: { createMany: { data: splitData } } as any,
      },
      include: {
        splits: {
          include: { member: { select: { name: true, rank: true } } },
        },
      },
    });

    return ok(payment, 201);
  } catch (error) {
    return handleError(error);
  }
}