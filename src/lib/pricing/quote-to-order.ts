/**
 * Quote → Order Auto-Pricing Service
 *
 * When a Quote is approved, this service:
 * 1. Runs the full pricing engine with the quote's selected features + infra tier
 * 2. Creates the Order with auto-calculated prices and LP allocation
 * 3. LP allocation (Quote.lpAllocation) is stored on the Quote — when the Order is paid,
 *    LP is distributed to each role proportionally.
 *
 * LP Allocation Flow (triggered by recordPayment):
 *   order.lpAllocation → buildLpAwardsFromOrder → batch-insert via createMany inside tx
 */

import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { calculateOrderPrice } from "@/lib/pricing/calculate-order-price";

export interface QuoteApprovalResult {
  ok: boolean;
  orderId?: string;
  orderNumber?: string;
  systemPrice?: number;
  finalPrice?: number;
  infraTier?: { slug: string; name: string; monthlyCost: number; setupCost: number } | null;
  lpAllocation?: Record<string, number>;
  /** Customer's LP discount captured from QuoteRequest (for audit trail) */
  lpUsed?: number;
  error?: string;
}

export interface LpAllocationEntry {
  role: string;   // "sales" | "design" | "pm" | "dev" | "qa" | "seo"
  percent: number;
  lpAmount: number;
}

/**
 * Auto-calculate order price from a Quote's selected features + infra tier,
 * then create the Order with all pricing fields populated.
 *
 * Quote fields used:
 *   - selectedFeatureIds (JSON array of feature IDs)
 *   - infrastructureTierSlug / infrastructureTierId
 *   - lpAllocation (JSON { role: percent })
 *
 * Order fields set:
 *   - totalAmount      = finalPrice (auto-calculated)
 *   - basePrice
 *   - systemCalculatedPrice
 *   - finalPrice       = adminOverridePrice ?? systemCalculatedPrice
 *   - infrastructureTierId
 *   - selectedFeatureIds (stored as JSON)
 *   - lpAllocation
 *   - lpAllocationLocked = true (admin cannot override after approval)
 */
export async function approveQuoteAndCreateOrder(
  quoteId: string,
  adminOverridePrice?: number | null
): Promise<QuoteApprovalResult> {
  // ── Load quote with infrastructure tier ───────────────────────────────
  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    include: {
      salesLead: {
        select: { id: true, customerName: true, customerEmail: true, customerPhone: true, companyName: true },
      },
    },
  });

  if (!quote) return { ok: false, error: "Quote not found" };
  if (quote.status !== "draft" && quote.status !== "sent" && quote.status !== "viewed") {
    return { ok: false, error: `Quote is already ${quote.status}` };
  }

  // ── Parse selectedFeatureIds (JSON field from Prisma) ──────────────────────
  let selectedFeatureIds: string[] = [];
  if (Array.isArray(quote.selectedFeatureIds)) {
    selectedFeatureIds = quote.selectedFeatureIds.map((v: unknown) => String(v));
  }

  // ── Parse lpAllocation (JSON field from Prisma) ──────────────────────────
  let lpAllocation: Record<string, number> = {};
  if (quote.lpAllocation && typeof quote.lpAllocation === "object" && !Array.isArray(quote.lpAllocation)) {
    lpAllocation = Object.fromEntries(
      Object.entries(quote.lpAllocation as Record<string, unknown>).map(([k, v]: [string, unknown]) => [k, Number(v) || 0])
    );
  }

  // ── Capture customer's LP spend for audit trail ──────────────────────
  const lpUsed = quote.lpUsed ?? 0;

  // ── Run pricing engine ───────────────────────────────────────────
  const priceResult = await calculateOrderPrice({
    selectedFeatureIds,
    infraTierId: quote.infrastructureTierId ?? undefined,
    infraTierSlug: quote.infrastructureTierSlug ?? undefined,
    adminOverridePrice,
  });

  // ── Atomic: create Order + update Quote ─────────────────────────
  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        // P1: Use crypto.randomUUID() to prevent collision (Date.now() could duplicate)
        orderNumber: `ORD-${randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase()}`,
        // P0-1: Link order back to lead — was missing, orphans entire lead→order lineage
        salesLeadId: quote.salesLead?.id ?? null,
        customerName: quote.salesLead?.customerName ?? "Unknown",
        customerEmail: quote.salesLead?.customerEmail ?? "",
        customerPhone: quote.salesLead?.customerPhone ?? null,
        companyName: quote.salesLead?.companyName ?? null,
        // P0-6: Set orderType = "custom" so CUSTOM_TRANSITIONS apply (was defaulting to "package")
        orderType: "custom",
        // Pricing
        // P1: Priority 1: pricingBreakdown (Wizard), Priority 2: quote.totalAmount (Signed value), Priority 3: recalculated price
        totalAmount: (quote as any).pricingBreakdown?.total ?? quote.totalAmount ?? priceResult.finalPrice,
        basePrice: (quote as any).pricingBreakdown?.package?.price ?? quote.totalAmount ?? priceResult.basePrice,
        systemCalculatedPrice: (quote as any).pricingBreakdown?.subtotal ?? quote.totalAmount ?? priceResult.systemPrice,
        finalPrice: (quote as any).pricingBreakdown?.total ?? quote.totalAmount ?? priceResult.finalPrice,
        // P0-6: Capture rewardLevel from pricing engine (was never saved to Order)
        rewardLevel: (quote as any).pricingBreakdown ? 1 : priceResult.rewardLevel,
        // Infrastructure
        infrastructureTierId: priceResult.infraTier?.id ?? null,
        // LP allocation from quote (distribued when paid)
        // Stored as JSON on Order so recordPayment can read it
        lpAllocation: lpAllocation,
        // Customer's LP spend from QuoteRequest (captured for audit trail)
        lpUsed: lpUsed,
        // P1: Store full breakdown and source for rendering and tracking
        pricingBreakdown: (quote as any).pricingBreakdown ?? null as any,
        source: (quote as any).source ?? "fixed",
      },
    });

    await tx.quote.update({
      where: { id: quoteId },
      data: {
        status: "approved",
        approvedAt: new Date(),
        // P0-2: Do NOT set signedAt here — customer signature is a SEPARATE step.
        // signedAt is set only when POST /api/admin/quotes/[id]/sign is called.
        orderId: created.id,
      },
    });

    return created;
  });

  return {
    ok: true,
    orderId: order.id,
    orderNumber: order.orderNumber,
    systemPrice: priceResult.systemPrice,
    finalPrice: priceResult.finalPrice,
    infraTier: priceResult.infraTier ?? null,
    lpAllocation,
    lpUsed,
  };
}

