import { handleError, ok } from "@/lib/api/response";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import { createAuditLog } from "@/lib/auth/audit";

// GET — single CustomerWebsite with relations
export async function GET(
 _req: NextRequest,
 { params }: { params: Promise<{ id: string }> }
) {
 try {
 await requirePermission("customer-websites", "read");
 const { id } = await params;

 const website = await prisma.customerWebsite.findUnique({
 where: { id },
 include: {
 order: { select: { id: true, orderNumber: true, customerName: true } },
 websiteStats: { orderBy: { date: "desc" }, take: 30 },
 pageViews: { orderBy: { date: "desc" }, take: 50 },
 hostingPlan: { select: { id: true, name: true, nameVi: true, slug: true, monthlyPrice: true, months: true, discountPct: true } },
 package: { select: { id: true, name: true, nameVi: true, slug: true, price: true, templateRepoUrl: true } },
 },
 });

 if (!website) {
 return NextResponse.json({ error: "Customer website not found" }, { status: 404 });
 }

 // Compute summary stats
 const stats = website.websiteStats;
 const totalVisitors = stats.reduce((sum: number, s: typeof stats[number]) => sum + s.visitors, 0);
 const totalPageViews = stats.reduce((sum: number, s: typeof stats[number]) => sum + s.pageViews, 0);
 const avgUptime =
 stats.length > 0 ? stats.reduce((sum: number, s: typeof stats[number]) => sum + s.uptime, 0) / stats.length : 100;
 const responseTimeStats = stats.filter((s: typeof stats[number]) => s.responseTime != null);
 const avgResponseTime =
 responseTimeStats.length > 0
 ? responseTimeStats.reduce((sum: number, s: typeof stats[number]) => sum + (s.responseTime ?? 0), 0) /
 responseTimeStats.length
 : 0;

 // Top pages
 const pageViews = website.pageViews;
 const pageViewsByUrl = pageViews.reduce((acc: Record<string, { pageUrl: string; pageTitle: string | null; views: number }>, pv: typeof pageViews[number]) => {
 if (!acc[pv.pageUrl]) acc[pv.pageUrl] = { pageUrl: pv.pageUrl, pageTitle: pv.pageTitle, views: 0 };
 acc[pv.pageUrl].views += pv.views;
 return acc;
 }, {} as Record<string, { pageUrl: string; pageTitle: string | null; views: number }>);

 const topPages = (Object.values(pageViewsByUrl) as Array<{ pageUrl: string; pageTitle: string | null; views: number }>)
 .sort((a, b) => b.views - a.views)
 .slice(0, 10);

 return NextResponse.json({
 data: {
 id: website.id,
 orderId: website.orderId,
 packageId: website.packageId,
 domain: website.domain,
 subdomain: website.subdomain,
 name: website.name,
 description: website.description,
 hostingProvider: website.hostingProvider,
 hostingUrl: website.hostingUrl,
 customerId: website.customerId,
 customerName: website.customerName,
 customerEmail: website.customerEmail,
 customerPhone: website.customerPhone,
 status: website.status,
 configStatus: website.configStatus,
 isMonitored: website.isMonitored,
 deployedAt: website.deployedAt,
 deployedUrl: website.deployedUrl,
 expiresAt: website.expiresAt,
 ekycName: website.ekycName,
 ekycIdNumber: website.ekycIdNumber,
 ekycDob: website.ekycDob,
 ekycAddress: website.ekycAddress,
 // Domain purchase fields
 registeredAt: website.registeredAt,
 domainTermMonths: website.domainTermMonths,
 domainCost: website.domainCost,
 domainTld: website.domainTld,
 // Hosting purchase fields
 hostingPlanId: website.hostingPlanId,
 hostingTermMonths: website.hostingTermMonths,
 hostingCost: website.hostingCost,
 hostingPlan: website.hostingPlan,
 // Vercel deployment
 vercelProjectId: website.vercelProjectId,
 vercelProjectUrl: website.vercelProjectUrl,
 // Auto-renew
 autoRenewDomain: website.autoRenewDomain,
 autoRenewHosting: website.autoRenewHosting,
 // Separate expiry timestamps
 domainExpiresAt: website.domainExpiresAt,
 hostingExpiresAt: website.hostingExpiresAt,
 // Relations
 package: website.package,
 createdAt: website.createdAt,
 updatedAt: website.updatedAt,
 order: website.order,
 summary: {
 totalVisitors,
 totalPageViews,
 avgUptime: avgUptime.toFixed(2),
 avgResponseTime: Math.round(avgResponseTime),
 totalDays: stats.length,
 },
 topPages,
 },
 });
 } catch (error) {
 return handleError(error);
 }
}

// PATCH — update fields
export async function PATCH(
 req: NextRequest,
 { params }: { params: Promise<{ id: string }> }
) {
 try {
 const session = await requirePermission("customer-websites", "update");
 const { id } = await params;
 const body = await req.json();

 const existing = await prisma.customerWebsite.findUnique({ where: { id } });
 if (!existing) {
 return NextResponse.json({ error: "Customer website not found" }, { status: 404 });
 }

 // Whitelist allowed update fields — includes all new web package fields
 const updateData: Record<string, unknown> = {};
 const allowedFields = [
 "configStatus",
 "deployedUrl",
 "deployedAt",
 "status",
 "domain",
 "subdomain",
 "hostingProvider",
 "hostingUrl",
 "ekycName",
 "ekycIdNumber",
 "ekycDob",
 "ekycAddress",
 "isMonitored",
 "expiresAt",
 "customerName",
 "customerEmail",
 "customerPhone",
 // Domain purchase fields
 "registeredAt",
 "domainTermMonths",
 "domainCost",
 "domainTld",
 // Hosting purchase fields
 "hostingPlanId",
 "hostingTermMonths",
 "hostingCost",
 // Vercel deployment
 "vercelProjectId",
 "vercelProjectUrl",
 // Auto-renew
 "autoRenewDomain",
 "autoRenewHosting",
 // Separate expiry timestamps
 "domainExpiresAt",
 "hostingExpiresAt",
 ];
 for (const field of allowedFields) {
 if (field in body) {
 let value = body[field];
 // Parse date strings
 if (
 (field === "registeredAt" || field === "deployedAt" || field === "expiresAt" ||
 field === "domainExpiresAt" || field === "hostingExpiresAt") &&
 value
 ) {
 value = new Date(value);
 }
 updateData[field] = value;
 }
 }

 const website = await prisma.customerWebsite.update({
 where: { id },
 data: updateData,
 });

 await createAuditLog({
 userId: session.userId,
 action: "update",
 resource: "customer-websites",
 resourceId: id,
 oldValues: existing as unknown as Record<string, unknown>,
 newValues: updateData,
 });

 return ok(website);
 } catch (error) {
 return handleError(error);
 }
}

// DELETE — soft delete by setting status = "cancelled"
export async function DELETE(
 _req: NextRequest,
 { params }: { params: Promise<{ id: string }> }
) {
 try {
 const session = await requirePermission("customer-websites", "delete");
 const { id } = await params;

 const existing = await prisma.customerWebsite.findUnique({ where: { id } });
 if (!existing) {
 return NextResponse.json({ error: "Customer website not found" }, { status: 404 });
 }

 await prisma.customerWebsite.update({
 where: { id },
 data: { status: "cancelled" },
 });

 await createAuditLog({
 userId: session.userId,
 action: "delete",
 resource: "customer-websites",
 resourceId: id,
 oldValues: existing as unknown as Record<string, unknown>,
 });

 return ok({ success: true });
 } catch (error) {
 return handleError(error);
 }
}
