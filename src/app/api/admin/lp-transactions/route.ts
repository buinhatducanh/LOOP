import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import { createTransaction } from "@/lib/lp/transaction";
import { createAuditLog } from "@/lib/auth/audit";
import { syncRankFields } from "@/lib/rank/xp";

// GET /api/admin/lp-transactions
// List LP transactions with optional filters.
// Query params: ?memberId=&type=&status=&from=&to=&page=&limit=

export async function GET(req: NextRequest) {
  try {
    await requirePermission("team", "read");

    const { searchParams } = new URL(req.url);
    const memberId = searchParams.get("memberId");
    const type = searchParams.get("type");
    const status = searchParams.get("status");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(50, parseInt(searchParams.get("limit") ?? "20", 10));

    const where: Record<string, unknown> = {};
    if (memberId) where.memberId = memberId;
    if (type) where.type = type;
    if (status) where.status = status;
    if (from || to) {
      where.createdAt = {};
      if (from) (where.createdAt as Record<string, unknown>).gte = new Date(from);
      if (to) (where.createdAt as Record<string, unknown>).lte = new Date(to);
    }

    const [transactions, total] = await Promise.all([
      prisma.lpTransaction.findMany({
        where,
        include: {
          member: { select: { id: true, name: true, role: true, image: true } },
          counterparty: { select: { id: true, name: true, role: true } },
          creator: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.lpTransaction.count({ where }),
    ]);

    return NextResponse.json({
      data: transactions,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

// POST /api/admin/lp-transactions
// Manual LP adjustment by admin (bonus / penalty).
// Body: { memberId, amount, description, reason? }

export async function POST(req: NextRequest) {
  try {
    const session = await requirePermission("team", "update");

    const { memberId, amount, description } = await req.json();

    if (!memberId || typeof amount !== "number" || amount === 0) {
      return NextResponse.json(
        { error: "memberId and non-zero amount are required" },
        { status: 400 }
      );
    }

    if (amount > 10_000 || amount < -10_000) {
      return NextResponse.json(
        { error: "Single adjustment cannot exceed ±10,000 LP" },
        { status: 400 }
      );
    }

    // Verify member exists
    const member = await prisma.teamMember.findUnique({
      where: { id: memberId },
      select: { id: true, name: true, availableLp: true },
    });
    if (!member) {
      return NextResponse.json({ error: "Team member not found" }, { status: 404 });
    }

    // Atomic: create transaction + update balance
    const result = await prisma.$transaction(async (tx) => {
      const newBalance = member.availableLp + amount;
      if (newBalance < 0) {
        throw new Error("Insufficient LP balance for this adjustment");
      }

      const txn = await tx.lpTransaction.create({
        data: {
          memberId,
          amount,
          balanceAfter: newBalance,
          type: "adjust",
          status: "completed",
          description: description ?? `Admin adjustment: ${amount > 0 ? "+" : ""}${amount} LP`,
          source: "admin",
          referenceId: null,
          referenceType: null,
          counterpartyId: null,
          fee: 0,
          createdBy: session.userId,
        },
      });

      await tx.teamMember.update({
        where: { id: memberId },
        data: { availableLp: newBalance },
      });

      // Re-rank after balance change
      const lpAgg = await tx.lpAward.aggregate({
        where: { memberId, status: "approved" },
        _sum: { lpAmount: true },
      });
      const totalLp = lpAgg._sum.lpAmount ?? 0;
      const { level, currentXp, maxXp, rank } = syncRankFields(totalLp);
      await tx.teamMember.update({
        where: { id: memberId },
        data: { level, currentXp, maxXp, rank },
      });

      return txn;
    });

    await createAuditLog({
      userId: session.userId,
      action: "adjust",
      resource: "lp-transactions",
      resourceId: result.id,
      newValues: { memberId, amount, description },
    });

    return NextResponse.json({ data: result }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    const status =
      message === "Unauthorized" ? 401
        : message === "Forbidden" ? 403
        : message.includes("Insufficient") ? 400
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
