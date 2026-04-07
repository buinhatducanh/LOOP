import { handleError } from "@/lib/api/response";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import { createAuditLog } from "@/lib/auth/audit";
import {
  buildQueryFromParams,
  parsePagination,
  buildPaginationResponse,
  TESTIMONIAL_FILTER_CONFIG,
} from "@/lib/api/search-utils";

export async function GET(req: NextRequest) {
  try {
    await requirePermission("testimonials", "read");
    const { searchParams } = new URL(req.url);
    const { where, orderBy } = buildQueryFromParams(searchParams, TESTIMONIAL_FILTER_CONFIG);
    const { page, limit } = parsePagination(searchParams);

    const [testimonials, total] = await Promise.all([
      prisma.testimonial.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.testimonial.count({ where }),
    ]);

    return NextResponse.json({
      data: testimonials,
      ...buildPaginationResponse(total, page, limit),
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requirePermission("testimonials", "create");
    const data = await req.json();

    const testimonial = await prisma.testimonial.create({ data });

    await createAuditLog({
      userId: session.userId,
      action: "create",
      resource: "testimonials",
      resourceId: testimonial.id,
      newValues: data,
    });

    return NextResponse.json({ data: testimonial }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
