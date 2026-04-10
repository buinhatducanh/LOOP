import { handleError, ok } from "@/lib/api/response";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import { createAuditLog } from "@/lib/auth/audit";
import { recordPayment } from "@/lib/pricing/order-lifecycle";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission("orders", "read");
    const { id } = await params;

    const payments = await prisma.payment.findMany({
      where: { orderId: id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ data: payments });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission("orders", "update");
    const { id } = await params;
    const { amount, method, note } = await req.json();

    if (!amount || typeof amount !== "number") {
      return NextResponse.json(
        { error: "amount is required and must be a number" },
        { status: 400 }
      );
    }

    const result = await recordPayment(id, amount, method, note, session.userId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    // P1-7 FIX: fetch order for urgency logic before notification fires
    const order = await prisma.order.findUnique({
      where: { id },
      select: { finalPrice: true, totalAmount: true, orderNumber: true },
    });
    const totalExpected = order?.finalPrice ?? order?.totalAmount ?? 0;

    // P1-7 FIX: audit log moved inside the main operation — recordPayment already
    // committed atomically inside its own $transaction; log here as secondary audit.
    await createAuditLog({
      userId: session.userId,
      action: "create",
      resource: "orders",
      resourceId: id,
      newValues: { amount, method, note },
    });

    // ── Fire admin notification on payment record ──────────────────────────────
    // Priority "urgent" if payment ≥ 50% of expected total
    void prisma.adminNotification.create({
      data: {
        type: "payment_received",
        title: `💳 Thanh toán — ${new Intl.NumberFormat("vi-VN").format(amount)} VNĐ`,
        message: `Đơn hàng #${order?.orderNumber ?? id} vừa nhận thanh toán ${new Intl.NumberFormat("vi-VN").format(amount)} VNĐ${method ? ` qua ${method}` : ""}. Cần xác nhận.`,
        link: `/admin/orders`,
        // P1-7 FIX: urgent if ≥50% of expected total, or ≥10M absolute
        priority: amount >= totalExpected * 0.5 || amount >= 10_000_000 ? "urgent" : "high",
      },
    }).catch(() => {/* silent */});

    return ok({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
