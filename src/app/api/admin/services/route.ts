import { handleError } from "@/lib/api/response";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import { createAuditLog } from "@/lib/auth/audit";
import {
  buildQueryFromParams,
  parsePagination,
  buildPaginationResponse,
  SERVICE_FILTER_CONFIG,
} from "@/lib/api/search-utils";

export async function GET(_req: NextRequest) {
  try {
    await requirePermission("services", "read");
    const { searchParams } = new URL(req.url);
    const { where, orderBy } = buildQueryFromParams(searchParams, SERVICE_FILTER_CONFIG);
    const { page, limit } = parsePagination(searchParams);

    const [services, total] = await Promise.all([
      prisma.service.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: { _count: { select: { projects: true } } },
      }),
      prisma.service.count({ where }),
    ]);

    return NextResponse.json({
      data: services,
      ...buildPaginationResponse(total, page, limit),
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(_req: NextRequest) {
  try {
    const _session = await requirePermission("services", "create");
    const data = await req.json();

    const service = await prisma.service.create({ data });

    await createAuditLog({
      userId: session.userId,
      action: "create",
      resource: "services",
      resourceId: service.id,
      newValues: data,
    });

    return NextResponse.json({ data: service }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
