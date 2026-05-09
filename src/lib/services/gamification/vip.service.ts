/**
 * VIP Tier Service — Customer VIP promotion logic
 *
 * VIP Tiers (v8):
 * | Tier  | Min Spending | Min VIP Points | Discount Cap |
 * |---------|-------------|---------------|-------------|
 * | regular | 0 | 0 | 10% |
 * | vip1 | 10,000,000 | 100 | 15% |
 * | vip2 | 50,000,000 | 500 | 20% |
 * | vip3 | 100,000,000 | 1,000 | 25% |
 *
 * Rules:
 * - Tier is determined by BOTH spending AND VIP points — need BOTH conditions.
 * - Only promotes upward — never demotes.
 * - Call recalculateClientVip() after: payment, quest completion, referral conversion.
 */

import { prisma } from "@/lib/prisma";

// ── VIP Tier thresholds ────────────────────────────────────────────────────────

export interface VipTierConfig {
 tier: string;
 label: string;
 minSpending: number; // VNĐ
 minVipPoints: number;
 discountCap: number; // percentage
}

export const VIP_TIERS: VipTierConfig[] = [
 { tier: "regular", label: "Khách hàng", minSpending: 0, minVipPoints: 0, discountCap: 10 },
 { tier: "vip1", label: "VIP 1", minSpending: 10_000_000,  minVipPoints: 100, discountCap: 15 },
 { tier: "vip2", label: "VIP 2", minSpending: 50_000_000, minVipPoints: 500, discountCap: 20 },
 { tier: "vip3", label: "VIP 3", minSpending: 100_000_000, minVipPoints: 1000, discountCap: 25 },
];

export const VIP_TIER_ORDER = ["regular", "vip1", "vip2", "vip3"] as const;

/**
 * Compute the highest VIP tier the customer qualifies for based on spending + VIP points.
 * Returns the tier key or "regular" as default.
 */
export function computeVipTier(
 totalSpending: number,
 vipPoints: number
): string {
 let bestTier = "regular";
 for (const tier of VIP_TIERS) {
 // Both conditions must be met
 const spendingOk = totalSpending >= tier.minSpending;
 const pointsOk = vipPoints >= tier.minVipPoints;
 if (spendingOk && pointsOk) {
 // Only promote — never demote
 const currentIdx = VIP_TIER_ORDER.indexOf(bestTier as typeof VIP_TIER_ORDER[number]);
 const candidateIdx = VIP_TIER_ORDER.indexOf(tier.tier as typeof VIP_TIER_ORDER[number]);
 if (candidateIdx > currentIdx) {
 bestTier = tier.tier;
 }
 }
 }
 return bestTier;
}

/**
 * Recalculate and update VIP tier for a customer.
 * Call this after: payment recorded, quest completed, referral bonus awarded.
 *
 * Non-blocking — errors are caught internally.
 */
export async function recalculateClientVip(userIdOrEmail: string): Promise<void> {
 try {
 // Support both userId and userEmail lookup
 const whereClause = userIdOrEmail.includes("@")
 ? { userEmail: userIdOrEmail }
 : { userId: userIdOrEmail };

 const vipStatus = await prisma.clientVipStatus.findFirst({
 where: whereClause,
 });

 if (!vipStatus) return;

 // Get total spending from completed orders
 // Order links to customer via customerEmail (not userId)
 const ordersAgg = await prisma.order.aggregate({
 where: {
 customerEmail: vipStatus.userEmail,
 status: "done",
 },
 _sum: { paidAmount: true },
 });

 const totalSpending = ordersAgg._sum.paidAmount ?? 0;
 const newTier = computeVipTier(totalSpending, vipStatus.vipPoints);

 // Only promote, never demote
 const currentIdx = VIP_TIER_ORDER.indexOf(vipStatus.tier as typeof VIP_TIER_ORDER[number]);
 const newIdx = VIP_TIER_ORDER.indexOf(newTier as typeof VIP_TIER_ORDER[number]);

 if (newIdx > currentIdx) {
 await prisma.clientVipStatus.update({
 where: { id: vipStatus.id },
 data: {
 tier: newTier,
 totalSpending,
 },
 });

 // Fire promotion notification (non-blocking)
 const { createUserNotification } = await import("@/lib/services/notification.service");
 const tierConfig = VIP_TIERS.find((t: VipTierConfig) => t.tier === newTier);
 await createUserNotification({
 userId: vipStatus.userId ?? "",
 type: "vip_promotion",
 title: "Chúc mừng bạn lên VIP!",
 message: `Bạn đã được thăng lên hạng ${tierConfig?.label ?? newTier}. Giờ đây bạn được giảm giá tối đa ${tierConfig?.discountCap ?? 10}% khi sử dụng LP!`,
 link: "/khach-hang",
 });
 }
 } catch (err) {
 console.error("[vip.service] recalculateClientVip failed:", err);
 }
}
