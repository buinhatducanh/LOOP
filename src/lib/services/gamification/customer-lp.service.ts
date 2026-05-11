/**
 * Customer LP (Points) Service — GAMIFICATION VERSION
 *
 * DEPRECATED: Import from @/lib/services/customer/lp.service.ts instead.
 * This file is kept for backward compatibility during migration.
 *
 * Customers earn LP when they pay for orders.
 * Formula: LP earned = ceil(VND × 0.00005 × 0.10)
 *
 * Flow:
 *  1. recordPayment() → `awardCustomerLpOnPayment()`
 *  2. transitionOrderStatus() → `awardCustomerLpOnOrderComplete()`
 *
 * LP rate constant imported from @/lib/constants.ts
 */

import { prisma } from "@/lib/prisma";

// ── Constants (imported from shared constants) ──────────────────────────────────

import { LP_VND_RATE } from "@/lib/constants";
// Re-export so existing callers that import from this module still work
export { LP_VND_RATE };

/** LP earned per VND spent (before the 10% loyalty rate). */
export const LP_PER_VND = 1 / LP_VND_RATE;

/** Loyalty rate: customers receive 10% of spend as LP. */
export const CUSTOMER_LP_LOYALTY_RATE = 0.10;

/**
 * Convert VND amount to LP earned at loyalty rate.
 * round up to nearest integer for better UX.
 */
export function vndToLp(vndAmount: number, rate = CUSTOMER_LP_LOYALTY_RATE): number {
  if (vndAmount <= 0) return 0;
  return Math.ceil(vndAmount * LP_PER_VND * rate);
}

// ── XP / Level helpers for customers ──────────────────────────────────────────

function xpForCustomerLevel(level: number): number {
  return level * 100; // same formula as staff rank
}

function levelFromXp(totalXp: number): { level: number; currentXp: number } {
  let level = 1;
  let remaining = totalXp;
  while (xpForCustomerLevel(level) <= remaining) {
    remaining -= xpForCustomerLevel(level);
    level++;
  }
  return { level, currentXp: remaining };
}

// ── Award LP on payment ────────────────────────────────────────────────────────

export interface AwardCustomerLpParams {
  orderId: string;
  orderNumber: string;
  customerEmail: string;
  customerName: string;
  paidAmount: number; // amount just paid (VND)
  paymentId: string;
}

export interface AwardCustomerLpResult {
  ok: boolean;
  lpAwarded?: number;
  newBalance?: number;
  pointId?: string;
  error?: string;
}

/**
 * Award LP to a customer after a payment is recorded.
 * Creates or upserts CustomerPoint, then credits LP + creates PointTransaction.
 */
export async function awardCustomerLpOnPayment(
  params: AwardCustomerLpParams
): Promise<AwardCustomerLpResult> {
  const { orderId: _orderId, orderNumber, customerEmail, customerName, paidAmount, paymentId } = params;

  if (paidAmount <= 0) {
    return { ok: true, lpAwarded: 0 }; // nothing to award
  }

  const lpEarned = vndToLp(paidAmount);
  if (lpEarned <= 0) {
    return { ok: true, lpAwarded: 0 };
  }

  try {
    const result = await prisma.$transaction(async (tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]) => {
      // ── Find or create CustomerPoint ───────────────────────────────────────
      const existing = await tx.customerPoint.findUnique({
        where: { userEmail: customerEmail },
        select: { id: true, balance: true, totalEarned: true, level: true, currentXp: true },
      });

      let pointId: string;
      let newBalance: number;
      let newTotalEarned: number;
      let newLevel: number;
      let newCurrentXp: number;

      if (existing) {
        newBalance = existing.balance + lpEarned;
        newTotalEarned = existing.totalEarned + lpEarned;
        const xpResult = levelFromXp(newTotalEarned);
        newLevel = xpResult.level;
        newCurrentXp = xpResult.currentXp;

        await tx.customerPoint.update({
          where: { id: existing.id },
          data: {
            balance: newBalance,
            totalEarned: newTotalEarned,
            level: newLevel,
            currentXp: newCurrentXp,
          },
        });
        pointId = existing.id;
      } else {
        const totalXp = lpEarned;
        const xpResult = levelFromXp(totalXp);
        newBalance = lpEarned;
        newTotalEarned = lpEarned;
        newLevel = xpResult.level;
        newCurrentXp = xpResult.currentXp;

        const created = await tx.customerPoint.create({
          data: {
            userEmail: customerEmail,
            userName: customerName || null,
            balance: newBalance,
            totalEarned: newTotalEarned,
            level: newLevel,
            currentXp: newCurrentXp,
          },
          select: { id: true },
        });
        pointId = created.id;
      }

      // ── Create PointTransaction ledger entry ──────────────────────────────
      await tx.pointTransaction.create({
        data: {
          customerPointId: pointId,
          type: "earn",
          amount: lpEarned,
          source: "purchase",
          description: `Thanh toán đơn hàng ${orderNumber}: +${lpEarned} LP`,
          referenceId: paymentId,
          referenceType: "Payment",
          status: "completed",
        },
      });

      return {
        pointId,
        lpAwarded: lpEarned,
        newBalance,
        newTotalEarned,
        newLevel,
        newCurrentXp,
      };
    });

    return {
      ok: true,
      lpAwarded: result.lpAwarded,
      newBalance: result.newBalance,
      pointId: result.pointId,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "LP award failed";
    return { ok: false, error: message };
  }
}

// ── Award LP on order completion (residual / loyalty bonus) ─────────────────

export interface AwardCustomerLpOnCompleteParams {
  orderId: string;
  orderNumber: string;
  customerEmail: string;
  customerName: string;
  remainingPaidAmount: number; // any amount not yet awarded
}

export async function awardCustomerLpOnOrderComplete(
  params: AwardCustomerLpOnCompleteParams
): Promise<AwardCustomerLpResult> {
  // For now, the main flow is on payment.
  // This function is a hook for future loyalty bonuses on completion.
  // Simply delegate to the payment function for residual amounts.
  if (params.remainingPaidAmount <= 0) {
    return { ok: true, lpAwarded: 0 };
  }

  // If called, award from the completed order (source=upgrade for loyalty)
  try {
    const result = await prisma.$transaction(async (tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]) => {
      const existing = await tx.customerPoint.findUnique({
        where: { userEmail: params.customerEmail },
        select: { id: true, balance: true, totalEarned: true },
      });

      if (!existing) {
        // No account exists — skip
        return null;
      }

      const lpEarned = vndToLp(params.remainingPaidAmount);
      if (lpEarned <= 0) return null;

      const newBalance = existing.balance + lpEarned;
      const newTotalEarned = existing.totalEarned + lpEarned;
      const xpResult = levelFromXp(newTotalEarned);

      await tx.customerPoint.update({
        where: { id: existing.id },
        data: {
          balance: newBalance,
          totalEarned: newTotalEarned,
          level: xpResult.level,
          currentXp: xpResult.currentXp,
        },
      });

      await tx.pointTransaction.create({
        data: {
          customerPointId: existing.id,
          type: "earn",
          amount: lpEarned,
          source: "upgrade",
          description: `Đơn hàng ${params.orderNumber} hoàn tất: +${lpEarned} LP thưởng`,
          referenceId: params.orderId,
          referenceType: "Order",
          status: "completed",
        },
      });

      return { lpAwarded: lpEarned, newBalance };
    });

    if (!result) return { ok: true, lpAwarded: 0 };

    return {
      ok: true,
      lpAwarded: result.lpAwarded,
      newBalance: result.newBalance,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "LP award failed";
    return { ok: false, error: message };
  }
}
