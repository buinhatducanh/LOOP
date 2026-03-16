import { prisma } from "@/lib/prisma";

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
 * Chuyển trạng thái đơn hàng + ghi log lịch sử
 */
export async function transitionOrderStatus(
  orderId: string,
  toStatus: string,
  changedBy?: string,
  note?: string
): Promise<{ success: boolean; error?: string }> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { status: true, orderType: true },
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

  // Update trạng thái + ghi history trong transaction
  await prisma.$transaction([
    prisma.order.update({
      where: { id: orderId },
      data: { status: toStatus },
    }),
    prisma.orderStatusHistory.create({
      data: {
        orderId,
        fromStatus: order.status,
        toStatus,
        changedBy,
        note,
      },
    }),
  ]);

  return { success: true };
}

/**
 * Ghi nhận thanh toán cho đơn hàng
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
    select: { finalPrice: true, paidAmount: true, totalAmount: true },
  });

  if (!order) {
    return { success: false, error: "Order not found" };
  }

  const totalExpected = order.finalPrice ?? order.totalAmount ?? 0;
  const newPaidAmount = order.paidAmount + amount;

  // Xác định payment status mới
  let paymentStatus: string;
  if (newPaidAmount >= totalExpected) {
    paymentStatus = "paid";
  } else if (newPaidAmount > 0) {
    paymentStatus = "partial";
  } else {
    paymentStatus = "unpaid";
  }

  await prisma.$transaction([
    prisma.payment.create({
      data: {
        orderId,
        amount,
        method,
        note,
        confirmedBy,
        confirmedAt: new Date(),
      },
    }),
    prisma.order.update({
      where: { id: orderId },
      data: {
        paidAmount: newPaidAmount,
        paymentStatus,
      },
    }),
  ]);

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
