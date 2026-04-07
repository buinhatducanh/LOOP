/**
 * OffSystemPayment single-item API
 * GET    /api/admin/off-system-payments/:id
 * PATCH  /api/admin/off-system-payments/:id   → update description/note/orderId
 * DELETE /api/admin/off-system-payments/:id   → cascade delete splits
 */

import { handleError, ok, notFound, badRequest } from "@/lib/api/response";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";

interface RouteParams { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    await requirePermission("off_system_payments", "read");
    const { id } = await params;

    const payment = await prisma.offSystemPayment.findUnique({
      where: { id },
      include: {
        order: { select: { id: true, orderNumber: true, customerName: true } },
        splits: {
          include: { member: { select: { id: true, name: true, rank: true, image: true } } },
          orderBy: { percentage: "desc" },
        },
      },
    });
    if (!payment) return notFound("Payment not found");

    return ok(payment);
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    await requirePermission("off_system_payments", "update");
    const { id } = await params;
    const body = await req.json();

    const payment = await prisma.offSystemPayment.findUnique({ where: { id } });
    if (!payment) return notFound("Payment not found");

    // Validate orderId if being changed
    if (body.orderId && body.orderId !== payment.orderId) {
      const order = await prisma.order.findUnique({ where: { id: body.orderId } });
      if (!order) return badRequest("order not found");
    }

    const updated = await prisma.offSystemPayment.update({
      where: { id },
      data: {
        ...(body.description !== undefined && { description: body.description }),
        ...(body.note !== undefined && { note: body.note }),
        ...(body.orderId !== undefined && { orderId: body.orderId }),
      },
    });

    return ok(updated);
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  try {
    await requirePermission("off_system_payments", "delete");
    const { id } = await params;

    const payment = await prisma.offSystemPayment.findUnique({ where: { id } });
    if (!payment) return notFound("Payment not found");

    // Cascade delete splits + payment
    await prisma.$transaction([
      prisma.offSystemSplit.deleteMany({ where: { offSystemPaymentId: id } }),
      prisma.offSystemPayment.delete({ where: { id } }),
    ]);

    return ok({ deleted: true });
  } catch (error) {
    return handleError(error);
  }
}