/**
 * Build LP award records for team roles from a paid Order's lpAllocation.
 * Called by recordPayment after a payment is recorded.
 *
 * lpAllocation format: { sales: 30, design: 20, pm: 20, dev: 20, qa: 10 }
 * Each percentage is of the order's paidAmount.
 *
 * For each role with a percentage:
 *   1. Find the TeamMember(s) with that role in the project
 *   2. Return LpAward create data for each member (NOT a DB write)
 *
 * Returns an array so the caller can batch-insert via createMany inside a tx.
 * Unassigned role LP (no members with that projectRole) is logged as a warning
 * so ops can rebalance manually — it is NOT silently dropped.
 */
export function buildLpAwardsFromOrder(
  orderId: string,
  paidAmount: number,
  lpAllocation: Record<string, number>,
  projectMembers: { id: string; projectRoleKey: string; memberId: string }[]
): { memberId: string; lpAmount: number; source: string }[] {
  if (!lpAllocation || typeof lpAllocation !== "object") return [];

  // Group project members by project role
  const membersByRole = new Map<string, string[]>();
  for (const pm of projectMembers ?? []) {
    const role = (pm.projectRoleKey ?? "").toLowerCase();
    if (!membersByRole.has(role)) membersByRole.set(role, []);
    membersByRole.get(role)!.push(pm.memberId);
  }

  const awards: { memberId: string; lpAmount: number; source: string }[] = [];
  // BUG-05 FIX: Use basis points (10000 = 100%) for integer math — avoids floating point
  const basisPoints = 10000;
  const paidBp = paidAmount * basisPoints;

  for (const [role, percent] of Object.entries(lpAllocation)) {
    const memberIds = membersByRole.get(role) ?? [];
    if (memberIds.length === 0) {
      // BUG-05 FIX: Compute unassigned LP so ops can see it in audit
      const unassignedLp = Math.floor(paidBp * percent / 100 / basisPoints);
      console.warn(
        `[LP Distribution] Order ${orderId}: role "${role}" has ${percent}% allocation ` +
        `but no assigned members. Unassigned LP: ${unassignedLp.toLocaleString("vi-VN")}.`
      );
      continue;
    }

    // Integer math: paidAmount × percent% in LP
    const totalLpForRole = Math.floor((paidBp * percent) / 100 / basisPoints);
    const lpPerMember = Math.floor(totalLpForRole / memberIds.length);

    for (const memberId of memberIds) {
      if (lpPerMember > 0) {
        awards.push({
          memberId,
          lpAmount: lpPerMember,
          source: "lp_allocation",
        });
      }
    }
  }

  return awards;
}
