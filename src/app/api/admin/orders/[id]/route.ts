import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import { createAuditLog } from "@/lib/auth/audit";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission("orders", "read");
    const { id } = await params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        package: true,
        template: {
          include: {
            bundledAttributes: {
              include: { attribute: { select: { id: true, name: true, nameVi: true } } },
            },
          },
        },
        selectedAttributes: {
          include: { attribute: true },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ data: order });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
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

    // Build safe update payload — only include fields that were sent
    const updateData: Record<string, unknown> = {};
    if (data.status !== undefined) updateData.status = data.status;
    if (data.paymentStatus !== undefined) updateData.paymentStatus = data.paymentStatus;
    if (data.customerName !== undefined) updateData.customerName = data.customerName;
    if (data.customerEmail !== undefined) updateData.customerEmail = data.customerEmail;
    if (data.customerPhone !== undefined) updateData.customerPhone = data.customerPhone || null;
    if (data.companyName !== undefined) updateData.companyName = data.companyName || null;
    if (data.requirements !== undefined) updateData.requirements = data.requirements || null;
    if (data.brandGuidelines !== undefined) updateData.brandGuidelines = data.brandGuidelines || null;
    if (data.totalAmount !== undefined) updateData.totalAmount = data.totalAmount ? parseInt(data.totalAmount) : null;
    if (data.orderType !== undefined) updateData.orderType = data.orderType;
    if (data.packageId !== undefined) updateData.packageId = data.packageId || null;
    if (data.templateId !== undefined) updateData.templateId = data.templateId || null;

    const order = await prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id },
        data: updateData,
      });

      // Sync selected attributes if provided (for custom orders)
      if (data.attributeIds !== undefined) {
        await tx.orderAttribute.deleteMany({ where: { orderId: id } });
        if (Array.isArray(data.attributeIds) && data.attributeIds.length > 0) {
          const attrs = await tx.serviceAttribute.findMany({
            where: { id: { in: data.attributeIds } },
            select: { id: true, price: true },
          });
          await tx.orderAttribute.createMany({
            data: attrs.map((attr) => ({
              orderId: id,
              attributeId: attr.id,
              priceAtOrder: attr.price,
            })),
          });
        }
      }

      return tx.order.findUnique({
        where: { id },
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
      action: "update",
      resource: "orders",
      resourceId: id,
      oldValues: existing as unknown as Record<string, unknown>,
      newValues: data,
    });

    return NextResponse.json({ data: order });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
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

    await prisma.order.delete({ where: { id } });

    await createAuditLog({
      userId: session.userId,
      action: "delete",
      resource: "orders",
      resourceId: id,
      oldValues: existing as unknown as Record<string, unknown>,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
