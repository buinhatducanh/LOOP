/**
 * Referral LP Reward Service
 *
 * Awards LP to the referring staff member when a referred order is paid.
 *
 * Tier Logic (per BA spec):
 *   Tier 1 (0–50M VND):   5% LP reward  (lpRate = 0.05)
 *   Tier 2 (50–200M VND): 7% LP reward  (lpRate = 0.07)
 *   Tier 3 (200M+ VND):   10% LP reward (lpRate = 0.10)
 *
 * Individual ReferralCode.lpRate overrides the tier rate when set.
 *
 * Flow:
 *   recordPayment() → awardReferralLpOnPayment()
 *     - Looks up order.referralCodeId
 *     - Computes LP = floor(paidAmount × lpRate / LP_VND_RATE)
 *     - Credits TeamMember.availableLp + creates LpTransaction(type=award, source=referral)
 *     - Updates ReferralTracking.lpAwarded
 *
 *   transitionOrderStatus() → awardReferralLpOnCompletion()
 *     - Awards LP for any remaining unpaid amount at order completion
 *     - Also checks if total paid revenue exceeded next tier threshold
 */

import { prisma } from "@/lib/prisma";
import { LP_VND_RATE } from "@/lib/constants";

// ── Types ───────────────────────────────────────────────────────────────────────

type ReferralTier = {
 minRevenue: number;
 maxRevenue: number | null;
 lpRate: number;
 label?: string;
};

// ── Constants ──────────────────────────────────────────────────────────────────

/** Default tiers (fallback if SiteSetting not configured) */
export const REFERRAL_TIERS_DEFAULT: ReferralTier[] = [
 { minRevenue: 0, maxRevenue: 50_000_000, lpRate: 0.05 },
 { minRevenue: 50_000_000, maxRevenue: 200_000_000, lpRate: 0.07 },
 { minRevenue: 200_000_000, maxRevenue: null, lpRate: 0.10 },
];

// Cache for admin-configured tiers (60s TTL)
let _cachedTiers: ReferralTier[] | null = null;
let _tiersCacheTime = 0;
const TierCacheTTL = 60_000;

/**
 * Load referral tiers from SiteSetting (cached).
 * Falls back to REFERRAL_TIERS_DEFAULT if not configured.
 */
export async function getReferralTiers() {
 if (_cachedTiers && Date.now() - _tiersCacheTime < TierCacheTTL) return _cachedTiers;
 try {
 const { prisma } = await import("@/lib/prisma");
 const setting = await prisma.siteSetting.findUnique({ where: { key: "referral_lp_tiers" } });
 if (setting?.value) {
 try {
 const parsed = JSON.parse(setting.value);
 if (Array.isArray(parsed) && parsed.length > 0) {
 _cachedTiers = parsed;
 _tiersCacheTime = Date.now();
 return _cachedTiers;
 }
 } catch { /* invalid JSON */ }
 }
 } catch { /* DB error */ }
 _cachedTiers = REFERRAL_TIERS_DEFAULT;
 _tiersCacheTime = Date.now();
 return _cachedTiers;
}

/** Invalidate tiers cache after admin updates SiteSetting. */
export function invalidateReferralTiersCache() { _cachedTiers = null; _tiersCacheTime = 0; }

