import { NextRequest, NextResponse } from "next/server";
import { handleError } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import { createAuditLog } from "@/lib/auth/audit";

// GET /api/admin/customer-points
// List all customer points with optional filters.
// Query: ?email=&page=&limit=

export async function GET(req: NextRequest) {
  try {
    await requirePermission("customer-points", "read");

    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(50, parseInt(searchParams.get("limit") ?? "20", 10));

    const where = email ? { userEmail: { contains: email, mode: "insensitive" as const } } : {};

    const [points, total] = await Promise.all([
      prisma.customerPoint.findMany({
        where,
        include: {
          _count: { select: { transactions: true } },
          transactions: {
            orderBy: { createdAt: "desc" },
            take: 5,
            select: {
              id: true,
              type: true,
              amount: true,
              source: true,
              description: true,
              createdAt: true,
              referenceType: true,
            },
          },
        },
        orderBy: { totalEarned: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.customerPoint.count({ where }),
    ]);

    // Summary stats
    const [totalPoints, totalEarnedAgg, totalSpentAgg] = await Promise.all([
      prisma.customerPoint.count({ where }),
      prisma.customerPoint.aggregate({ where, _sum: { totalEarned: true } }),
      prisma.customerPoint.aggregate({ where, _sum: { totalSpent: true } }),
    ]);

    return NextResponse.json({
      data: points,
      stats: {
        totalCustomers: totalPoints,
        totalLpAwarded: totalEarnedAgg._sum.totalEarned ?? 0,
        totalLpSpent: totalSpentAgg._sum.totalSpent ?? 0,
      },
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return handleError(error);
  }
}

// POST /api/admin/customer-points/adjust
// Manual LP adjustment for a customer (admin bonus/penalty).
// Body: { email, amount, description }

export async function POST(req: NextRequest) {
  try {
    const session = await requirePermission("customer-points", "update");
    const { email, amount, description } = await req.json();

    if (!email || typeof amount !== "number" || amount === 0) {
      return NextResponse.json(
        { error: "email and non-zero amount are required" },
        { status: 400 }
      );
    }

    if (amount > 100_000 || amount < -100_000) {
      return NextResponse.json(
        { error: "Single adjustment cannot exceed ±100,000 LP" },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const point = await tx.customerPoint.findUnique({
        where: { userEmail: email },
        select: { id: true, balance: true },
      });

      if (!point) {
        throw new Error("Customer point account not found");
      }

      const newBalance = point.balance + amount;
      if (newBalance < 0) {
        throw new Error("Cannot reduce balance below zero");
      }

      const updated = await tx.customerPoint.update({
        where: { id: point.id },
        data: {
          balance: newBalance,
          totalSpent: amount < 0 ? { increment: Math.abs(amount) } : undefined,
        },
      });

      await tx.pointTransaction.create({
        data: {
          customerPointId: point.id,
          type: amount > 0 ? "earn" : "spend",
          amount,
          source: "admin",
          description: description ?? `Admin adjustment: ${amount > 0 ? "+" : ""}${amount} LP`,
          referenceId: null,
          referenceType: null,
          status: "completed",
        },
      });

      return updated;
    });

    await createAuditLog({
      userId: session.userId,
      action: "adjust",
      resource: "customer-points",
      resourceId: result.id,
      newValues: { email, amount, description },
    });

    return NextResponse.json({ data: result });
  } catch (error) {
    if (error instanceof Error && error.message.includes("below zero")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return handleError(error);
  }
}
