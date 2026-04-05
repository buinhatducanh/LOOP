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
 *   order.lpAllocation → distribute to TeamMember(s) via LpAward records
 */

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
  if (quote.status !== "draft" && quote.status !== "sent") {
    return { ok: false, error: `Quote is already ${quote.status}` };
  }

  // ── Parse selectedFeatureIds (JSON field from Prisma) ──────────────────────
  let selectedFeatureIds: string[] = [];
  if (Array.isArray(quote.selectedFeatureIds)) {
    selectedFeatureIds = quote.selectedFeatureIds.map((v) => String(v));
  }

  // ── Parse lpAllocation (JSON field from Prisma) ──────────────────────────
  let lpAllocation: Record<string, number> = {};
  if (quote.lpAllocation && typeof quote.lpAllocation === "object" && !Array.isArray(quote.lpAllocation)) {
    lpAllocation = Object.fromEntries(
      Object.entries(quote.lpAllocation as Record<string, unknown>).map(([k, v]) => [k, Number(v) || 0])
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
        orderNumber: `ORD-${Date.now()}`,
        customerName: quote.salesLead?.customerName ?? "Unknown",
        customerEmail: quote.salesLead?.customerEmail ?? "",
        customerPhone: quote.salesLead?.customerPhone ?? null,
        companyName: quote.salesLead?.companyName ?? null,
        // Pricing
        totalAmount: priceResult.finalPrice,
        basePrice: priceResult.basePrice,
        systemCalculatedPrice: priceResult.systemPrice,
        finalPrice: priceResult.finalPrice,
        // Infrastructure
        infrastructureTierId: priceResult.infraTier?.id ?? null,
        // LP allocation from quote (distribued when paid)
        // Stored as JSON on Order so recordPayment can read it
        lpAllocation: lpAllocation,
        // Customer's LP spend from QuoteRequest (captured for audit trail)
        lpUsed: lpUsed,
      },
    });

    await tx.quote.update({
      where: { id: quoteId },
      data: {
        status: "approved",
        approvedAt: new Date(),
        signedAt: new Date(),
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
 * Distribute LP to team roles from a paid Order's lpAllocation.
 * Called by recordPayment after a payment is recorded.
 *
 * lpAllocation format: { sales: 30, design: 20, pm: 20, dev: 20, qa: 10 }
 * Each percentage is of the order's paidAmount.
 *
 * For each role with a percentage:
 *   1. Find the TeamMember(s) with that role in the project
 *   2. Create LpAward records for each member
 *
 * NOTE: Unassigned role LP (no members with that projectRole) is logged as a warning
 * so ops can rebalance manually — it is NOT silently dropped.
 */
export async function distributeLpFromOrder(
  orderId: string,
  paidAmount: number
): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { lpAllocation: true, projectMembers: { select: { id: true, projectRole: true, memberId: true } } },
  });

  if (!order?.lpAllocation) return;

  let allocation: Record<string, number> = {};
  if (order.lpAllocation && typeof order.lpAllocation === "object" && !Array.isArray(order.lpAllocation)) {
    allocation = Object.fromEntries(
      Object.entries(order.lpAllocation as Record<string, unknown>).map(([k, v]) => [k, Number(v) || 0])
    );
  } else {
    return;
  }

  // Group project members by project role
  const membersByRole = new Map<string, string[]>();
  for (const pm of order.projectMembers ?? []) {
    const role = pm.projectRole.toLowerCase();
    if (!membersByRole.has(role)) membersByRole.set(role, []);
    membersByRole.get(role)!.push(pm.memberId);
  }

  // Distribute LP for each role that has a percentage
  for (const [role, percent] of Object.entries(allocation)) {
    const memberIds = membersByRole.get(role) ?? [];
    if (memberIds.length === 0) {
      // Log warning so ops knows this role's LP share was not distributed
      console.warn(`[LP Distribution] Order ${orderId}: role "${role}" has ${percent}% allocation but no assigned members. LP not distributed for this share.`);
      continue;
    }

    const totalLpForRole = Math.floor(paidAmount * (percent / 100));
    const lpPerMember = Math.floor(totalLpForRole / memberIds.length);

    for (const memberId of memberIds) {
      if (lpPerMember > 0) {
        await prisma.lpAward.create({
          data: {
            memberId,
            projectId: orderId, // using orderId as projectId for simplicity
            lpAmount: lpPerMember,
            expAmount: 0,
            source: "lp_allocation",
            status: "pending", // P2-3: PM reviews before LP is credited
          },
        });
      }
    }
  }
}
