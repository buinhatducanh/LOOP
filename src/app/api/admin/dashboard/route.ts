import { handleError } from "@/lib/api/response";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/permissions";

export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);

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
    return handleError(error);
  }
}
