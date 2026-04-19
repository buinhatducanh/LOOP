import { handleError } from "@/lib/api/response";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import { createAuditLog } from "@/lib/auth/audit";

export async function GET(req: NextRequest) {
  try {
    await requirePermission("services", "read");
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const search = searchParams.get("search") || "";

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { nameVi: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
      ];
    }

    const [data] = await Promise.all([
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

    // Filter to only custom features (tier = "custom")
    const customData = data.filter(f => f.tier === "custom");

    return NextResponse.json({
      data: customData,
      pagination: { page, limit, total: customData.length, totalPages: Math.ceil(customData.length / limit) },
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
        category: data.category || "Tùy chỉnh",
        categoryVi: data.categoryVi || data.category || "Tùy chỉnh",
        icon: data.icon || null,
        price: Number(data.price) || 0,
        isRequired: data.isRequired ?? false,
        sortOrder: Number(data.sortOrder) || 0,
        isActive: data.isActive ?? true,
        tier: "custom", // Enforce custom tier
        xpPoints: Number(data.xpPoints) || 0,
        parentId: data.parentId || null,
        isUpgradeable: data.isUpgradeable ?? false,
        serviceKey: data.serviceKey ?? null,
      },
    });

    await createAuditLog({
      userId: session.userId,
      action: "create",
      resource: "custom_features",
      resourceId: attribute.id,
      newValues: data,
    });

    return NextResponse.json({ data: attribute }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
