import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/permissions";

// GET - Lấy chi tiết website
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const website = await prisma.customerWebsite.findUnique({
      where: { id },
      include: {
        websiteStats: {
          orderBy: { date: "desc" },
          take: 30, // 30 ngày gần nhất
        },
        pageViews: {
          orderBy: { date: "desc" },
          take: 50,
        },
        order: true,
      },
    });

    if (!website) {
      return NextResponse.json({ error: "Website không tồn tại" }, { status: 404 });
    }

    // Tính toán thống kê
    const stats = website.websiteStats;
    const totalVisitors = stats.reduce((sum, s) => sum + s.visitors, 0);
    const totalPageViews = stats.reduce((sum, s) => sum + s.pageViews, 0);
    const avgUptime = stats.length > 0
      ? stats.reduce((sum, s) => sum + s.uptime, 0) / stats.length
      : 100;
    const avgResponseTime = stats.filter(s => s.responseTime).length > 0
      ? stats.filter(s => s.responseTime).reduce((sum, s) => sum + (s.responseTime || 0), 0) / stats.filter(s => s.responseTime).length
      : 0;

    // Top pages
    const pageViewsByUrl = website.pageViews.reduce((acc, pv) => {
      if (!acc[pv.pageUrl]) {
        acc[pv.pageUrl] = { pageUrl: pv.pageUrl, pageTitle: pv.pageTitle, views: 0 };
      }
      acc[pv.pageUrl].views += pv.views;
      return acc;
    }, {} as Record<string, { pageUrl: string; pageTitle: string | null; views: number }>);

    const topPages = Object.values(pageViewsByUrl)
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);

    return NextResponse.json({
      data: {
        ...website,
        summary: {
          totalVisitors,
          totalPageViews,
          avgUptime: avgUptime.toFixed(2),
          avgResponseTime: Math.round(avgResponseTime),
          totalDays: stats.length,
        },
        topPages,
      },
    });
  } catch (error) {
    console.error("Error fetching website:", error);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}

// PUT - Cập nhật website
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    const website = await prisma.customerWebsite.update({
      where: { id },
      data: body,
    });

    return NextResponse.json({ data: website });
  } catch (error) {
    console.error("Error updating website:", error);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}

// DELETE - Xóa website
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    await prisma.customerWebsite.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting website:", error);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}
