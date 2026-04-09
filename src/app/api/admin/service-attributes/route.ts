import { handleError } from "@/lib/api/response";
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
    const limit = parseInt(searchParams.get("limit") || "50");
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
      prisma.serviceAttribute.findMany({
        where,
        orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
        skip: (page - 1) * limit,
        take: limit,
        include: {
          _count: { select: { templateAttributes: true, orderAttributes: true } },
          parent: { select: { id: true, name: true, nameVi: true } },
          children: { select: { id: true, name: true, nameVi: true, tier: true, isUpgradeable: true } },
        },
      }),
      prisma.serviceAttribute.count({ where }),
    ]);

    return NextResponse.json({
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requirePermission("services", "create");
    const data = await req.json();

    const attribute = await prisma.serviceAttribute.create({
      data: {
        slug: data.slug,
        name: data.name,
        nameVi: data.nameVi,
        description: data.description || null,
        descriptionVi: data.descriptionVi || null,
        category: data.category,
        categoryVi: data.categoryVi,
        icon: data.icon || null,
        price: Number(data.price) || 0,
        isRequired: data.isRequired ?? false,
        sortOrder: Number(data.sortOrder) || 0,
        isActive: data.isActive ?? true,
        tier: data.tier || "basic",
        xpPoints: Number(data.xpPoints) || 0,
        parentId: data.parentId || null,
        isUpgradeable: data.isUpgradeable ?? false,
      },
    });

    await createAuditLog({
      userId: session.userId,
      action: "create",
      resource: "service_attributes",
      resourceId: attribute.id,
      newValues: data,
    });

    revalidatePath("/vi/services");
    revalidatePath("/en/services");

    return NextResponse.json({ data: attribute }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
