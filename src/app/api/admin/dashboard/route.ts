import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/permissions";

export async function GET() {
  try {
    await requireAuth();

    const [
      totalServices,
      totalProjects,
      totalOrders,
      totalMessages,
      totalUsers,
      newMessages,
      pendingOrders,
      recentOrders,
      recentMessages,
    ] = await Promise.all([
      prisma.service.count({ where: { isActive: true } }),
      prisma.project.count({ where: { isPublished: true } }),
      prisma.order.count(),
      prisma.contactMessage.count(),
      prisma.user.count(),
      prisma.contactMessage.count({ where: { status: "new" } }),
      prisma.order.count({ where: { status: "pending" } }),
      prisma.order.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { package: { select: { title: true } } },
      }),
      prisma.contactMessage.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

    return NextResponse.json({
      stats: {
        totalServices,
        totalProjects,
        totalOrders,
        totalMessages,
        totalUsers,
        newMessages,
        pendingOrders,
      },
      recentOrders,
      recentMessages,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
