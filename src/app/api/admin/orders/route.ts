import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import { createAuditLog } from "@/lib/auth/audit";
import {
  buildQueryFromParams,
  parsePagination,
  buildPaginationResponse,
  ORDER_FILTER_CONFIG,
} from "@/lib/api/search-utils";

export async function GET(req: NextRequest) {
  try {
    const session = await requirePermission("orders", "read");
    const { searchParams } = new URL(req.url);
    const { where, orderBy } = buildQueryFromParams(searchParams, ORDER_FILTER_CONFIG);
    const { page, limit } = parsePagination(searchParams);

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: { package: { select: { title: true } } },
      }),
      prisma.order.count({ where }),
    ]);

    return NextResponse.json({
      data: orders,
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
    const session = await requirePermission("orders", "create");
    const data = await req.json();

    if (!data.packageId || !data.customerName || !data.customerEmail) {
      return NextResponse.json(
        { error: "packageId, customerName, and customerEmail are required" },
        { status: 400 }
      );
    }

    const orderNumber = `ORD-${Date.now()}`;

    const order = await prisma.order.create({
      data: {
        orderNumber,
        packageId: data.packageId,
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        customerPhone: data.customerPhone || null,
        companyName: data.companyName || null,
        requirements: data.requirements || null,
        status: data.status || "pending",
        paymentStatus: data.paymentStatus || "unpaid",
        totalAmount: data.totalAmount ? parseInt(data.totalAmount) : null,
      },
      include: { package: { select: { title: true } } },
    });

    await createAuditLog({
      userId: session.userId,
      action: "create",
      resource: "orders",
      resourceId: order.id,
      newValues: data,
    });

    return NextResponse.json({ data: order }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
