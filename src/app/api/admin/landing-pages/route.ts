import { handleError } from "@/lib/api/response";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/permissions";
import { createAuditLog } from "@/lib/auth/audit";

// GET - List all landing pages
export async function GET(req: NextRequest) {
  try {
    await requireAuth();
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const locale = searchParams.get("locale");

    const where = locale ? { locale } : {};

    const [pages, total] = await Promise.all([
      prisma.landingPage.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          _count: { select: { sections: true } },
        },
      }),
      prisma.landingPage.count({ where }),
    ]);

    return NextResponse.json({
      data: pages,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return handleError(error);
  }
}

// POST - Create new landing page
export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    const data = await req.json();

    // Check if slug already exists
    const existing = await prisma.landingPage.findUnique({
      where: { slug: data.slug },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Slug already exists" },
        { status: 400 }
      );
    }

    // If isDefault, unset other default pages
    if (data.isDefault) {
      await prisma.landingPage.updateMany({
        where: { isDefault: true, locale: data.locale },
        data: { isDefault: false },
      });
    }

    const landingPage = await prisma.landingPage.create({
      data: {
        slug: data.slug,
        name: data.name,
        locale: data.locale || "vi",
        isPublished: data.isPublished || false,
        isDefault: data.isDefault || false,
        seoTitle: data.seoTitle,
        seoDesc: data.seoDesc,
        seoKeywords: data.seoKeywords,
      },
    });

    await createAuditLog({
      userId: session.userId,
      action: "create",
      resource: "landing_pages",
      resourceId: landingPage.id,
      newValues: data,
    });

    return NextResponse.json({ data: landingPage }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
