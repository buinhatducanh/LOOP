import { handleError } from "@/lib/api/response";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import {
  buildQueryFromParams,
  parsePagination,
  buildPaginationResponse,
  QUOTE_REQUEST_FILTER_CONFIG,
} from "@/lib/api/search-utils";

export async function GET(req: NextRequest) {
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

export async function POST(req: NextRequest) {
  try {
    await requirePermission("pricing_features", "create");
    const body = await req.json();

    // Parse rich configuration if provided from admin form
    const pricingBreakdown = body.configuration 
      ? JSON.parse(body.configuration) 
      : (body.pricingBreakdown || {});

    const request = await prisma.quoteRequest.create({
      data: {
        customerName: body.customerName,
        customerEmail: body.customerEmail,
        customerPhone: body.customerPhone || null,
        companyName: body.companyName || null,
        totalAmount: Math.round(body.totalAmount),
        selectedItems: body.selectedItems || [],
        pricingBreakdown: pricingBreakdown,
        source: body.source || "admin",
        status: "new",
        hostingPlanSlug: body.hostingPlanSlug || null,
        domainName: body.domainName || null,
        notes: body.notes || null,
      },
    });

    return NextResponse.json({ data: request }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
