/**
 * Order service — order lifecycle, transitions, payments.
 */

import { prisma } from "@/lib/prisma";

// ─── Constants ────────────────────────────────────────────────────────

export const CUSTOM_ORDER_STATUSES = [
  "draft", "pending", "quoted", "accepted", "paid_partial",
  "paid_full", "contracted", "designing", "developing",
  "reviewing", "delivered", "completed", "cancelled",
] as const;

export const TEMPLATE_ORDER_STATUSES = [
  "pending", "paid_full", "setting_up", "delivered", "completed", "cancelled",
] as const;

const CUSTOM_TRANSITIONS: Record<string, string[]> = {
  draft: ["pending", "cancelled"],
  pending: ["quoted", "cancelled"],
  quoted: ["accepted", "cancelled"],
  accepted: ["paid_partial", "paid_full", "cancelled"],
  paid_partial: ["paid_full", "contracted", "cancelled"],
  paid_full: ["contracted", "cancelled"],
  contracted: ["designing", "cancelled"],
  designing: ["developing", "cancelled"],
  developing: ["reviewing", "cancelled"],
  reviewing: ["delivered", "developing", "cancelled"],
  delivered: ["completed"],
  completed: [],
  cancelled: [],
};

const TEMPLATE_TRANSITIONS: Record<string, string[]> = {
  pending: ["paid_full", "cancelled"],
  paid_full: ["setting_up", "cancelled"],
  setting_up: ["delivered", "cancelled"],
  delivered: ["completed"],
  completed: [],
  cancelled: [],
};

// ─── Transition ────────────────────────────────────────────────────────

export type TransitionResult =
  | { success: true; orderId: string }
  | { success: false; error: string };

export async function transitionOrderStatus(
  orderId: string,
  toStatus: string,
  userId: string,
  note?: string
): Promise<TransitionResult> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, status: true, orderType: true },
  });

  if (!order) return { success: false, error: "Order not found" };

  const isTemplate = order.orderType === "template" || order.orderType === "web-package";
  const transitions = isTemplate ? TEMPLATE_TRANSITIONS : CUSTOM_TRANSITIONS;
  const allowed = transitions[order.status] ?? [];

  if (!allowed.includes(toStatus)) {
    return {
      success: false,
      error: `Invalid transition: "${order.status}" → "${toStatus}". Allowed: [${allowed.join(", ") || "none"}]`,
    };
  }

  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: orderId },
      data: { status: toStatus },
    });
    await tx.orderStatusHistory.create({
      data: {
        orderId,
        fromStatus: order.status,
        toStatus,
        changedBy: userId,
        note: note ?? null,
      },
    });
  });

  return { success: true, orderId };
}

// ─── Record Payment ────────────────────────────────────────────────────

export type PaymentResult =
  | { success: true; paymentId: string }
  | { success: false; error: string };

export async function recordPayment(
  orderId: string,
  amount: number,
  method: string,
  note: string | undefined,
  userId: string
): Promise<PaymentResult> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, paidAmount: true, totalAmount: true, paymentStatus: true, referralCodeId: true },
  });

  if (!order) return { success: false, error: "Order not found" };
  if (amount <= 0) return { success: false, error: "Amount must be positive" };

  const result = await prisma.$transaction(async (tx) => {
    const newPaid = (order.paidAmount ?? 0) + amount;
    const isFull = newPaid >= (order.totalAmount ?? 0) && newPaid > 0;
    const newStatus = isFull ? "paid_full" : newPaid > 0 ? "paid_partial" : order.paymentStatus;

    const p = await tx.payment.create({
      data: {
        orderId,
        amount,
        method,
        note: note ?? null,
        confirmedBy: userId,
        confirmedAt: new Date(),
      },
    });

    await tx.order.update({
      where: { id: orderId },
      data: {
        paidAmount: { increment: amount },
        paymentStatus: newStatus,
      },
    });

    return p;
  });

  return { success: true, paymentId: result.id };
}
