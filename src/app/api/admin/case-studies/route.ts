/**
 * Admin Case Studies CRUD
 *
 * GET  /api/admin/case-studies          — list (filter: industry, status, page, limit)
 * POST /api/admin/case-studies          — create (always sets isCaseStudy: true)
 *
 * Requires: requirePermission("projects", "read/create")
 */

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import { createAuditLog } from "@/lib/auth/audit";
import { buildPaginationResponse } from "@/lib/api/search-utils";
import { handleError, notFound, badRequest } from "@/lib/api";

export async function GET(req: NextRequest) {
  try {
    await requirePermission("projects", "read");

    const { searchParams } = new URL(req.url);
    const industry = searchParams.get("industry") ?? undefined;
    const status = searchParams.get("status"); // "published" | "draft"
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));

    const where: Record<string, unknown> = { isCaseStudy: true };
    if (industry) where.industry = industry;
    if (status === "published") where.isPublished = true;
    else if (status === "draft") where.isPublished = false;

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: { service: { select: { title: true } } },
      }),
      prisma.project.count({ where }),
    ]);

    return NextResponse.json({
      data: projects,
      ...buildPaginationResponse(total, page, limit),
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requirePermission("projects", "create");
    const body = await req.json();

    // Always set isCaseStudy: true
    const data = { ...body, isCaseStudy: true };

    const project = await prisma.project.create({ data });

    await createAuditLog({
      userId: session.userId,
      action: "create",
      resource: "case-studies",
      resourceId: project.id,
      newValues: data,
    });

    return NextResponse.json({ data: project }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
