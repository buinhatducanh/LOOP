import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import { createAuditLog } from "@/lib/auth/audit";
import {
  buildQueryFromParams,
  parsePagination,
  buildPaginationResponse,
  PROJECT_FILTER_CONFIG,
} from "@/lib/api/search-utils";

export async function GET(req: NextRequest) {
  try {
    await requirePermission("projects", "read");
    const { searchParams } = new URL(req.url);
    const { where, orderBy } = buildQueryFromParams(searchParams, PROJECT_FILTER_CONFIG);
    const { page, limit } = parsePagination(searchParams);

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        orderBy,
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
    const message = error instanceof Error ? error.message : "Server error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requirePermission("projects", "create");
    const data = await req.json();

    const project = await prisma.project.create({ data });

    await createAuditLog({
      userId: session.userId,
      action: "create",
      resource: "projects",
      resourceId: project.id,
      newValues: data,
    });

    return NextResponse.json({ data: project }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
