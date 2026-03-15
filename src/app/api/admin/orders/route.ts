import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import { createAuditLog } from "@/lib/auth/audit";

export async function GET(req: NextRequest) {
  try {
    const session = await requirePermission("orders", "read");
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const paymentStatus = searchParams.get("paymentStatus") || "";
    const orderType = searchParams.get("orderType") || "";

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { customerName: { contains: search, mode: "insensitive" as const } },
        { customerEmail: { contains: search, mode: "insensitive" as const } },
        { orderNumber: { contains: search, mode: "insensitive" as const } },
      ];
    }

    if (status) where.status = status;
    if (paymentStatus) where.paymentStatus = paymentStatus;
    if (orderType) where.orderType = orderType;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          package: { select: { title: true } },
          template: { select: { id: true, name: true, nameVi: true, thumbnail: true } },
          selectedAttributes: {
            include: {
              attribute: { select: { id: true, name: true, nameVi: true, price: true } },
            },
          },
        },
      }),
      prisma.order.count({ where }),
    ]);

    return NextResponse.json({
      data: orders,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
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

    if (!data.customerName || !data.customerEmail) {
      return NextResponse.json(
        { error: "customerName and customerEmail are required" },
        { status: 400 }
      );
    }

    const oType = data.orderType || "package";

    // Validate based on order type
    if (oType === "package" && !data.packageId) {
      return NextResponse.json({ error: "packageId is required for package orders" }, { status: 400 });
    }
    if (oType === "template" && !data.templateId) {
      return NextResponse.json({ error: "templateId is required for template orders" }, { status: 400 });
    }

    const orderNumber = `ORD-${Date.now()}`;

    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          orderNumber,
          orderType: oType,
          packageId: oType === "package" ? data.packageId : null,
          templateId: oType === "template" ? data.templateId : null,
          customerName: data.customerName,
          customerEmail: data.customerEmail,
          customerPhone: data.customerPhone || null,
          companyName: data.companyName || null,
          requirements: data.requirements || null,
          brandGuidelines: oType === "custom" ? (data.brandGuidelines || null) : null,
          status: data.status || "pending",
          paymentStatus: data.paymentStatus || "unpaid",
          totalAmount: data.totalAmount ? parseInt(data.totalAmount) : null,
        },
      });

      // For custom orders, attach selected attributes
      if (oType === "custom" && Array.isArray(data.attributeIds) && data.attributeIds.length > 0) {
        // Fetch current prices for snapshot
        const attrs = await tx.serviceAttribute.findMany({
          where: { id: { in: data.attributeIds } },
          select: { id: true, price: true },
        });
        await tx.orderAttribute.createMany({
          data: attrs.map((attr) => ({
            orderId: created.id,
            attributeId: attr.id,
            priceAtOrder: attr.price,
          })),
        });
      }

      return tx.order.findUnique({
        where: { id: created.id },
        include: {
          package: { select: { title: true } },
          template: { select: { id: true, name: true, nameVi: true } },
          selectedAttributes: {
            include: {
              attribute: { select: { id: true, name: true, nameVi: true } },
            },
          },
        },
      });
    });

    await createAuditLog({
      userId: session.userId,
      action: "create",
      resource: "orders",
      resourceId: order!.id,
      newValues: data,
    });

    return NextResponse.json({ data: order }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
