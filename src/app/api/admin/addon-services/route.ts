import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import { createAuditLog } from "@/lib/auth/audit";
import { revalidatePath } from "next/cache";
import {
  buildQueryFromParams,
  parsePagination,
  buildPaginationResponse,
  ADDON_SERVICE_FILTER_CONFIG,
} from "@/lib/api/search-utils";

export async function GET(req: NextRequest) {
  try {
    await requirePermission("services", "read");
    const { searchParams } = new URL(req.url);
    const { where, orderBy } = buildQueryFromParams(searchParams, ADDON_SERVICE_FILTER_CONFIG);
    const { page, limit } = parsePagination(searchParams);

    const [data, total] = await Promise.all([
      prisma.addonService.findMany({
        where,
        orderBy,
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
        /** LP cost for staff redemption. Null = not redeemable with LP. */
        lpCost: data.lpCost != null ? Number(data.lpCost) : null,
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
