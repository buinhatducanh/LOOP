import { prisma } from "@/lib/prisma";
import { awardCustomerLpOnPayment } from "@/lib/services/customer/lp.service";
import { awardReferralLpOnPayment, awardReferralLpOnCompletion } from "@/lib/services/customer/referral.service";
import { buildLpAwardsFromOrder } from "@/lib/pricing/quote-to-order";
import { vndToLp } from "@/lib/services/customer/lp.service";
import { creditSalesCommissionForOrderTx } from "@/lib/services/commerce/commission.service";

// ── Notification helper ───────────────────────────────────────────────────────

type NotifData = {
  type: string;
  title: string;
  message: string;
  link?: string;
  priority?: string;
};
// InputJsonValue for Prisma audit fields

/**
 * Fire-and-forget admin notification creation.
 * Silently ignores errors so notification failures never break the parent transaction.
 */
async function fireNotif(data: NotifData): Promise<void> {
  try {
    await prisma.adminNotification.create({ data: { ...data, priority: data.priority ?? "normal" } });
  } catch {
    // silent — do not break the caller
  }
}
import { LP_VND_RATE } from "@/lib/constants";
import type { Prisma } from "@/generated/prisma";
type InputJsonValue = Prisma.InputJsonValue;

/**
 * Trạng thái hợp lệ cho đơn hàng Custom
 */
export const CUSTOM_ORDER_STATUSES = [
  "draft",
  "pending",
  "quoted",
  "accepted",
  "paid_partial",
  "paid_full",
  "contracted",
  "designing",
  "developing",
  "reviewing",
  "delivered",
  "completed",
  "cancelled",
] as const;

export type CustomOrderStatus = (typeof CUSTOM_ORDER_STATUSES)[number];

/**
 * Trạng thái hợp lệ cho đơn hàng Template (Web Gói)
 */
export const TEMPLATE_ORDER_STATUSES = [
  "pending",
  "paid_full",
  "setting_up",
  "delivered",
  "completed",
  "cancelled",
] as const;

export type TemplateOrderStatus = (typeof TEMPLATE_ORDER_STATUSES)[number];

/**
 * Transition hợp lệ cho Custom orders
 */
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

/**
 * Transition hợp lệ cho Template orders
 */
const TEMPLATE_TRANSITIONS: Record<string, string[]> = {
  pending: ["paid_full", "cancelled"],
  paid_full: ["setting_up", "cancelled"],
  setting_up: ["delivered", "cancelled"],
  delivered: ["completed"],
  completed: [],
  cancelled: [],
};

/**
 * Kiểm tra xem transition có hợp lệ không
 */
export function isValidTransition(
  orderType: string,
  fromStatus: string,
  toStatus: string
): boolean {
  const transitions =
    orderType === "custom" ? CUSTOM_TRANSITIONS : TEMPLATE_TRANSITIONS;
  return transitions[fromStatus]?.includes(toStatus) ?? false;
}

/**
 * Lấy danh sách trạng thái tiếp theo có thể chuyển
 */
export function getNextStatuses(
  orderType: string,
  currentStatus: string
): string[] {
  const transitions =
    orderType === "custom" ? CUSTOM_TRANSITIONS : TEMPLATE_TRANSITIONS;
  return transitions[currentStatus] ?? [];
}

/**
 * Chuyển trạng thái đơn hàng + ghi log lịch sử + award referral LP khi hoàn tất
 *
 * P1-2 FIX: audit log written INSIDE the $transaction — no gap between write and audit.
 */
