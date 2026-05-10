/**
 * Sales Commission Service
 *
 * Business rules:
 * - Direct commission: 10% of main service price (basePrice)
 * - Addon commission: 5% of addon prices (sum of OrderAttribute.priceAtOrder)
 * - Formula: LP = Math.round(amount * percentage / 100_000)
 * (rate: 1 LP = 1,000 VND, so 100_000 = LP_RATE * 100)
 * - Credit ONLY when Order.status = "completed" AND salesRepId is set
 * - Idempotent: check commissionPaid flag before crediting
 */

import { prisma } from "@/lib/prisma";

// Commission rate constants
const DIRECT_COMMISSION_PCT = 10; // 10%
const ADDON_COMMISSION_PCT = 5; // 5%
const LP_DIVISOR = 100_000; // LP_RATE(1000) * 100

export interface CommissionBreakdown {
 directLp: number;
 addonLp: number;
 totalLp: number;
}

/**
 * Calculate commission LP for an order.
 */
export function calculateOrderCommission(
 mainPrice: number, // main service price (VND)
 addonAmount: number // addon prices total (VND)
): CommissionBreakdown {
 const directLp = Math.round((mainPrice * DIRECT_COMMISSION_PCT) / LP_DIVISOR);
 const addonLp = Math.round((addonAmount * ADDON_COMMISSION_PCT) / LP_DIVISOR);
 return { directLp, addonLp, totalLp: directLp + addonLp };
}

/**
 * Credit sales commission for an order.
 * Idempotent — skips if commissionPaid is already true.
 * Returns the created event or null if skipped.
 */
export async function creditSalesCommissionForOrder(
 orderId: string
): Promise<{ credited: boolean; eventId?: string; error?: string }> {
 // Fetch order + addon attributes
 const order = await prisma.order.findUnique({
 where: { id: orderId },
 include: {
 selectedAttributes: { select: { priceAtOrder: true } },
 },
 });

 if (!order) {
 return { credited: false, error: "Order not found" };
 }

 if (!order.salesRepId) {
 return { credited: false, error: "No salesRepId assigned" };
 }

 if (order.commissionPaid) {
 return { credited: false, error: "Commission already credited" };
 }

 // Only credit on completed orders
 if (order.status !== "completed") {
 return { credited: false, error: `Order status is "${order.status}", expected "completed"` };
 }

 // Main service price (basePrice) and addon total from orderAttributes
 const mainPrice = order.basePrice ?? 0;
 const addonTotal = order.selectedAttributes.reduce((s: number, a: { priceAtOrder: number | null }) => s + (a.priceAtOrder ?? 0), 0);
 const { directLp, addonLp, totalLp } = calculateOrderCommission(mainPrice, addonTotal);

 // Atomic: create event + update order + update team member
 const event = await prisma.$transaction(async (tx) => {
 // Create audit trail event
 const created = await tx.salesCommissionEvent.create({
 data: {
 salesRepId: order.salesRepId!,
 referenceType: "order",
 referenceId: order.id,
 directLp,
 addonLp,
 totalLp,
 paidAt: new Date(),
 orderId: order.id,
 },
 });

 // Mark order as credited
 await tx.order.update({
 where: { id: orderId },
 data: { commissionPaid: true, commissionPaidAt: new Date() },
 });

 // Update team member: move from pending → completed
 await tx.teamMember.update({
 where: { id: order.salesRepId! },
 data: {
 completedCommission: { increment: totalLp },
 totalSalesCommission: { increment: totalLp },
 },
 });

 return created;
 });

 return { credited: true, eventId: event.id };
}

/**
 * Credit sales commission for an enrollment.
 * Idempotent — skips if commissionPaid is already true.
 */
