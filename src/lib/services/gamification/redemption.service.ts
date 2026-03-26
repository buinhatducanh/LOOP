/**
 * LP Redemption Service
 *
 * Staff members spend available LP to redeem AddonService rewards.
 * Flow:
 *  1. Validate item is LP-redeemable (AddonService.lpCost != null)
 *  2. Check member has sufficient available LP
 *  3. Atomic: deduct LP, create LpRedemption, create LpTransaction(spend)
 *  4. Return redemption record
 *
 * For recurring items, expiresAt is set to +durationMonths from today.
 */

import { prisma } from "@/lib/prisma";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface RedeemParams {
  memberId: string;
  addonId: string;
  quantity?: number;   // default 1
  createdBy?: string;
}

export interface RedeemResult {
  ok: boolean;
  redemption?: Awaited<ReturnType<typeof prisma.lpRedemption.create>>;
  lpCost?: number;
  totalCost?: number;
  newBalance?: number;
  error?: string;
}

// ── Redeem ─────────────────────────────────────────────────────────────────────

export async function redeemLp(params: RedeemParams): Promise<RedeemResult> {
  const { memberId, addonId, quantity = 1, createdBy } = params;

  if (quantity <= 0) {
    return { ok: false, error: "Quantity must be at least 1" };
  }

  // ── Validate AddonService ───────────────────────────────────────────────────
  const addon = await prisma.addonService.findUnique({
    where: { id: addonId },
    select: { id: true, name: true, lpCost: true, type: true, isActive: true },
  });

  if (!addon) {
    return { ok: false, error: "Service not found" };
  }

  if (!addon.isActive) {
    return { ok: false, error: "This service is no longer available" };
  }

  if (addon.lpCost === null || addon.lpCost <= 0) {
    return { ok: false, error: "This service cannot be redeemed with LP" };
  }

  // ── Validate member balance ───────────────────────────────────────────────
  const member = await prisma.teamMember.findUnique({
    where: { id: memberId },
    select: { availableLp: true, name: true },
  });

  if (!member) {
    return { ok: false, error: "Member not found" };
  }

  const lpCost = addon.lpCost;
  const totalCost = lpCost * quantity;

  if (member.availableLp < totalCost) {
    return {
      ok: false,
      error: `Insufficient LP: have ${member.availableLp}, need ${totalCost} LP`,
    };
  }

  // ── Determine expiry ────────────────────────────────────────────────────────
  let expiresAt: Date | null = null;
  if (addon.type === "recurring") {
    // Default 1-month duration if no explicit metadata; extend if metadata specifies months
    const meta = addon as unknown as { metadata?: { durationMonths?: number } };
    const months = meta.metadata?.durationMonths ?? 1;
    const exp = new Date();
    exp.setMonth(exp.getMonth() + months);
    expiresAt = exp;
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const newBalance = member.availableLp - totalCost;

      // 1. Create redemption record
      const redemption = await tx.lpRedemption.create({
        data: {
          memberId,
          addonId,
          lpCost,
          quantity,
          expiresAt,
          status: "active",
        },
        include: {
          addon: { select: { id: true, name: true, nameVi: true } },
        },
      });

      // 2. Deduct LP from member
      await tx.teamMember.update({
        where: { id: memberId },
        data: { availableLp: newBalance },
      });

      // 3. Ledger entry (spend type)
      await tx.lpTransaction.create({
        data: {
          memberId,
          amount: -totalCost,
          balanceAfter: newBalance,
          type: "spend",
          status: "completed",
          description: `LP redemption: ${quantity}× ${addon.name} — ${totalCost} LP`,
          source: "spend",
          referenceId: redemption.id,
          referenceType: "LpRedemption",
          counterpartyId: null,
          fee: 0,
          createdBy: createdBy ?? memberId,
        },
      });

      return { redemption, newBalance };
    });

    return {
      ok: true,
      redemption: result.redemption,
      lpCost,
      totalCost,
      newBalance: result.newBalance,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Redemption failed";
    return { ok: false, error: message };
  }
}

// ── List redeemable items ──────────────────────────────────────────────────────

/** Fetch all active AddonServices that are LP-redeemable, ordered by lpCost. */
export async function listRedeemableItems() {
  const items = await prisma.addonService.findMany({
    where: {
      isActive: true,
      lpCost: { not: null },
    },
    select: {
      id: true,
      name: true,
      nameVi: true,
      description: true,
      descriptionVi: true,
      icon: true,
      type: true,
      lpCost: true,
      billingPeriod: true,
    },
    orderBy: { lpCost: "asc" },
  });
  // Prisma returns null for optional selects; filter + cast since where: lpCost: {not:null} guarantees non-null
  return items.filter((i): i is typeof i & { lpCost: number } => i.lpCost !== null);
}
