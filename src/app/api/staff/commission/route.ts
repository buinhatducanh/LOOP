/**
 * GET /api/staff/commission
 *
 * Returns commission history + pending breakdown for the authenticated staff member.
 * Staff = users with accountType="staff" AND teamMemberId set.
 *
 * Note: SalesCommissionEvent only records CREDITED commissions (paidAt always set).
 * Pending commission is calculated from Orders + Enrollments where
 * salesRepId is set but commissionPaid = false.
 *
 * Bugs fixed from previous version:
 * - removed: createdAt (doesn't exist in SalesCommissionEvent)
 * - removed: enrollmentId (doesn't exist in SalesCommissionEvent)
 * - removed: paidAt: null queries (all events have paidAt set since event is created on credit)
 * - removed: pendingCommission from TeamMember (not decremented on credit, always 0)
 * - pending now calculated directly from Order + Enrollment tables
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";
import { handleError } from "@/lib/api/response";

// Commission rate constants (must match commission.service.ts)
const DIRECT_COMMISSION_PCT = 10; // 10%
const ADDON_COMMISSION_PCT = 5; // 5%
const LP_DIVISOR = 100_000; // LP_RATE(1000) * 100

function calcOrderCommissionLp(basePrice: number, addonTotal: number): number {
 const directLp = Math.round((basePrice * DIRECT_COMMISSION_PCT) / LP_DIVISOR);
 const addonLp = Math.round((addonTotal * ADDON_COMMISSION_PCT) / LP_DIVISOR);
 return directLp + addonLp;
}

function calcEnrollmentCommissionLp(paidAmount: number): number {
 return Math.round((paidAmount * DIRECT_COMMISSION_PCT) / LP_DIVISOR);
}

export async function GET(req: NextRequest) {
 try {
 const session = await requireAuth(req);

 // Only staff members with teamMemberId can have commissions
 if (session.accountType !== "staff" || !session.teamMemberId) {
 return NextResponse.json({ error: "Staff account required" }, { status: 403 });
 }

 const { teamMemberId } = session;

 // ── Completed commission summary from TeamMember fields ──────────────────────
  const teamMember = await prisma.teamMember.findUnique({
 where: { id: teamMemberId },
 select: {
 completedCommission: true,
 totalSalesCommission: true,
 },
 });

 if (!teamMember) {
 return NextResponse.json({ error: "Team member not found" }, { status: 404 });
 }

 // ── Pending commission: calculate from Orders + Enrollments ──────────────────
 // Pending = orders/enrollments where salesRepId is set but commissionPaid = false
 const [pendingOrders, pendingEnrollments] = await Promise.all([
 prisma.order.findMany({
 where: {
 salesRepId: teamMemberId,
 commissionPaid: false,
 status: { not: "cancelled" },
 },
 select: {
 id: true,
 orderNumber: true,
 customerName: true,
 basePrice: true,
 selectedAttributes: { select: { priceAtOrder: true } },
 status: true,
 createdAt: true,
 },
 }),
 prisma.enrollment.findMany({
 where: {
 salesRepId: teamMemberId,
 commissionPaid: false,
 status: { in: ["active", "completed"] },
 },
 select: {
 id: true,
 paidAmount: true,
 course: { select: { title: true } },
 enrolledAt: true,
 },
 }),
 ]);

 // Calculate pending LP for orders (direct 10% + addon 5%)
 const pendingOrderLp = pendingOrders.reduce((sum, order) => {
 const addonTotal = order.selectedAttributes.reduce(
 (s, a) => s + (a.priceAtOrder ?? 0),
 0
 );
 return sum + calcOrderCommissionLp(order.basePrice ?? 0, addonTotal);
 }, 0);

 // Calculate pending LP for enrollments (direct 10%)
 const pendingEnrollmentLp = pendingEnrollments.reduce(
 (sum, e) => sum + calcEnrollmentCommissionLp(e.paidAmount ?? 0),
 0
 );

 const pendingLp = pendingOrderLp + pendingEnrollmentLp;

 // ── Completed commission events (all have paidAt set) ───────────────────────
 // Use paidAt for ordering — createdAt does NOT exist in SalesCommissionEvent
 const completedEvents = await prisma.salesCommissionEvent.findMany({
 where: { salesRepId: teamMemberId },
 orderBy: { paidAt: "desc" },
 take: 50,
 include: {
 // Back-reference: include order/enrollment info when available
 order: {
 select: {
 id: true,
 orderNumber: true,
 customerName: true,
 status: true,
 },
 },
 },
 });

 // ── Pending details for display ────────────────────────────────────────────
 const pendingOrderDetails = pendingOrders.map((o) => ({
 type: "order" as const,
 referenceId: o.id,
 orderNumber: o.orderNumber,
 customerName: o.customerName,
 status: o.status,
 createdAt: o.createdAt,
 pendingLp: calcOrderCommissionLp(
 o.basePrice ?? 0,
 o.selectedAttributes.reduce((s, a) => s + (a.priceAtOrder ?? 0), 0)
 ),
 }));

 const pendingEnrollmentDetails = pendingEnrollments.map((e) => ({
 type: "enrollment" as const,
 referenceId: e.id,
 courseName: e.course.title,
 enrolledAt: e.enrolledAt,
 pendingLp: calcEnrollmentCommissionLp(e.paidAmount ?? 0),
 }));

 return NextResponse.json({
 summary: {
 pendingLp,
 completedLp: teamMember.completedCommission,
 totalLp: teamMember.totalSalesCommission,
 pendingCount: pendingOrders.length + pendingEnrollments.length,
 completedCount: completedEvents.length,
 },
 pendingDetails: [...pendingOrderDetails, ...pendingEnrollmentDetails],
 completedEvents: completedEvents.map((e) => ({
 id: e.id,
 salesRepId: e.salesRepId,
 referenceType: e.referenceType,
 referenceId: e.referenceId,
 directLp: e.directLp,
 addonLp: e.addonLp,
 totalLp: e.totalLp,
 paidAt: e.paidAt,
 order: e.order,
 })),
 });
 } catch (err) {
 return handleError(err);
 }
}
