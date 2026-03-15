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
    const type = searchParams.get("type") || "";

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { nameVi: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
      ];
    }
    if (type) {
      where.type = type;
    }

    const [data, total] = await Promise.all([
      prisma.addonService.findMany({
        where,
        orderBy: [{ sortOrder: "asc" }],
        skip: (page - 1) * limit,
        take: limit,
        include: {
          _count: { select: { rewardTierItems: true, orderRewards: true } },
        },
      }),
      prisma.addonService.count({ where }),
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

    const addonService = await prisma.addonService.create({
      data: {
        slug: data.slug,
        name: data.name,
        nameVi: data.nameVi,
        description: data.description || null,
        descriptionVi: data.descriptionVi || null,
        icon: data.icon || null,
        type: data.type,
        price: Number(data.price) || 0,
        billingPeriod: data.billingPeriod || null,
        metadata: data.metadata ?? undefined,
        sortOrder: Number(data.sortOrder) || 0,
        isActive: data.isActive ?? true,
      },
    });

    await createAuditLog({
      userId: session.userId,
      action: "create",
      resource: "addon_services",
      resourceId: addonService.id,
      newValues: data,
    });

    revalidatePath("/vi/services");
    revalidatePath("/en/services");

    return NextResponse.json({ data: addonService }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
