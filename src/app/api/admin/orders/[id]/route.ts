import { ok, handleError, badRequest } from "@/lib/api/response";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import { createAuditLog } from "@/lib/auth/audit";
import type { InputJsonValue } from "@/generated/prisma/internal/prismaNamespace";
import { CUSTOM_ORDER_STATUSES, TEMPLATE_ORDER_STATUSES } from "@/lib/pricing/order-lifecycle";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission("orders", "read");
    const { id } = await params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: { package: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ data: order });
  } catch (error) {
    return handleError(error);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission("orders", "update");
    const { id } = await params;
    const data = await req.json();

    const existing = await prisma.order.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Validate status if being updated — must be a known status for this order type
    if (data.status !== undefined) {
      const orderType = (existing.orderType as string) ?? "custom";
      const validStatuses = orderType === "template" || orderType === "web-package"
        ? TEMPLATE_ORDER_STATUSES
        : CUSTOM_ORDER_STATUSES;

      if (!validStatuses.includes(data.status)) {
        return badRequest(
          `Invalid status "${data.status}" for order type "${orderType}". ` +
          `Valid statuses: ${validStatuses.join(", ")}`
        );
      }
    }

    // Sequential writes (PrismaNeon HTTP adapter does NOT support $transaction)
    const order = await prisma.order.update({
      where: { id },
      data,
      include: { package: { select: { title: true } } },
    });
    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: "update",
        resource: "orders",
        resourceId: id,
        oldValues: existing as unknown as InputJsonValue,
        newValues: data as unknown as InputJsonValue,
      },
    }).catch(() => { /* non-critical */ });

    return NextResponse.json({ data: order });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission("orders", "delete");
    const { id } = await params;

    const existing = await prisma.order.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Sequential writes (PrismaNeon HTTP adapter does NOT support $transaction)
    await prisma.order.delete({ where: { id } });
    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: "delete",
        resource: "orders",
        resourceId: id,
        oldValues: existing as unknown as InputJsonValue,
      },
    }).catch(() => { /* non-critical */ });

    return ok({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
