import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import { createAuditLog } from "@/lib/auth/audit";
import { revalidatePath } from "next/cache";

export async function GET(req: NextRequest) {
  try {
    await requirePermission("services", "read");
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { nameVi: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
      ];
    }
    if (category) {
      where.category = category;
    }

    const [data, total] = await Promise.all([
      prisma.webTemplate.findMany({
        where,
        orderBy: { sortOrder: "asc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          bundledAttributes: {
            include: {
              attribute: { select: { id: true, name: true, nameVi: true, icon: true } },
            },
          },
          _count: { select: { orders: true } },
        },
      }),
      prisma.webTemplate.count({ where }),
    ]);

    return NextResponse.json({
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requirePermission("services", "create");
    const data = await req.json();

    const template = await prisma.webTemplate.create({
      data: {
        slug: data.slug,
        name: data.name,
        nameVi: data.nameVi,
        description: data.description || null,
        descriptionVi: data.descriptionVi || null,
        category: data.category,
        categoryVi: data.categoryVi,
        thumbnail: data.thumbnail,
        screenshots: data.screenshots || [],
        demoUrl: data.demoUrl,
        price: Number(data.price) || 0,
        originalPrice: data.originalPrice ? Number(data.originalPrice) : null,
        currency: data.currency || "VND",
        technologies: data.technologies || [],
        deliveryTime: data.deliveryTime,
        highlighted: data.highlighted ?? false,
        sortOrder: Number(data.sortOrder) || 0,
        isActive: data.isActive ?? true,
        // Gắn cứng các tính năng đi kèm
        bundledAttributes: data.attributeIds?.length
          ? {
              create: data.attributeIds.map((attrId: string) => ({
                attributeId: attrId,
              })),
            }
          : undefined,
      },
      include: {
        bundledAttributes: {
          include: {
            attribute: { select: { id: true, name: true, nameVi: true } },
          },
        },
      },
    });

    await createAuditLog({
      userId: session.userId,
      action: "create",
      resource: "web_templates",
      resourceId: template.id,
      newValues: data,
    });

    revalidatePath("/vi/services");
    revalidatePath("/en/services");

    return NextResponse.json({ data: template }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