export async function transitionOrderStatus(
  orderId: string,
  toStatus: string,
  changedBy?: string,
  note?: string,
  auditUserId?: string,
  auditResourceId?: string
): Promise<{ success: boolean; error?: string }> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      status: true, orderType: true, orderNumber: true,
      paidAmount: true, finalPrice: true, lpUsed: true, customerEmail: true,
    },
  });

  if (!order) {
    return { success: false, error: "Order not found" };
  }

  if (!isValidTransition(order.orderType, order.status, toStatus)) {
    return {
      success: false,
      error: `Cannot transition from "${order.status}" to "${toStatus}" for ${order.orderType} orders`,
    };
  }

  const isCompletion = toStatus === "completed" || toStatus === "delivered";

  // ── Calculate lpReward on order completion ──────────────────────────────
  // Formula: ceil(remainingAmount × 1/LP_VND_RATE × 0.10)
  // remainingAmount = max(0, finalPrice - paidAmount - lpUsedVndDiscount)
  let lpRewardToSet: number | null = null;
  if (isCompletion && order.finalPrice) {
    const lpUsedVndDiscount = (order.lpUsed ?? 0) * LP_VND_RATE;
    const remainingAmount = Math.max(0, order.finalPrice - order.paidAmount - lpUsedVndDiscount);
    if (remainingAmount > 0) {
      lpRewardToSet = vndToLp(remainingAmount);
    }
  }

  // Atomic: update status + history + lpReward
  // P0-3 FIX: awardReferralLpOnCompletion moved INSIDE the tx — no more fire-and-forget.
  // P1-2 FIX: audit log inside this tx — no gap between write and audit record.
  await prisma.$transaction(async (tx) => {
    const updateData: Record<string, unknown> = { status: toStatus };
    if (isCompletion) {
      updateData.completedAt = new Date();
      if (lpRewardToSet !== null) {
        updateData.lpReward = lpRewardToSet;
      }
    }
    await tx.order.update({ where: { id: orderId }, data: updateData });
    await tx.orderStatusHistory.create({
      data: { orderId, fromStatus: order.status, toStatus, changedBy, note },
    });

    // ── Award referral LP on order completion — NOW atomic inside this tx ─────
    if (isCompletion && order.paidAmount > 0) {
      await awardReferralLpOnCompletion(orderId, order.orderNumber, order.paidAmount);
    }

    // ── Credit sales commission on order completion (done) ──────────────────
    if (toStatus === "completed") {
      await creditSalesCommissionForOrderTx(orderId, tx);
    }

    // ── P1-2 FIX: audit log inside tx ─────────────────────────────────────────
    if (auditUserId && auditResourceId) {
      await tx.auditLog.create({
        data: {
          userId: auditUserId,
          action: "update",
          resource: "orders",
          resourceId: auditResourceId,
          newValues: { toStatus, note } as unknown as InputJsonValue,
        },
      });
    }
  });

  // ── Fire admin notification on key status transitions ─────────────────────────
  const priority = toStatus === "delivered" ? "high" : "normal";
  const notifType = toStatus === "delivered" ? "project_delivered" : "new_order";
  fireNotif({
    type: notifType,
    title: `Đơn #${order.orderNumber} → ${toStatus}`,
    message: `Trạng thái đơn ${order.orderNumber}: ${order.status} → ${toStatus}`,
    link: `/admin/orders`,
    priority,
  }).catch(() => {/* silent */ });

  return { success: true };
}

/**
 * Ghi nhận thanh toán cho đơn hàng + award LP cho khách hàng
 */
