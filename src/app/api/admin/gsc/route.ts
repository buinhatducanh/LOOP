import { handleError } from "@/lib/api/response";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import { createAuditLog } from "@/lib/auth/audit";

// GET /api/admin/gsc — list metrics, optionally filtered by projectId
export async function GET(req: NextRequest) {
  try {
    await requirePermission("projects", "read");
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "50");

    const where: Record<string, unknown> = {};
    if (projectId) where.projectId = projectId;

    const [metrics, total] = await Promise.all([
      prisma.gscMetric.findMany({
        where,
        orderBy: { dataDate: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          project: {
            select: { id: true, orderNumber: true, customerName: true, companyName: true },
          },
        },
      }),
      prisma.gscMetric.count({ where }),
    ]);

    // Aggregate summary per project (latest 30 days)
    const projectSummary: Record<string, { impressions: number; clicks: number; ctr: number; position: number; pages: number }> = {};
    for (const m of metrics) {
      if (!projectSummary[m.projectId]) {
        projectSummary[m.projectId] = { impressions: 0, clicks: 0, ctr: 0, position: 0, pages: 0 };
      }
      projectSummary[m.projectId].impressions += m.impressions;
      projectSummary[m.projectId].clicks += m.clicks;
      projectSummary[m.projectId].pages += 1;
    }
    for (const pid of Object.keys(projectSummary)) {
      const s = projectSummary[pid];
      s.ctr = s.impressions > 0 ? s.clicks / s.impressions : 0;
      s.position = s.position / s.pages;
    }

    return NextResponse.json({
      data: metrics,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    return handleError(error);
  }
}

// POST /api/admin/gsc — import / upsert metrics
export async function POST(req: NextRequest) {
  try {
    const session = await requirePermission("projects", "update");
    const body = await req.json();

    if (!Array.isArray(body.metrics)) {
      return NextResponse.json({ error: "metrics phải là mảng" }, { status: 400 });
    }

    // Upsert: find existing by projectId+pageUrl+keyword+dataDate, then create or update
    const upserted = [];
    for (const m of body.metrics) {
      const baseData = {
        projectId: m.projectId,
        pageUrl: m.pageUrl,
        keyword: m.keyword ?? "",
        impressions: m.impressions,
        clicks: m.clicks,
        ctr: m.ctr ?? (m.impressions > 0 ? m.clicks / m.impressions : 0),
        position: m.position ?? 0,
        dataDate: m.dataDate ? new Date(m.dataDate) : new Date(),
      };
      const existing = await prisma.gscMetric.findFirst({
        where: {
          projectId: baseData.projectId,
          pageUrl: baseData.pageUrl,
          keyword: baseData.keyword,
          dataDate: baseData.dataDate,
        },
      });
      if (existing) {
        upserted.push(await prisma.gscMetric.update({
          where: { id: existing.id },
          data: { impressions: baseData.impressions, clicks: baseData.clicks, ctr: baseData.ctr, position: baseData.position },
        }));
      } else {
        upserted.push(await prisma.gscMetric.create({ data: baseData }));
      }
    }

    await createAuditLog({
      userId: session.userId,
      action: "import",
      resource: "gsc_metrics",
      resourceId: body.metrics[0]?.projectId ?? "bulk",
      newValues: { count: body.metrics.length },
    });

    return NextResponse.json({ data: upserted, count: upserted.length }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
