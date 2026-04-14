/**
 * POST /api/portal/domain-purchase
 *
 * Customer purchases domain + hosting as part of a web package.
 * Creates/updates CustomerWebsite with domain/hosting fields and
 * creates OrderRevenueLine entries for VAT tracking.
 *
 * Body: {
 * orderId?: string, // existing order to attach to
 * packageId: string, // PricingWebPackage.id
 * domain: string, // full domain, e.g. "mystore.vn"
 * domainTld: string, // e.g. "vn"
 * domainTermMonths: number, // 12 or 24
 * domainCost: number, // VND cost for this purchase
 * hostingPlanId?: string, // PricingHostingPlan.id
 * hostingTermMonths: number, // 12 or 24
 * hostingCost: number, // VND cost
 * name: string, // website name
 * ekycName?: string,
 * ekycIdNumber?: string,
 * ekycDob?: string,
 * ekycAddress?: string,
 * }
 */
import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/permissions";
import { handleError, ok, badRequest } from "@/lib/api";

const purchaseSchema = z.object({
 orderId: z.string().optional(),
 packageId: z.string(),
 domain: z.string().min(1),
 domainTld: z.string().optional(),
 domainTermMonths: z.number().int().min(1).max(36).default(12),
 domainCost: z.number().int().min(0).default(0),
 hostingPlanId: z.string().optional(),
 hostingTermMonths: z.number().int().min(1).max(36).default(12),
 hostingCost: z.number().int().min(0).default(0),
 name: z.string().min(1),
 hostingProvider: z.string().optional(),
 ekycName: z.string().optional(),
 ekycIdNumber: z.string().optional(),
 ekycDob: z.string().optional(),
 ekycAddress: z.string().optional(),
});

export async function POST(req: NextRequest) {
 try {
 const session = await requireAuth(req);

 const body = await req.json();
 const parsed = purchaseSchema.safeParse(body);
 if (!parsed.success) return badRequest(parsed.error.message);

 const {
 orderId,
 packageId,
 domain,
 domainTld,
 domainTermMonths,
 domainCost,
 hostingPlanId,
 hostingTermMonths,
 hostingCost,
 name,
 ekycName,
 ekycIdNumber,
 ekycDob,
 ekycAddress,
 } = parsed.data;

 const now = new Date();

 // ── 1. Calculate expiry dates ─────────────────────────────────────────
 const domainExpiresAt = new Date(now);
 domainExpiresAt.setMonth(domainExpiresAt.getMonth() + domainTermMonths);

 const hostingExpiresAt = new Date(now);
 hostingExpiresAt.setMonth(hostingExpiresAt.getMonth() + hostingTermMonths);

 // ── 2. Create or get CustomerWebsite ──────────────────────────────────
 const website = await prisma.customerWebsite.create({
 data: {
 orderId: orderId ?? null,
 packageId,
 domain,
 domainTld: domainTld ?? null,
 domainTermMonths,
 domainCost,
 domainExpiresAt,
 hostingPlanId: hostingPlanId ?? null,
 hostingTermMonths,
 hostingCost,
 hostingExpiresAt,
 name,
 hostingProvider: null,
 customerId: session.userId,
 customerName: session.name,
 customerEmail: session.email,
 configStatus: "pending_config",
 status: "active",
 ekycName: ekycName ?? null,
 ekycIdNumber: ekycIdNumber ?? null,
 ekycDob: ekycDob ?? null,
 ekycAddress: ekycAddress ?? null,
 },
 select: {
 id: true,
 orderId: true,
 packageId: true,
 domain: true,
 configStatus: true,
 createdAt: true,
 },
 });

 // ── 3. Create revenue lines for VAT tracking ────────────────────────────
 if (orderId) {
 const revenueLines = [];

 // Web package revenue
 if (packageId) {
 revenueLines.push({
 orderId,
 category: "web_package",
 serviceName: "Web Package",
 packageRef: packageId,
 quantity: 1,
 unitPrice: 0,
 totalPrice: 0,
 taxable: true,
 taxRate: 0,
 taxAmount: 0,
 });
 }

 // Domain revenue
 if (domainCost > 0) {
 revenueLines.push({
 orderId,
 category: "domain",
 serviceName: `Domain ${domain} (${domainTermMonths} tháng)`,
 packageRef: null,
 quantity: 1,
 unitPrice: domainCost,
 totalPrice: domainCost,
 periodMonths: domainTermMonths,
 taxable: true,
 taxRate: 0.10,
 taxAmount: Math.round(domainCost * 0.10),
 });
 }

 // Hosting revenue
 if (hostingCost > 0) {
 revenueLines.push({
 orderId,
 category: "hosting",
 serviceName: `Hosting Plan (${hostingTermMonths} tháng)`,
 packageRef: hostingPlanId ?? null,
 quantity: 1,
 unitPrice: hostingCost,
 totalPrice: hostingCost,
 periodMonths: hostingTermMonths,
 taxable: true,
 taxRate: 0.10,
 taxAmount: Math.round(hostingCost * 0.10),
 });
 }

 if (revenueLines.length > 0) {
 await prisma.orderRevenueLine.createMany({ data: revenueLines }).catch(() => {/* non-fatal */});
 }
 }

 // ── 4. Notify admin ─────────────────────────────────────────────────────
 await prisma.adminNotification.create({
 data: {
 type: "domain_purchase",
 title: "Yêu cầu đăng ký domain & hosting",
 message: `${session.name} vừa mua web package — domain "${domain}" cần đăng ký.`,
 link: `/admin/web_packages?website=${website.id}`,
 priority: "normal",
 isRead: false,
 },
 });

 return ok(website, 201);
 } catch (err) {
 return handleError(err);
 }
}
