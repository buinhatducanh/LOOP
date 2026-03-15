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
      totalTemplates,
      totalAttributes,
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
      prisma.webTemplate.count({ where: { isActive: true } }),
      prisma.serviceAttribute.count({ where: { isActive: true } }),
      prisma.order.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          package: { select: { title: true } },
          template: { select: { name: true, nameVi: true } },
        },
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
        totalTemplates,
        totalAttributes,
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
