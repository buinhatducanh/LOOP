import { handleError } from "@/lib/api/response";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import { createAuditLog } from "@/lib/auth/audit";
import {
  buildQueryFromParams,
  parsePagination,
  buildPaginationResponse,
  PROJECT_FILTER_CONFIG,
} from "@/lib/api/search-utils";

export async function GET(_req: NextRequest) {
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
    return handleError(error);
  }
}

export async function POST(_req: NextRequest) {
  try {
    const _session = await requirePermission("projects", "create");
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
    return handleError(error);
  }
}
