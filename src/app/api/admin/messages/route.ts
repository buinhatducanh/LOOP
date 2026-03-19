import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import {
  buildQueryFromParams,
  parsePagination,
  buildPaginationResponse,
  MESSAGE_FILTER_CONFIG,
} from "@/lib/api/search-utils";

export async function GET(req: NextRequest) {
  try {
    await requirePermission("messages", "read");
    const { searchParams } = new URL(req.url);
    const { where, orderBy } = buildQueryFromParams(searchParams, MESSAGE_FILTER_CONFIG);
    const { page, limit } = parsePagination(searchParams);

    const [messages, total] = await Promise.all([
      prisma.contactMessage.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.contactMessage.count({ where }),
    ]);

    return NextResponse.json({
      data: messages,
      ...buildPaginationResponse(total, page, limit),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
