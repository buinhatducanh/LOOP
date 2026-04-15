/**
 * POST /api/portal/web-purchase
 *
 * Customer purchases a web package (template + domain + hosting).
 * Creates:
 * 1. Order (orderType: "web_package")
 * 2. CustomerWebsite (pending_config)
 * 3. OrderRevenueLine entries (VAT tracking)
 *
 * Requires customer auth. Does NOT process payment — redirects to payment flow.
 *
 * Body: {
 * name: string, // website name
 * packageId: string, // PricingWebPackage.id
 * domains: Array<{domain, tld, price}>, // multi-domain (preferred)
 * domain: string?, // legacy single domain
 *  domainTld: string?,
 * domainTermMonths: number,
 * domainCost: number, // VND
 * hostingPlanId: string?, // PricingHostingPlan.id
 * hostingTermMonths: number,
 * hostingCost: number, // VND
 * customerName: string,
 * customerEmail: string,
 * customerPhone: string?,
 * requirements?: string,
 * }
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/permissions";
import { handleError, ok, badRequest } from "@/lib/api";

const domainEntrySchema = z.object({
 domain: z.string().min(1),
 tld: z.string().optional(),
 price: z.number().int().min(0).default(0),
 available: z.boolean().optional().default(true),
});

const webPurchaseSchema = z.object({
 name: z.string().min(1, "Website name is required"),
 packageId: z.string().min(1, "Package is required"),
 domain: z.string().optional(), // legacy single domain
 domainTld: z.string().optional(),
 domainTermMonths: z.number().int().min(1).max(36).default(12),
 domainCost: z.number().int().min(0).default(0),
 hostingPlanId: z.string().optional(),
 hostingTermMonths: z.number().int().min(1).max(36).default(12),
 hostingCost: z.number().int().min(0).default(0),
 customerName: z.string().min(1),
 customerEmail: z.string().email(),
 customerPhone: z.string().optional(),
 requirements: z.string().optional(),
 domains: z.array(domainEntrySchema).optional().default([]), // multi-domain
});

export async function POST(req: NextRequest) {
 try {
  const session = await requireAuth(req);

 const body = await req.json();
 const parsed = webPurchaseSchema.safeParse(body);
 if (!parsed.success) {
 return badRequest(parsed.error.message);
 }

 const {
 name,
 packageId,
 domain,
 domainTld,
 domainTermMonths,
 domainCost,
 hostingPlanId,
 hostingTermMonths,
 hostingCost,
 customerName,
 customerEmail,
 customerPhone,
 requirements,
 domains,
 } = parsed.data;

 // ── Validate package exists ─────────────────────────────────────────────
 const pkg = await prisma.pricingWebPackage.findUnique({
 where: { id: packageId },
 select: { id: true, name: true, price: true },
 });
 if (!pkg) {
 return NextResponse.json({ error: "Package not found" }, { status: 404 });
 }

 // ── 1. Create Order ──────────────────────────────────────────────────────
 const orderNumber = `ORD-${crypto.randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase()}`;

 // Resolve domains: prefer new array, fallback to legacy single domain
 const resolvedDomains = domains.length > 0
 ? domains
 : (domain ? [{ domain, tld: domainTld, price: domainCost, available: true }] : []);

 const primaryDomain = resolvedDomains[0]?.domain ?? domain ?? "";
 const totalDomainCost = resolvedDomains.reduce((sum, d) => sum + (d.price ?? 0), 0);
 const totalAmount = pkg.price + totalDomainCost + hostingCost;

 const order = await prisma.order.create({
 data: {
 orderNumber,
 orderType: "web_package",
 packageId,
 customerName,
 customerEmail,
 customerPhone: customerPhone ?? null,
 requirements: requirements ?? null,
 domainName: primaryDomain,
 status: "pending_payment",
 paymentStatus: "unpaid",
 totalAmount,
 },
 select: {
 id: true,
 orderNumber: true,
 totalAmount: true,
 status: true,
 createdAt: true,
 },
 });

 // ── 2. Create CustomerWebsite (one per domain) ────────────────────────────
 const now = new Date();
 const hostingExpiresAt = new Date(now);
 hostingExpiresAt.setMonth(hostingExpiresAt.getMonth() + hostingTermMonths);

 const websiteCreates = resolvedDomains.map((d) => {
 const domainExpiresAt = new Date(now);
 domainExpiresAt.setMonth(domainExpiresAt.getMonth() + domainTermMonths);
 return {
 orderId: order.id,
 packageId,
 domain: d.domain,
 domainTld: d.tld ?? null,
 domainTermMonths,
 domainCost: d.price ?? 0,
 domainExpiresAt,
 hostingPlanId: hostingPlanId ?? null,
 hostingTermMonths,
 hostingCost,
 hostingExpiresAt,
 name: d.domain === primaryDomain ? name : `${name} — ${d.tld ?? d.domain.split(".").pop()}`,
 customerId: session.userId,
 customerName,
 customerEmail,
 customerPhone: customerPhone ?? null,
 configStatus: "pending_config",
 status: "active",
 };
 });

 await prisma.customerWebsite.createMany({ data: websiteCreates });

 // ── 3. Create OrderRevenueLine entries ───────────────────────────────────
 const revenueLines: Array<{
 orderId: string;
 category: string;
 serviceName: string;
 packageRef: string | null;
 quantity: number;
 unitPrice: number;
 totalPrice: number;
 periodMonths: number | null;
 taxable: boolean;
 taxRate: number;
 taxAmount: number;
 }> = [
 {
 orderId: order.id,
 category: "web_package",
 serviceName: pkg.name,
 packageRef: pkg.id,
 quantity: 1,
 unitPrice: pkg.price,
 totalPrice: pkg.price,
 periodMonths: null,
 taxable: true,
 taxRate: 0.10,
 taxAmount: Math.round(pkg.price * 0.10),
 },
 ];

 // One revenue line per domain
 for (const d of resolvedDomains) {
 if ((d.price ?? 0) > 0) {
 revenueLines.push({
 orderId: order.id,
 category: "domain",
 serviceName: `Domain ${d.domain} (${domainTermMonths} tháng)`,
 packageRef: null,
 quantity: 1,
 unitPrice: d.price ?? 0,
 totalPrice: d.price ?? 0,
 periodMonths: domainTermMonths,
 taxable: true,
 taxRate: 0.10,
 taxAmount: Math.round((d.price ?? 0) * 0.10),
 });
 }
 }

 if (hostingCost > 0) {
 revenueLines.push({
 orderId: order.id,
 category: "hosting",
 serviceName: `Hosting (${hostingTermMonths} tháng)`,
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

 await prisma.orderRevenueLine
 .createMany({ data: revenueLines })
 .catch(() => {/* non-fatal */});

 // ── 4. Notify admin ─────────────────────────────────────────────────────
 const domainList = resolvedDomains.length > 0
 ? resolvedDomains.map((d) => d.domain).join(", ")
 : (domain ?? "—");
 await prisma.adminNotification.create({
 data: {
 type: "web_purchase_pending",
 title: "Yêu cầu web package mới",
 message: `${customerName} vừa đặt web package "${pkg.name}" — domain ${domainList} cần xử lý.`,
 link: `/admin/web_packages?website=${order.id}`,
 priority: "high",
 isRead: false,
 },
 }).catch(() => {/* non-fatal */});

 return ok(
 {
 orderId: order.id,
 orderNumber: order.orderNumber,
 totalAmount: order.totalAmount,
 status: order.status,
 },
 201,
 );
 } catch (err) {
 return handleError(err);
 }
}
