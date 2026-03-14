import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/permissions";

export async function GET() {
  try {
    await requireAuth();

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

    recentOrders.forEach((order) => {
      const d = new Date(order.createdAt);
      const key = `${months[d.getMonth()]}/${d.getFullYear()}`;
      if (monthlyData[key]) {
        monthlyData[key].orders += 1;
        monthlyData[key].revenue += order.totalAmount || 0;
      }
    });

    const monthlyTrend = Object.entries(monthlyData).map(([month, data]) => ({
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

    recentMessages.forEach((msg) => {
      const d = new Date(msg.createdAt);
      const key = `${months[d.getMonth()]}/${d.getFullYear()}`;
      if (monthlyMessages[key] !== undefined) {
        monthlyMessages[key] += 1;
      }
    });

    const messageTrend = Object.entries(monthlyMessages).map(([month, count]) => ({
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
      ordersByStatus: ordersByStatus.map((s) => ({
        status: s.status,
        count: s._count.id,
      })),
      monthlyTrend,
      messagesByStatus: messagesByStatus.map((s) => ({
        status: s.status,
        count: s._count.id,
      })),
      messageTrend,
      paymentBreakdown: paymentBreakdown.map((p) => ({
        status: p.paymentStatus,
        count: p._count.id,
        amount: p._sum.totalAmount || 0,
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
