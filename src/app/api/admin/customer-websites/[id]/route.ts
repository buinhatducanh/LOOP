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
      },
    });

    if (!website) {
      return NextResponse.json({ error: "Customer website not found" }, { status: 404 });
    }

    // Compute summary stats
    const stats = website.websiteStats;
    const totalVisitors = stats.reduce((sum, s) => sum + s.visitors, 0);
    const totalPageViews = stats.reduce((sum, s) => sum + s.pageViews, 0);
    const avgUptime =
      stats.length > 0 ? stats.reduce((sum, s) => sum + s.uptime, 0) / stats.length : 100;
    const responseTimeStats = stats.filter((s) => s.responseTime != null);
    const avgResponseTime =
      responseTimeStats.length > 0
        ? responseTimeStats.reduce((sum, s) => sum + (s.responseTime ?? 0), 0) /
          responseTimeStats.length
        : 0;

    // Top pages
    const pageViewsByUrl = website.pageViews.reduce((acc, pv) => {
      if (!acc[pv.pageUrl]) acc[pv.pageUrl] = { pageUrl: pv.pageUrl, pageTitle: pv.pageTitle, views: 0 };
      acc[pv.pageUrl].views += pv.views;
      return acc;
    }, {} as Record<string, { pageUrl: string; pageTitle: string | null; views: number }>);

    const topPages = Object.values(pageViewsByUrl)
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

    // Whitelist allowed update fields
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
    ];
    for (const field of allowedFields) {
      if (field in body) updateData[field] = body[field];
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
