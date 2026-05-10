/**
 * GET /api/portal/points — Customer's LP point balance
 * Requires customer auth (JWT cookie).
 */
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/permissions";
import { handleError } from "@/lib/api";
import { ok } from "@/lib/api/response";

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth();

    const customerPoint = await prisma.customerPoint.findUnique({
      where: { userEmail: session.email },
      include: {
        transactions: {
          orderBy: { createdAt: "desc" },
          take: 10,
          select: {
            id: true,
            type: true,
            amount: true,
            description: true,
            createdAt: true,
            referenceId: true,
          },
        },
      },
    });

    return ok({
      balance: customerPoint?.balance ?? 0,
      lifetimeEarned: customerPoint?.totalEarned ?? 0,
      lifetimeSpent: customerPoint?.totalSpent ?? 0,
      rank: "Iron",
      rankColor: "#9CA3AF",
      recentTransactions: (customerPoint?.transactions ?? []).map((tx: { id: string; type: string; amount: number; description: string; createdAt: Date; referenceId: string | null }) => ({
        id: tx.id,
        type: tx.type,
        amount: tx.amount,
        description: tx.description,
        createdAt: tx.createdAt,
        orderId: tx.referenceId ?? null,
      })),
    });
  } catch (err) {
    return handleError(err);
  }
}