export async function recordPayment(
  orderId: string,
  amount: number,
  method?: string,
  note?: string,
  confirmedBy?: string
): Promise<{ success: boolean; error?: string }> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      status: true, finalPrice: true, paidAmount: true, totalAmount: true,
      orderNumber: true, customerEmail: true, customerName: true,
    },
  });

  if (!order) {
    return { success: false, error: "Order not found" };
  }

  // P1-6 FIX: reject payment on terminal orders
  if (["completed", "cancelled"].includes(order.status)) {
    return { success: false, error: "Cannot record payment for completed or cancelled order" };
  }

  const totalExpected = order.finalPrice ?? order.totalAmount ?? 0;
  const newPaidAmount = order.paidAmount + amount;

  // Determine payment status — use consistent values matching business semantics
  // Valid: "unpaid" | "paid_partial" | "paid_full"
  let paymentStatus: string;
  if (newPaidAmount >= totalExpected) {
    paymentStatus = "paid_full";
  } else if (newPaidAmount > 0) {
    paymentStatus = "paid_partial";
  } else {
    paymentStatus = "unpaid";
  }

  // Atomic: create payment + update order + award LP to all parties
  // P0-2 FIX: moved awardReferralLpOnCompletion into this tx below so it commits atomically.
  await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.create({
      data: {
        orderId,
        amount,
        method,
        note,
        confirmedBy,
        confirmedAt: new Date(),
      },
    });

    await tx.order.update({
      where: { id: orderId },
      data: { paidAmount: newPaidAmount, paymentStatus },
    });

    // ── Award LP to customer (10% of payment, silent failure) ──────────────────
    if (amount > 0 && order.customerEmail) {
      await awardCustomerLpOnPayment({
        orderId,
        orderNumber: order.orderNumber,
        customerEmail: order.customerEmail,
        customerName: order.customerName ?? "",
        paidAmount: amount,
        paymentId: payment.id,
      });
    }

    // ── Award referral LP to referrer if order came via referral code ───────────
    if (amount > 0) {
      await awardReferralLpOnPayment({
        orderId,
        orderNumber: order.orderNumber,
        paidAmount: amount,
        paymentId: payment.id,
      });
    }

    // ── Distribute LP to staff via Order.lpAllocation ───────────────────────────
    // P0-1+P0-2 FIX: build award data first, then batch-insert inside the same tx.
    // Previously distributeLpFromOrder opened its own separate connection.
    if (amount > 0) {
      const orderData = await tx.order.findUnique({
        where: { id: orderId },
        select: {
          lpAllocation: true,
          projectMembers: { select: { id: true, projectRoleKey: true, memberId: true } },
        },
      });

      if (orderData?.lpAllocation) {
        const awards = buildLpAwardsFromOrder(
          orderId,
          amount,
          orderData.lpAllocation as Record<string, number>,
          orderData.projectMembers
        );

        if (awards.length > 0) {
          await tx.lpAward.createMany({
            data: awards.map((a) => ({
              memberId: a.memberId,
              projectId: orderId,
              lpAmount: a.lpAmount,
              expAmount: 0,
              source: a.source,
              status: "pending", // PM reviews before LP is credited
            })),
          });
        }
      }
    }

    // ── P0-3 FIX: award referral LP on order completion INSIDE this tx ─────────
    // Previously this was fire-and-forget after the tx — silent data loss risk.
    // Moved here so it commits atomically with the payment record.
    const isCompletion = newPaidAmount >= totalExpected;
    if (isCompletion && order.customerEmail) {
      await awardReferralLpOnCompletion(orderId, order.orderNumber, newPaidAmount);
    }

    return payment;
  });

  return { success: true };
}

/**
 * Áp dụng rewards cho đơn hàng dựa trên XP level
 */
export async function applyOrderRewards(
  orderId: string,
  rewardLevel: number
): Promise<void> {
  if (rewardLevel < 2) return;

  // Lấy tất cả reward tiers <= level
  const tiers = await prisma.rewardTier.findMany({
    where: {
      level: { lte: rewardLevel },
      isActive: true,
    },
    include: {
      items: {
        include: { addonService: true },
      },
    },
  });

  // Tạo OrderReward records
  const rewardData = tiers.flatMap((tier) =>
    tier.items.map((item) => ({
      orderId,
      addonServiceId: item.addonServiceId,
      rewardLevel: tier.level,
      quantity: item.quantity,
      durationMonths: item.durationMonths,
      status: "pending" as const,
    }))
  );

  if (rewardData.length > 0) {
    await prisma.orderReward.createMany({ data: rewardData });
  }
}