/** Synchronous tier lookup using defaults. Use getReferralTiers() for admin rates. */
export function getTierLpRate(totalRevenueVnd: number): number {
  for (const tier of REFERRAL_TIERS_DEFAULT) {
    if (tier.maxRevenue === null || totalRevenueVnd <= tier.maxRevenue) {
      return tier.lpRate;
    }
  }
  return REFERRAL_TIERS_DEFAULT[REFERRAL_TIERS_DEFAULT.length - 1].lpRate;
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AwardReferralLpParams {
  orderId: string;
  orderNumber: string;
  paidAmount: number;  // amount just paid (VND) — LP = floor(paidAmount × rate / 20000)
  paymentId: string;
}

export interface AwardReferralLpResult {
  ok: boolean;
  lpAwarded?: number;
  referrerNewBalance?: number;
  tier?: number;
  lpRate?: number;
  error?: string;
}

// ── Core award function ──────────────────────────────────────────────────────

export async function awardReferralLpOnPayment(
  params: AwardReferralLpParams
): Promise<AwardReferralLpResult> {
  const { orderId, orderNumber, paidAmount, paymentId: _paymentId } = params;

  if (paidAmount <= 0) return { ok: true, lpAwarded: 0 };

  // ── Find order with referral code ──────────────────────────────────────────
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      referralCodeId: true,
      customerEmail: true,
    },
  });

  if (!order?.referralCodeId) {
    return { ok: true, lpAwarded: 0 }; // Not a referred order
  }

  // ── Load referral code + referrer ───────────────────────────────────────────
  const referralCode = await prisma.referralCode.findUnique({
    where: { id: order.referralCodeId },
    include: { member: { select: { id: true, name: true, availableLp: true } } },
  });

  if (!referralCode || !referralCode.isActive) {
    return { ok: true, lpAwarded: 0 }; // Code inactive
  }

  if (referralCode.expiresAt && new Date(referralCode.expiresAt) < new Date()) {
    return { ok: true, lpAwarded: 0 }; // Code expired
  }

  if (referralCode.useCount >= (referralCode.maxUses ?? Infinity)) {
    return { ok: true, lpAwarded: 0 }; // Usage limit reached
  }

  const referrer = referralCode.member;
  if (!referrer) return { ok: true, lpAwarded: 0 };

  // ── Compute LP reward ────────────────────────────────────────────────────────
  // 1. Get cumulative revenue from all completed orders via this code
  const completedOrders = await prisma.order.findMany({
    where: {
      referralCodeId: referralCode.id,
      status: { in: ["completed", "contracted", "delivered", "paid_full", "paid"] },
    },
    select: { paidAmount: true },
  });

  const totalRevenue = completedOrders.reduce((s: number, o: { paidAmount: number | null }) => s + (o.paidAmount ?? 0), 0) + paidAmount;

  // 2. Determine tier rate: use ReferralCode.lpRate if set, else get from tier logic
  const lpRate = referralCode.lpRate > 0 ? referralCode.lpRate : getTierLpRate(totalRevenue) /* sync fallback */;

  // 3. LP = floor(paidAmount × lpRate / LP_VND_RATE)
  const lpAwarded = Math.floor((paidAmount * lpRate) / LP_VND_RATE);

  if (lpAwarded <= 0) return { ok: true, lpAwarded: 0 };

  // ── Determine tier number for logging ───────────────────────────────────────
  const allTiers = await getReferralTiers();
 const tierNumber = allTiers.findIndex(
    (t) =>
      (t.maxRevenue === null || totalRevenue <= t.maxRevenue) &&
      totalRevenue >= t.minRevenue
  ) + 1;

  // ── Atomic: credit referrer + create ledger entries ─────────────────────────
  try {
    const result = await prisma.$transaction(async (tx) => {
      const newBalance = referrer.availableLp + lpAwarded;

      // Credit TeamMember.availableLp
      await tx.teamMember.update({
        where: { id: referrer.id },
        data: { availableLp: newBalance },
      });

      // LpTransaction for referrer
      await tx.lpTransaction.create({
        data: {
          memberId: referrer.id,
          amount: lpAwarded,
          balanceAfter: newBalance,
          type: "award",
          status: "completed",
          description: `Referral LP (${tierNumber}): order ${orderNumber} paid — +${lpAwarded} LP`,
          source: "referral",
          referenceId: orderId,
          referenceType: "Order",
          counterpartyId: null,
          fee: 0,
          createdBy: null,
        },
      });

      // Update ReferralTracking for the most recent order event
      const latestOrderTracking = await tx.referralTracking.findFirst({
        where: { referralCodeId: referralCode.id, orderId },
        orderBy: { createdAt: "desc" },
      });

      if (latestOrderTracking) {
        await tx.referralTracking.update({
          where: { id: latestOrderTracking.id },
          data: { lpAwarded },
        });
      }

      return { lpAwarded, newBalance, tierNumber, lpRate };
    });

    return {
      ok: true,
      lpAwarded: result.lpAwarded,
      referrerNewBalance: result.newBalance,
      tier: result.tierNumber,
      lpRate: result.lpRate,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "LP award failed";
    return { ok: false, error: message };
  }
}

// ── Reward on order completion (residual / tier upgrade) ────────────────────

export async function awardReferralLpOnCompletion(
  orderId: string,
  orderNumber: string,
  totalPaidAmount: number
): Promise<AwardReferralLpResult> {
  if (totalPaidAmount <= 0) return { ok: true, lpAwarded: 0 };

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { referralCodeId: true },
  });

  if (!order?.referralCodeId) return { ok: true, lpAwarded: 0 };

  const referralCode = await prisma.referralCode.findUnique({
    where: { id: order.referralCodeId },
    include: { member: { select: { id: true, name: true, availableLp: true } } },
  });

  if (!referralCode?.isActive || !referralCode.member) return { ok: true, lpAwarded: 0 };

  // Check tier upgrade: get all completed orders revenue total
  const completedOrders = await prisma.order.findMany({
    where: {
      referralCodeId: referralCode.id,
      status: { in: ["completed", "contracted", "delivered", "paid_full", "paid"] },
    },
    select: { paidAmount: true },
  });

  const totalRevenue = completedOrders.reduce((s: number, o: { paidAmount: number | null }) => s + (o.paidAmount ?? 0), 0);

  // Use individual code rate if set, else tier-based
  const lpRate = referralCode.lpRate > 0 ? referralCode.lpRate : getTierLpRate(totalRevenue) /* sync fallback */;
  const lpAwarded = Math.floor((totalPaidAmount * lpRate) / LP_VND_RATE);

  if (lpAwarded <= 0) return { ok: true, lpAwarded: 0 };

  const allTiers = await getReferralTiers();
 const tierNumber = allTiers.findIndex(
    (t) =>
      (t.maxRevenue === null || totalRevenue <= t.maxRevenue) &&
      totalRevenue >= t.minRevenue
  ) + 1;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const referrer = referralCode.member!;
      const newBalance = referrer.availableLp + lpAwarded;

      await tx.teamMember.update({
        where: { id: referrer.id },
        data: { availableLp: newBalance },
      });

      await tx.lpTransaction.create({
        data: {
          memberId: referrer.id,
          amount: lpAwarded,
          balanceAfter: newBalance,
          type: "award",
          status: "completed",
          description: `Referral completion bonus (Tier ${tierNumber}): order ${orderNumber} — +${lpAwarded} LP`,
          source: "referral",
          referenceId: orderId,
          referenceType: "Order",
          counterpartyId: null,
          fee: 0,
          createdBy: null,
        },
      });

      return { lpAwarded, newBalance };
    });

    return {
      ok: true,
      lpAwarded: result.lpAwarded,
      referrerNewBalance: result.newBalance,
      tier: tierNumber,
      lpRate,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "LP award failed";
    return { ok: false, error: message };
  }
}
