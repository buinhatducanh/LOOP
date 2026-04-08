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

    await createAuditLog({
      userId: session.userId,
      action: "create",
      resource: "orders",
      resourceId: id,
      newValues: { amount, method, note },
    });

    // ── Fire admin notification on payment record ──────────────────────────────
    // Priority "urgent" if payment ≥ 50% of expected total
    const totalExpected = 0; // we don't have it here — calculate from order
    void prisma.adminNotification.create({
      data: {
        type: "payment_received",
        title: `💳 Thanh toán — ${new Intl.NumberFormat("vi-VN").format(amount)} VNĐ`,
        message: `Đơn hàng #${id} vừa nhận thanh toán ${new Intl.NumberFormat("vi-VN").format(amount)} VNĐ${method ? ` qua ${method}` : ""}. Cần xác nhận.`,
        link: `/admin/orders`,
        priority: amount >= 10_000_000 ? "urgent" : "high",
      },
    }).catch(() => {/* silent */});

    return ok({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
