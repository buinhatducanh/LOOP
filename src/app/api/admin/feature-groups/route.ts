import { handleError } from "@/lib/api/response";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import { createAuditLog } from "@/lib/auth/audit";

export async function GET(req: NextRequest) {
  try {
    const session = await requirePermission("pricing_features", "read");
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const search = searchParams.get("search") || "";

    const where = search
      ? {
          groupName: { contains: search, mode: "insensitive" as const },
        }
      : {};

    const [groups, total] = await Promise.all([
      prisma.featureGroup.findMany({
        where,
        orderBy: { sortOrder: "asc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          features: {
            orderBy: { sortOrder: "asc" },
            include: {
              variants: {
                orderBy: { sortOrder: "asc" },
              },
            },
          },
        },
      }),
      prisma.featureGroup.count({ where }),
    ]);

    return NextResponse.json({
      data: groups,
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

    const group = await prisma.featureGroup.create({
      data: {
        groupName: data.groupName,
        slug: data.slug,
        sortOrder: data.sortOrder || 0,
        isActive: data.isActive ?? true,
      },
    });

    await createAuditLog({
      userId: session.userId,
      action: "create",
      resource: "feature_groups",
      resourceId: group.id,
      newValues: data,
    });

    return NextResponse.json({ data: group }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
