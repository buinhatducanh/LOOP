import { handleError } from "@/lib/api/response";

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";;
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/permissions";
import { orderLogger } from "@/lib/logger";

export async function GET(req: NextRequest) {
  const start = Date.now();
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

    orderLogger.withSLO("GET /api/admin/dashboard success", {
      endpoint: "/api/admin/dashboard",
      method: "GET",
      statusCode: 200,
      latencyMs: Date.now() - start,
    });
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
    orderLogger.withSLO("GET /api/admin/dashboard failed", {
      endpoint: "/api/admin/dashboard",
      method: "GET",
      statusCode: 500,
      latencyMs: Date.now() - start,
      error: error instanceof Error ? error.message : String(error),
    });
    return handleError(error);
  }
}
