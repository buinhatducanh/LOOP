import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/permissions";

// GET - Lấy danh sách website
export async function GET(_req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(_req.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { domain: { contains: search, mode: "insensitive" } },
        { name: { contains: search, mode: "insensitive" } },
        { customerName: { contains: search, mode: "insensitive" } },
        { customerEmail: { contains: search, mode: "insensitive" } },
      ];
    }

    const [websites, total] = await Promise.all([
      prisma.customerWebsite.findMany({
        where,
        include: {
          websiteStats: {
            orderBy: { date: "desc" },
            take: 7,
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.customerWebsite.count({ where }),
    ]);

    return NextResponse.json({
      data: websites,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching websites:", error);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}

// POST - Tạo website mới
export async function POST(_req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await _req.json();
    const {
      domain,
      subdomain,
      name,
      description,
      hostingProvider,
      hostingUrl,
      customerId,
      customerName,
      customerEmail,
      customerPhone,
      orderId,
    } = body;

    if (!domain || !name) {
      return NextResponse.json({ error: "Domain và tên là bắt buộc" }, { status: 400 });
    }

    const website = await prisma.customerWebsite.create({
      data: {
        domain,
        subdomain,
        name,
        description,
        hostingProvider,
        hostingUrl,
        customerId,
        customerName,
        customerEmail,
        customerPhone,
        orderId,
        status: "active",
        isMonitored: true,
        deployedAt: new Date(),
      },
    });

    return NextResponse.json({ data: website });
  } catch (error) {
    console.error("Error creating website:", error);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}
