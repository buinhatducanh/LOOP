import { handleError, ok, list } from "@/lib/api/response";
import { buildPaginationResponse } from "@/lib/api/search-utils";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import { createAuditLog } from "@/lib/auth/audit";

// GET — list CustomerWebsite with filters and pagination
export async function GET(req: NextRequest) {
 try {
 await requirePermission("customer-websites", "read");
 const { searchParams } = new URL(req.url);

 const orderId = searchParams.get("orderId");
 const configStatus = searchParams.get("configStatus");
 const status = searchParams.get("status");
 const search = searchParams.get("search");
 const page = parseInt(searchParams.get("page") ?? "1");
 const limit = parseInt(searchParams.get("limit") ?? "20");

 const where: Record<string, unknown> = {};
 if (orderId) where.orderId = orderId;
 if (configStatus) where.configStatus = configStatus;
 if (status) where.status = status;
 if (search) {
 where.OR = [
 { domain: { contains: search, mode: "insensitive" } },
 { name: { contains: search, mode: "insensitive" } },
 { customerName: { contains: search, mode: "insensitive" } },
 { customerEmail: { contains: search, mode: "insensitive" } },
 ];
 }

 const [websites, total] = await Promise.all([
 prisma.customerWebsite.findMany({
 where,
 include: {
 order: { select: { id: true, orderNumber: true, customerName: true } },
 websiteStats: { orderBy: { date: "desc" }, take: 7 },
 hostingPlan: { select: { id: true, name: true, nameVi: true, slug: true } },
 },
 orderBy: { createdAt: "desc" },
 skip: (page - 1) * limit,
 take: limit,
 }),
 prisma.customerWebsite.count({ where }),
 ]);

 const mapped = websites.map((w: typeof websites[number]) => ({
  id: w.id,
 orderId: w.orderId,
 packageId: w.packageId,
 domain: w.domain,
 subdomain: w.subdomain,
 name: w.name,
 description: w.description,
 hostingProvider: w.hostingProvider,
 hostingUrl: w.hostingUrl,
 customerId: w.customerId,
 customerName: w.customerName,
 customerEmail: w.customerEmail,
 customerPhone: w.customerPhone,
 status: w.status,
 configStatus: w.configStatus,
 isMonitored: w.isMonitored,
 deployedAt: w.deployedAt,
 deployedUrl: w.deployedUrl,
 expiresAt: w.expiresAt,
 ekycName: w.ekycName,
 ekycIdNumber: w.ekycIdNumber,
 ekycDob: w.ekycDob,
 ekycAddress: w.ekycAddress,
 // Domain purchase fields
 registeredAt: w.registeredAt,
 domainTermMonths: w.domainTermMonths,
 domainCost: w.domainCost,
 domainTld: w.domainTld,
 // Hosting purchase fields
 hostingPlanId: w.hostingPlanId,
 hostingTermMonths: w.hostingTermMonths,
 hostingCost: w.hostingCost,
 hostingPlan: w.hostingPlan,
 // Vercel deployment
 vercelProjectId: w.vercelProjectId,
 vercelProjectUrl: w.vercelProjectUrl,
 // Auto-renew
 autoRenewDomain: w.autoRenewDomain,
 autoRenewHosting: w.autoRenewHosting,
 // Separate expiry timestamps
 domainExpiresAt: w.domainExpiresAt,
 hostingExpiresAt: w.hostingExpiresAt,
 createdAt: w.createdAt,
 updatedAt: w.updatedAt,
 order: w.order,
 }));

 return NextResponse.json({
 data: mapped,
 ...buildPaginationResponse(total, page, limit),
 });
 } catch (error) {
 return handleError(error);
 }
}

// POST — create CustomerWebsite (admin action)
export async function POST(req: NextRequest) {
 try {
 const session = await requirePermission("customer-websites", "create");
 const body = await req.json();

 const {
 orderId,
 packageId,
 domain,
 subdomain,
 name,
 description,
 hostingProvider,
 hostingUrl,
 customerId,
 customerName,
 customerEmail,
 customerPhone,
 ekycName,
 ekycIdNumber,
 ekycDob,
 ekycAddress,
 // New fields
 registeredAt,
 domainTermMonths,
 domainCost,
 domainTld,
 hostingPlanId,
 hostingTermMonths: htMonths,
 hostingCost,
 vercelProjectId,
 vercelProjectUrl,
 autoRenewDomain,
 autoRenewHosting,
 domainExpiresAt,
 hostingExpiresAt,
  } = body;

 if (!name) {
 return NextResponse.json({ error: "name is required" }, { status: 400 });
 }

 const website = await prisma.customerWebsite.create({
 data: {
 orderId: orderId ?? null,
 packageId: packageId ?? null,
 domain: domain ?? null,
 subdomain: subdomain ?? null,
 name,
 description: description ?? null,
 hostingProvider: hostingProvider ?? null,
 hostingUrl: hostingUrl ?? null,
 customerId: customerId ?? null,
 customerName: customerName ?? null,
 customerEmail: customerEmail ?? null,
 customerPhone: customerPhone ?? null,
 ekycName: ekycName ?? null,
 ekycIdNumber: ekycIdNumber ?? null,
 ekycDob: ekycDob ?? null,
 ekycAddress: ekycAddress ?? null,
 status: "active",
 configStatus: "pending_config",
 isMonitored: true,
 // New fields
 registeredAt: registeredAt ? new Date(registeredAt) : null,
 domainTermMonths: domainTermMonths ?? 12,
 domainCost: domainCost ?? 0,
 domainTld: domainTld ?? null,
 hostingPlanId: hostingPlanId ?? null,
 hostingTermMonths: htMonths ?? 12,
 hostingCost: hostingCost ?? 0,
 vercelProjectId: vercelProjectId ?? null,
 vercelProjectUrl: vercelProjectUrl ?? null,
 autoRenewDomain: autoRenewDomain ?? false,
  autoRenewHosting: autoRenewHosting ?? false,
 domainExpiresAt: domainExpiresAt ? new Date(domainExpiresAt) : null,
 hostingExpiresAt: hostingExpiresAt ? new Date(hostingExpiresAt) : null,
 },
 });

 await createAuditLog({
  userId: session.userId,
 action: "create",
 resource: "customer-websites",
 resourceId: website.id,
 newValues: body,
 });

 return ok(website, 201);
 } catch (error) {
 return handleError(error);
 }
}
