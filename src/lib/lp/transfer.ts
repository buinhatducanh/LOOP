/**
 * LP Transfer Service
 *
 * Handles peer-to-peer LP transfers between staff members.
 * Rules:
 *  - Only available LP can be transferred (not locked).
 *  - Each transfer incurs a configurable fee (anti-spam).
 *  - Daily limit: max N transfers per member per day (configurable).
 *  - Sender must have enough available LP after fee.
 *  - Receiver receives net amount (amount - fee).
 *  - Both sender and receiver get LpTransaction ledger entries.
 */

import { prisma } from "@/lib/prisma";

// ── Config ─────────────────────────────────────────────────────────────────────

export const LP_TRANSFER_FEE = 10;          // LP deducted from sender, not credited to receiver
export const LP_TRANSFER_DAILY_LIMIT = 5; // max transfers per member per calendar day

// ── Types ──────────────────────────────────────────────────────────────────────

export interface TransferParams {
  fromMemberId: string;
  toMemberId: string;
  amount: number;        // LP to transfer (before fee)
  description?: string;
  createdBy?: string;    // TeamMember.id of the initiating user
}

export interface TransferResult {
  ok: boolean;
  transferId?: string;
  sentAmount: number;    // net amount receiver gets (amount - fee)
  fee: number;
  senderNewBalance: number;
  receiverNewBalance: number;
  error?: string;
}

export interface TransferLimitResult {
  usedToday: number;
  limit: number;
  remaining: number;
  canTransfer: boolean;
}

// ── Limit helpers ──────────────────────────────────────────────────────────────

/** Count how many transfers a member has made today (UTC calendar day). */
export async function countTodayTransfers(memberId: string): Promise<number> {
  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);

  const count = await prisma.lpTransaction.count({
    where: {
      memberId,
      type: "transfer_sent",
      status: "completed",
      createdAt: { gte: startOfDay },
    },
  });

  return count;
}

/** Check if a member can make another transfer today. */
export async function getTransferLimitStatus(
  memberId: string
): Promise<TransferLimitResult> {
  const usedToday = await countTodayTransfers(memberId);
  const remaining = Math.max(0, LP_TRANSFER_DAILY_LIMIT - usedToday);
  return {
    usedToday,
    limit: LP_TRANSFER_DAILY_LIMIT,
    remaining,
    canTransfer: remaining > 0,
  };
}

// ── Transfer execution ─────────────────────────────────────────────────────────

/**
 * Execute a peer-to-peer LP transfer.
 * All writes happen in a single atomic transaction.
 */
export async function executeTransfer(
  params: TransferParams
): Promise<TransferResult> {
  const { fromMemberId, toMemberId, amount, description, createdBy } = params;

  // ── Basic validation ────────────────────────────────────────────────────────
  if (fromMemberId === toMemberId) {
    return { ok: false, sentAmount: 0, fee: 0, senderNewBalance: 0, receiverNewBalance: 0,
      error: "Cannot transfer LP to yourself" };
  }

  if (amount <= 0) {
    return { ok: false, sentAmount: 0, fee: 0, senderNewBalance: 0, receiverNewBalance: 0,
      error: "Transfer amount must be positive" };
  }

  if (amount > 100_000) {
    return { ok: false, sentAmount: 0, fee: 0, senderNewBalance: 0, receiverNewBalance: 0,
      error: "Single transfer cannot exceed 100,000 LP" };
  }

  // ── Daily limit check ───────────────────────────────────────────────────────
  const limitStatus = await getTransferLimitStatus(fromMemberId);
  if (!limitStatus.canTransfer) {
    return {
      ok: false, sentAmount: 0, fee: LP_TRANSFER_FEE, senderNewBalance: 0, receiverNewBalance: 0,
      error: `Daily transfer limit reached (${limitStatus.limit}/${limitStatus.limit} used today)`,
    };
  }

  const fee = LP_TRANSFER_FEE;
  const netAmount = amount - fee; // receiver gets this

  try {
    const result = await prisma.$transaction(async (tx) => {
      // ── Read sender & receiver balances ──────────────────────────────────────
      const [sender, receiver] = await Promise.all([
        tx.teamMember.findUnique({ where: { id: fromMemberId }, select: { availableLp: true, name: true } }),
        tx.teamMember.findUnique({ where: { id: toMemberId },   select: { availableLp: true, name: true } }),
      ]);

      if (!sender) throw new Error("Sender not found");
      if (!receiver) throw new Error("Receiver not found");

      const cost = amount; // sender pays full amount (including fee)
      if (sender.availableLp < cost) {
        throw new Error(
          `Insufficient LP: have ${sender.availableLp}, need ${cost} (includes ${fee} LP transfer fee)`
        );
      }

      const senderNewBalance = sender.availableLp - cost;
      const receiverNewBalance = receiver.availableLp + netAmount;

      // ── Write ledger entries (sender first, then receiver) ──────────────────
      const senderTxn = await tx.lpTransaction.create({
        data: {
          memberId: fromMemberId,
          amount: -amount,               // negative = debit
          balanceAfter: senderNewBalance,
          type: "transfer_sent",
          status: "completed",
          description: description ?? `LP transfer to ${receiver.name ?? toMemberId}: -${amount} LP (${fee} LP fee)`,
          source: "transfer",
          referenceId: null,
          referenceType: "LpTransaction",
          counterpartyId: toMemberId,
          fee,
          createdBy: createdBy ?? fromMemberId,
        },
      });

      await tx.lpTransaction.create({
        data: {
          memberId: toMemberId,
          amount: netAmount,            // positive = credit (net of fee)
          balanceAfter: receiverNewBalance,
          type: "transfer_received",
          status: "completed",
          description: description ?? `LP transfer from ${sender.name ?? fromMemberId}: +${netAmount} LP`,
          source: "transfer",
          referenceId: senderTxn.id,    // link back to sender's transfer record
          referenceType: "LpTransaction",
          counterpartyId: fromMemberId,
          fee: 0,                       // fee is charged only to sender
          createdBy: createdBy ?? fromMemberId,
        },
      });

      // ── Update balances ─────────────────────────────────────────────────────
      await Promise.all([
        tx.teamMember.update({
          where: { id: fromMemberId },
          data: { availableLp: senderNewBalance },
        }),
        tx.teamMember.update({
          where: { id: toMemberId },
          data: { availableLp: receiverNewBalance },
        }),
      ]);

      return { transferId: senderTxn.id, senderNewBalance, receiverNewBalance };
    });

    return {
      ok: true,
      transferId: result.transferId,
      sentAmount: netAmount,
      fee,
      senderNewBalance: result.senderNewBalance,
      receiverNewBalance: result.receiverNewBalance,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Transfer failed";
    return {
      ok: false, sentAmount: netAmount, fee,
      senderNewBalance: 0, receiverNewBalance: 0,
      error: message,
    };
  }
}
