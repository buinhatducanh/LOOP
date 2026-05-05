import { handleError, ok } from "@/lib/api/response";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import { createAuditLog } from "@/lib/auth/audit";
import { revalidatePath, revalidateTag } from "next/cache";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission("pricing_features", "read");
    const { id } = await params;

    const group = await prisma.featureGroup.findUnique({
      where: { id },
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
    });

    if (!group) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Resolve includedTiers from ServicePackage.features (same as list route)
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

    const enrichedGroup = {
      ...group,
      features: group.features.map(f => ({
        ...f,
        includedTiers: (f.includedTiers as unknown as number[] ?? []).length > 0
          ? f.includedTiers
          : featureTiersMap.get(f.id) ?? [],
      })),
    };

    return NextResponse.json({ data: enrichedGroup });
  } catch (error) {
    return handleError(error);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission("pricing_features", "update");
    const { id } = await params;
    const data = await req.json();

    const existing = await prisma.featureGroup.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const group = await prisma.featureGroup.update({
      where: { id },
      data: {
        ...(data.groupName !== undefined && { groupName: data.groupName }),
        ...(data.slug !== undefined && { slug: data.slug }),
        ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.serviceKey !== undefined && { serviceKey: data.serviceKey }),
      },
    });

    await createAuditLog({
      userId: session.userId,
      action: "update",
      resource: "feature_groups",
      resourceId: id,
      oldValues: existing as unknown as Record<string, unknown>,
      newValues: data,
    });

    revalidatePath("/vi/thiet-ke-website");
    revalidatePath("/en/thiet-ke-website");
    revalidatePath("/ja/thiet-ke-website");
    revalidatePath("/ko/thiet-ke-website");
    revalidatePath("/zh/thiet-ke-website");
    revalidateTag("pricing-config");

    return NextResponse.json({ data: group });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission("pricing_features", "delete");
    const { id } = await params;

    const existing = await prisma.featureGroup.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.featureGroup.delete({ where: { id } });

    await createAuditLog({
      userId: session.userId,
      action: "delete",
      resource: "feature_groups",
      resourceId: id,
      oldValues: existing as unknown as Record<string, unknown>,
    });

    return ok({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
