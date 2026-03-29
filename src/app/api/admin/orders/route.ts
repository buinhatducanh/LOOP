import { ok, handleError } from "@/lib/api/response";
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
        include: {
          package: { select: { title: true } },
          figmaDemos: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: {
              id: true,
              figmaUrl: true,
              clientToken: true,
              status: true,
              createdAt: true,
              approvedAt: true,
            },
          },
        },
      }),
      prisma.order.count({ where }),
    ]);

    const data = orders.map((order) => {
      const latestDemo = order.figmaDemos[0] ?? null;
      return {
        ...order,
        demo: latestDemo
          ? {
              id: latestDemo.id,
              status: latestDemo.status,
              figmaUrl: latestDemo.figmaUrl,
              maskedUrl: latestDemo.clientToken
                ? `demo.loop-solutions.vn/${order.orderNumber.toLowerCase()}`
                : null,
              createdAt: latestDemo.createdAt,
              approvedAt: latestDemo.approvedAt,
            }
          : null,
      };
    });

    return NextResponse.json({
      data,
      ...buildPaginationResponse(total, page, limit),
    });
  } catch (error) {
    return handleError(error);
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

    // Only allow non-terminal statuses at creation — prevents bypassing payment workflow
    const ALLOWED_CREATE_STATUSES = ["pending", "quote", "draft"];
    const requestedStatus = data.status ?? "pending";
    if (!ALLOWED_CREATE_STATUSES.includes(requestedStatus)) {
      return NextResponse.json(
        { error: `Cannot create order with status "${requestedStatus}". Allowed: ${ALLOWED_CREATE_STATUSES.join(", ")}` },
        { status: 400 }
      );
    }

    // Use UUID-based order number to prevent collision under concurrent requests
    const orderNumber = `ORD-${crypto.randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase()}`;

    const order = await prisma.order.create({
      data: {
        orderNumber,
        packageId: data.packageId,
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        customerPhone: data.customerPhone || null,
        companyName: data.companyName || null,
        requirements: data.requirements || null,
        status: requestedStatus,
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

    return ok(order, 201);
  } catch (error) {
    return handleError(error);
  }
}
