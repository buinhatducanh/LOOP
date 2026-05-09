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

    // Build feature → tierLevel map from ServicePackage.features arrays
    // This correctly populates includedTiers even if seed set it to []
    const packages = await prisma.servicePackage.findMany({
      where: { type: "website" },
      select: { tierLevel: true, features: true },
    });

    const featureTiersMap = new Map<string, number[]>();
    for (const pkg of packages) {
      for (const fid of (pkg.features ?? [])) {
        if (!featureTiersMap.has(fid)) featureTiersMap.set(fid, []);
        const tiers = featureTiersMap.get(fid)!;
        if (!tiers.includes(pkg.tierLevel ?? 1)) tiers.push(pkg.tierLevel ?? 1);
      }
    }

    // Attach resolved includedTiers to each feature (overrides empty seed values)
    const enrichedGroups = groups.map((g: typeof groups[number]) => ({
      ...g,
      features: g.features.map((f: typeof groups[number]["features"][number]) => ({
        ...f,
        // Prefer DB value if non-empty, otherwise use resolved from packages
        includedTiers: (f.includedTiers as unknown as number[] ?? []).length > 0
          ? f.includedTiers
          : featureTiersMap.get(f.id) ?? [],
      })),
    }));

    return NextResponse.json({
      data: enrichedGroups,
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
        serviceKey: data.serviceKey ?? null,
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
