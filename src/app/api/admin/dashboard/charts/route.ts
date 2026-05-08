
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";;
import { handleError } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/permissions";

export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);

    // Get orders grouped by status
    const ordersByStatus = await prisma.order.groupBy({
      by: ["status"],
      _count: { id: true },
    });

    // Get orders from last 6 months for trend
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const recentOrders = await prisma.order.findMany({
      where: { createdAt: { gte: sixMonthsAgo } },
      select: { createdAt: true, totalAmount: true, status: true },
      orderBy: { createdAt: "asc" },
    });

    // Group orders by month
    const monthlyData: Record<string, { orders: number; revenue: number }> = {};
    const months = ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12"];

    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${months[d.getMonth()]}/${d.getFullYear()}`;
      monthlyData[key] = { orders: 0, revenue: 0 };
    }

    recentOrders.forEach((order: typeof recentOrders[number]) => {
      const d = new Date(order.createdAt);
      const key = `${months[d.getMonth()]}/${d.getFullYear()}`;
      if (monthlyData[key]) {
        monthlyData[key].orders += 1;
        monthlyData[key].revenue += order.totalAmount || 0;
      }
    });

    const monthlyTrend = Object.entries(monthlyData).map(([month, data]: [string, { orders: number; revenue: number }]) => ({
      month,
      orders: data.orders,
      revenue: data.revenue,
    }));

    // Get messages grouped by status
    const messagesByStatus = await prisma.contactMessage.groupBy({
      by: ["status"],
      _count: { id: true },
    });

    // Get messages from last 6 months
    const recentMessages = await prisma.contactMessage.findMany({
      where: { createdAt: { gte: sixMonthsAgo } },
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    });

    const monthlyMessages: Record<string, number> = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${months[d.getMonth()]}/${d.getFullYear()}`;
      monthlyMessages[key] = 0;
    }

    recentMessages.forEach((msg: typeof recentMessages[number]) => {
      const d = new Date(msg.createdAt);
      const key = `${months[d.getMonth()]}/${d.getFullYear()}`;
      if (monthlyMessages[key] !== undefined) {
        monthlyMessages[key] += 1;
      }
    });

    const messageTrend = Object.entries(monthlyMessages).map(([month, count]: [string, number]) => ({
      month,
      messages: count,
    }));

    // Payment status breakdown
    const paymentBreakdown = await prisma.order.groupBy({
      by: ["paymentStatus"],
      _count: { id: true },
      _sum: { totalAmount: true },
    });

    return NextResponse.json({
      ordersByStatus: ordersByStatus.map((s: typeof ordersByStatus[number]) => ({
        status: s.status,
        count: s._count.id,
      })),
      monthlyTrend,
      messagesByStatus: messagesByStatus.map((s: typeof messagesByStatus[number]) => ({
        status: s.status,
        count: s._count.id,
      })),
      messageTrend,
      paymentBreakdown: paymentBreakdown.map((p: typeof paymentBreakdown[number]) => ({
        status: p.paymentStatus,
        count: p._count.id,
        amount: p._sum.totalAmount || 0,
      })),
    });
  } catch (error) {
    return handleError(error);
  }
}
