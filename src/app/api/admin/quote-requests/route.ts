import { handleError } from "@/lib/api/response";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import {
  buildQueryFromParams,
  parsePagination,
  buildPaginationResponse,
  QUOTE_REQUEST_FILTER_CONFIG,
} from "@/lib/api/search-utils";

export async function GET(_req: NextRequest) {
  try {
    await requirePermission("pricing_features", "read");
    const { searchParams } = new URL(req.url);
    const { where, orderBy } = buildQueryFromParams(searchParams, QUOTE_REQUEST_FILTER_CONFIG);
    const { page, limit } = parsePagination(searchParams);

    const [requests, total] = await Promise.all([
      prisma.quoteRequest.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.quoteRequest.count({ where }),
    ]);

    return NextResponse.json({
      data: requests,
      ...buildPaginationResponse(total, page, limit),
    });
  } catch (error) {
    return handleError(error);
  }
}