export async function creditSalesCommissionForEnrollment(
 enrollmentId: string
): Promise<{ credited: boolean; eventId?: string; error?: string }> {
 const enrollment = await prisma.enrollment.findUnique({
 where: { id: enrollmentId },
 select: {
 id: true,
 salesRepId: true,
 commissionPaid: true,
 status: true,
 paidAmount: true,
 },
 });

 if (!enrollment) {
 return { credited: false, error: "Enrollment not found" };
 }

 if (!enrollment.salesRepId) {
 return { credited: false, error: "No salesRepId assigned" };
 }

 if (enrollment.commissionPaid) {
 return { credited: false, error: "Commission already credited" };
 }

 // Only credit completed or active enrollments (payment confirmed)
 if (enrollment.status !== "completed" && enrollment.status !== "active") {
 return { credited: false, error: `Enrollment status is "${enrollment.status}", expected "completed" or "active"` };
 }

 const paidAmount = enrollment.paidAmount ?? 0;
 // For enrollment, the full paid amount is the "main service" → direct commission
 const directLp = Math.round((paidAmount * DIRECT_COMMISSION_PCT) / LP_DIVISOR);
 const totalLp = directLp;

 const event = await prisma.$transaction(async (tx) => {
 const created = await tx.salesCommissionEvent.create({
 data: {
 salesRepId: enrollment.salesRepId!,
 referenceType: "enrollment",
 referenceId: enrollment.id,
 directLp,
 addonLp: 0,
 totalLp,
 paidAt: new Date(),
 enrollmentId: enrollment.id,
 },
 });

 await tx.enrollment.update({
 where: { id: enrollmentId },
 data: { commissionPaid: true, commissionPaidAt: new Date() },
 });

 await tx.teamMember.update({
 where: { id: enrollment.salesRepId! },
 data: {
 completedCommission: { increment: totalLp },
 totalSalesCommission: { increment: totalLp },
 },
 });

 return created;
 });

 return { credited: true, eventId: event.id };
}

/**
 * Assign sales rep to an order.
 * Prevents reassignment if commission already paid.
 */
export async function assignSalesRepToOrder(
 orderId: string,
 salesRepId: string
): Promise<{ success: boolean; error?: string }> {
 const order = await prisma.order.findUnique({
 where: { id: orderId },
 select: { salesRepId: true, commissionPaid: true },
 });

 if (!order) {
 return { success: false, error: "Order not found" };
 }

 if (order.commissionPaid) {
 return { success: false, error: "Cannot reassign: commission already credited" };
 }

 await prisma.order.update({
 where: { id: orderId },
 data: { salesRepId },
 });

 return { success: true };
}

/**
 * Credit sales commission for an enrollment using an existing transaction client.
 * Does NOT start its own transaction.
 */
export async function creditSalesCommissionForEnrollmentTx(
 enrollmentId: string,
 tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]
): Promise<{ credited: boolean; error?: string }> {
 const enrollment = await tx.enrollment.findUnique({
 where: { id: enrollmentId },
 select: {
 id: true,
 salesRepId: true,
 commissionPaid: true,
 status: true,
 paidAmount: true,
 },
 });

 if (!enrollment) return { credited: false, error: "Enrollment not found" };
 if (!enrollment.salesRepId) return { credited: false, error: "No salesRepId assigned" };
 if (enrollment.commissionPaid) return { credited: false, error: "Commission already credited" };

 if (enrollment.status !== "completed" && enrollment.status !== "active") {
 return { credited: false, error: `Enrollment status is "${enrollment.status}"` };
 }

 const paidAmount = enrollment.paidAmount ?? 0;
 const directLp = Math.round((paidAmount * DIRECT_COMMISSION_PCT) / LP_DIVISOR);
 const totalLp = directLp;

 await tx.salesCommissionEvent.create({
 data: {
 salesRepId: enrollment.salesRepId,
 referenceType: "enrollment",
 referenceId: enrollment.id,
 directLp,
 addonLp: 0,
 totalLp,
 paidAt: new Date(),
 enrollmentId: enrollment.id,
 },
 });

 await tx.enrollment.update({
 where: { id: enrollmentId },
 data: { commissionPaid: true, commissionPaidAt: new Date() },
 });

 await tx.teamMember.update({
 where: { id: enrollment.salesRepId },
 data: {
 completedCommission: { increment: totalLp },
 totalSalesCommission: { increment: totalLp },
 },
 });

 return { credited: true };
}

/**
 * Revoke a previously credited sales commission.
 * Deducts LP from teamMember.availableLp + commission tracking fields.
 * Reverts commissionPaid flag on source Order/Enrollment.
 */
