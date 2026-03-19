import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import { createAuditLog } from "@/lib/auth/audit";
import { revalidatePath } from "next/cache";
import {
  buildQueryFromParams,
  parsePagination,
  buildPaginationResponse,
  WEB_TEMPLATE_FILTER_CONFIG,
} from "@/lib/api/search-utils";

export async function GET(req: NextRequest) {
  try {
    await requirePermission("services", "read");
    const { searchParams } = new URL(req.url);
    const { where, orderBy } = buildQueryFromParams(searchParams, WEB_TEMPLATE_FILTER_CONFIG);
    const { page, limit } = parsePagination(searchParams);

    const [data, total] = await Promise.all([
      prisma.webTemplate.findMany({
        where,
        orderBy,
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
      ...buildPaginationResponse(total, page, limit),
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
