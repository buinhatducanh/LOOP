/**
 * LP Transaction Service
 *
 * All LP mutations go through this module to keep the ledger consistent.
 * Callers must wrap these in their own Prisma transactions where needed.
 */

import { prisma } from "@/lib/prisma";

// ── Types ────────────────────────────────────────────────────────────────────

export type LpTransactionType =
  | "award"          // PM approved an LpAward
  | "transfer_sent"  // Member sent LP to another member
  | "transfer_received" // Member received LP from another member
  | "spend"          // Member spent LP on redemption
  | "adjust"         // Admin manual adjustment (bonus / penalty)
  | "expire";        // LP auto-expired

export type LpTransactionStatus = "pending" | "completed" | "failed" | "cancelled";

export interface CreateTransactionParams {
  memberId: string;
  amount: number;         // positive = credit, negative = debit
  type: LpTransactionType;
  status?: LpTransactionStatus;
  description?: string;
  source?: string;
  referenceId?: string;
  referenceType?: string;
  counterpartyId?: string;
  fee?: number;
  createdBy?: string;
}

/**
 * Compute current balance from ledger (fallback / consistency check).
 * Should match TeamMember.availableLp after every mutation.
 */
export async function computeAvailableLp(memberId: string): Promise<number> {
  const agg = await prisma.lpTransaction.aggregate({
    where: { memberId, status: "completed" },
    _sum: { amount: true },
  });
  return agg._sum.amount ?? 0;
}

/**
 * Append a single transaction to the ledger and update TeamMember balances.
 * WARNING: Does NOT run in a transaction — caller is responsible for wrapping
 * in `prisma.$transaction()` if atomicity is required.
 */
export async function createTransaction(
  params: CreateTransactionParams
): Promise<{ transaction: Awaited<ReturnType<typeof prisma.lpTransaction.create>>; balanceAfter: number }> {
  const {
    memberId,
    amount,
    type,
    status = "completed",
    description,
    source = "manual",
    referenceId,
    referenceType,
    counterpartyId,
    fee = 0,
    createdBy,
  } = params;

  // ── Fetch current balance ───────────────────────────────────────────────────
  const member = await prisma.teamMember.findUnique({
    where: { id: memberId },
    select: { availableLp: true, lockedLp: true },
  });

  if (!member) throw new Error(`TeamMember ${memberId} not found`);

  const balanceAfter = member.availableLp + amount;
  if (balanceAfter < 0) {
    throw new Error(`Insufficient available LP: have ${member.availableLp}, tried to deduct ${Math.abs(amount)}`);
  }

  // ── Update TeamMember ───────────────────────────────────────────────────────
  const updateData: { availableLp: number; lockedLp?: number } = { availableLp: balanceAfter };
  if (type === "award") {
    // Awards lock LP until approved; but here we're only called post-approval
    // so it's a direct credit to available LP.
  }

  await prisma.teamMember.update({
    where: { id: memberId },
    data: updateData,
  });

  // ── Write ledger entry ───────────────────────────────────────────────────────
  const transaction = await prisma.lpTransaction.create({
    data: {
      memberId,
      amount,
      balanceAfter,
      type,
      status,
      description,
      source,
      referenceId,
      referenceType,
      counterpartyId,
      fee,
      createdBy,
    },
  });

  return { transaction, balanceAfter };
}

/**
 * Re-compute and correct TeamMember.availableLp from the full ledger.
 * Use for ad-hoc repair / reconciliation.
 */
export async function reconcileBalance(memberId: string): Promise<number> {
  const computed = await computeAvailableLp(memberId);

  await prisma.teamMember.update({
    where: { id: memberId },
    data: { availableLp: computed },
  });

  return computed;
}