export async function revokeSalesCommission(
 eventId: string,
 revokedBy: string,
 reason?: string
): Promise<{ revoked: boolean; error?: string }> {
 const event = await prisma.salesCommissionEvent.findUnique({
 where: { id: eventId },
 });

 if (!event) return { revoked: false, error: "Commission event not found" };

 // Prevent double-revoke via commissionPaid on the source
 let isRevoked = false;
 if (event.referenceType === "order" && event.orderId) {
 const order = await prisma.order.findUnique({
 where: { id: event.orderId },
 select: { commissionPaid: true },
 });
 isRevoked = order?.commissionPaid === false;
 } else if (event.referenceType === "enrollment" && event.enrollmentId) {
 const enrollment = await prisma.enrollment.findUnique({
 where: { id: event.enrollmentId },
 select: { commissionPaid: true },
 });
 isRevoked = enrollment?.commissionPaid === false;
 }
 if (isRevoked) return { revoked: false, error: "Commission already revoked" };

 if (event.totalLp === 0) return { revoked: false, error: "Nothing to revoke" };

 const member = await prisma.teamMember.findUnique({
 where: { id: event.salesRepId },
 select: { availableLp: true },
 });

 if (!member) return { revoked: false, error: "Team member not found" };

 await prisma.$transaction(async (tx) => {
 // Revert commissionPaid on source Order/Enrollment
 if (event.referenceType === "order" && event.orderId) {
 await tx.order.update({
 where: { id: event.orderId },
 data: { commissionPaid: false, commissionPaidAt: null },
 });
 } else if (event.referenceType === "enrollment" && event.enrollmentId) {
 await tx.enrollment.update({
 where: { id: event.enrollmentId },
 data: { commissionPaid: false, commissionPaidAt: null },
 });
 }

 // Deduct LP from team member
 const newAvailable = Math.max(0, member.availableLp - event.totalLp);
 await tx.teamMember.update({
 where: { id: event.salesRepId },
 data: {
 availableLp: newAvailable,
 completedCommission: { decrement: event.totalLp },
 totalSalesCommission: { decrement: event.totalLp },
 },
 });

 // Audit LP transaction
 await tx.lpTransaction.create({
 data: {
 memberId: event.salesRepId,
 amount: -event.totalLp,
 balanceAfter: newAvailable,
 type: "commission_revoke",
 status: "completed",
 description: `Thu hồi hoa hồng${reason ? `: ${reason}` : ""}`,
 source: "admin",
 referenceId: event.id,
 referenceType: "SalesCommissionEvent",
 createdBy: revokedBy,
 },
 });
 });

 return { revoked: true };
}

/**
 * Internal: credit sales commission using an existing transaction client.
 * Does NOT start its own transaction.
 */
export async function creditSalesCommissionForOrderTx(
 orderId: string,
 tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]
): Promise<{ credited: boolean; error?: string }> {
 // Fetch order + addon attributes (read-only, no tx needed for read)
 const order = await prisma.order.findUnique({
 where: { id: orderId },
 include: {
 selectedAttributes: { select: { priceAtOrder: true } },
 },
 });

 if (!order) return { credited: false, error: "Order not found" };
 if (!order.salesRepId) return { credited: false, error: "No salesRepId assigned" };
 if (order.commissionPaid) return { credited: false, error: "Commission already credited" };
 if (order.status !== "completed") return { credited: false, error: `Order status is "${order.status}"` };

 const mainPrice = order.basePrice ?? 0;
 const addonTotal = order.selectedAttributes.reduce((s: number, a: { priceAtOrder: number | null }) => s + (a.priceAtOrder ?? 0), 0);
 const { directLp, addonLp, totalLp } = calculateOrderCommission(mainPrice, addonTotal);

 await tx.salesCommissionEvent.create({
 data: {
 salesRepId: order.salesRepId,
 referenceType: "order",
 referenceId: order.id,
 directLp,
 addonLp,
 totalLp,
 paidAt: new Date(),
 orderId: order.id,
 },
 });

 await tx.order.update({
 where: { id: orderId },
 data: { commissionPaid: true, commissionPaidAt: new Date() },
 });

 await tx.teamMember.update({
 where: { id: order.salesRepId },
 data: {
 completedCommission: { increment: totalLp },
 totalSalesCommission: { increment: totalLp },
 },
 });

 return { credited: true };
}
