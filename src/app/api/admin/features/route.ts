import { handleError } from "@/lib/api/response";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import { createAuditLog } from "@/lib/auth/audit";
import { revalidatePath, revalidateTag } from "next/cache";
import type { FeatureWhereInput } from "@/generated/prisma/models/Feature";

export async function GET(req: NextRequest) {
  try {
    await requirePermission("pricing_features", "read");
    const { searchParams } = new URL(req.url);
    const groupId = searchParams.get("groupId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    const where: FeatureWhereInput = groupId ? { groupId } : {};

    const [features, total] = await Promise.all([
      prisma.feature.findMany({
        where,
        orderBy: { sortOrder: "asc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          variants: { orderBy: { sortOrder: "asc" } },
          group: { select: { groupName: true } },
        },
      }),
      prisma.feature.count({ where }),
    ]);

    return NextResponse.json({
      data: features,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requirePermission("pricing_features", "create");
    const data = await req.json();

    // Create feature with nested variants in a transaction
    const feature = await prisma.feature.create({
      data: {
        groupId: data.groupId,
        featureName: data.featureName,
        description: data.description || null,
        logicLevel: data.logicLevel || "Medium",
        isRequired: data.isRequired || false,
        sortOrder: data.sortOrder || 0,
        isActive: data.isActive ?? true,
        category: data.category ?? "Khác",
        extraPrice: data.extraPrice ?? 0,
        includedTiers: Array.isArray(data.includedTiers) ? data.includedTiers : "[]",
        variants: data.variants?.length
          ? {
              create: data.variants.map((v: { variantName: string; description?: string; price: number; resourceUsage?: unknown; sortOrder?: number }, idx: number) => ({
                variantName: v.variantName,
                description: v.description || null,
                price: v.price || 0,
                resourceUsage: v.resourceUsage || null,
                sortOrder: v.sortOrder ?? idx,
              })),
            }
          : undefined,
      },
      include: {
        variants: { orderBy: { sortOrder: "asc" } },
      },
    });

    await createAuditLog({
      userId: session.userId,
      action: "create",
      resource: "features",
      resourceId: feature.id,
      newValues: data,
    });

    revalidatePath("/vi/thiet-ke-website");
    revalidatePath("/en/thiet-ke-website");
    revalidateTag("pricing-config");

    return NextResponse.json({ data: feature }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
