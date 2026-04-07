import { handleError, ok } from "@/lib/api/response";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import { createAuditLog } from "@/lib/auth/audit";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission("pricing_features", "read");
    const { id } = await params;

    const feature = await prisma.feature.findUnique({
      where: { id },
      include: {
        variants: { orderBy: { sortOrder: "asc" } },
        group: { select: { groupName: true } },
      },
    });

    if (!feature) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ data: feature });
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

    const existing = await prisma.feature.findUnique({
      where: { id },
      include: { variants: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Update feature and handle variants (upsert pattern)
    const feature = await prisma.$transaction(async (tx) => {
      // Update the feature itself
      const _updated = await tx.feature.update({
        where: { id },
        data: {
          featureName: data.featureName,
          description: data.description,
          logicLevel: data.logicLevel,
          isRequired: data.isRequired,
          sortOrder: data.sortOrder,
          isActive: data.isActive,
          groupId: data.groupId,
        },
      });

      // Handle variants if provided
      if (data.variants) {
        // Delete removed variants
        const incomingIds = data.variants
          .filter((v: { id?: string }) => v.id)
          .map((v: { id: string }) => v.id);
        
        await tx.featureVariant.deleteMany({
          where: {
            featureId: id,
            id: { notIn: incomingIds },
          },
        });

        // Upsert each variant
        for (const v of data.variants) {
          if (v.id) {
            await tx.featureVariant.update({
              where: { id: v.id },
              data: {
                variantName: v.variantName,
                description: v.description || null,
                price: v.price || 0,
                resourceUsage: v.resourceUsage || null,
                sortOrder: v.sortOrder ?? 0,
                isActive: v.isActive ?? true,
              },
            });
          } else {
            await tx.featureVariant.create({
              data: {
                featureId: id,
                variantName: v.variantName,
                description: v.description || null,
                price: v.price || 0,
                resourceUsage: v.resourceUsage || null,
                sortOrder: v.sortOrder ?? 0,
                isActive: v.isActive ?? true,
              },
            });
          }
        }
      }

      return tx.feature.findUnique({
        where: { id },
        include: { variants: { orderBy: { sortOrder: "asc" } } },
      });
    });

    await createAuditLog({
      userId: session.userId,
      action: "update",
      resource: "features",
      resourceId: id,
      oldValues: existing as unknown as Record<string, unknown>,
      newValues: data,
    });

    return NextResponse.json({ data: feature });
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

    const existing = await prisma.feature.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.feature.delete({ where: { id } });

    await createAuditLog({
      userId: session.userId,
      action: "delete",
      resource: "features",
      resourceId: id,
      oldValues: existing as unknown as Record<string, unknown>,
    });

    return ok({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
