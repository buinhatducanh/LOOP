import { handleError } from "@/lib/api/response";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import { computeAvailableLp, reconcileBalance } from "@/lib/services/gamification/transaction.service";
import { addAvatar } from "@/lib/api/mappings";

// GET /api/admin/lp-transactions/[memberId]/balance
// Returns LP balance snapshot (locked, available, ledger total) for a member.

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ memberId: string }> }
) {
  try {
    await requirePermission("team", "read");

    const { memberId } = await params;
    const { searchParams } = new URL(req.url);
    const reconcile = searchParams.get("reconcile") === "true";

    const member = await prisma.teamMember.findUnique({
      where: { id: memberId },
      select: {
        id: true,
        name: true,
        role: true,
        image: true,
        lockedLp: true,
        availableLp: true,
        level: true,
        rank: true,
      },
    });

    if (!member) {
      return NextResponse.json({ error: "Team member not found" }, { status: 404 });
    }

    // ── Pending LP (locked) ──────────────────────────────────────────────────
    const pendingAgg = await prisma.lpAward.groupBy({
      by: ["memberId"],
      where: { memberId, status: "pending" },
      _sum: { lpAmount: true },
    });
    const pendingLp = pendingAgg[0]?._sum.lpAmount ?? 0;

    // ── Ledger-computed balance ─────────────────────────────────────────────
    let ledgerBalance = member.availableLp;
    if (reconcile) {
      ledgerBalance = await reconcileBalance(memberId);
    } else {
      ledgerBalance = await computeAvailableLp(memberId);
    }

    // ── Recent transactions ──────────────────────────────────────────────────
    const recentTxns = await prisma.lpTransaction.findMany({
      where: { memberId },
      orderBy: { createdAt: "desc" },
      take: 10,
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

    return NextResponse.json({
      data: {
        ...addAvatar(member),
        // Denormalized balances (authoritative)
        lockedLp: member.lockedLp,
        availableLp: member.availableLp,
        // Pending awards (real-time)
        pendingLp,
        // Total = available + locked (approved awards ready to use + pending)
        totalLp: member.availableLp + pendingLp,
        // Ledger-computed (consistency check)
        ledgerComputedBalance: ledgerBalance,
        ledgerInSync: ledgerBalance === member.availableLp,
        // Rank
        level: member.level,
        rank: member.rank,
        // Recent ledger
        recentTransactions: recentTxns,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
