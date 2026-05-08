import { handleError, ok } from "@/lib/api/response";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import { createAuditLog } from "@/lib/auth/audit";
import { revalidatePath } from "next/cache";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission("services", "read");
    const { id } = await params;

    const attribute = await prisma.serviceAttribute.findUnique({
      where: { id },
      include: {
        templateAttributes: {
          include: { template: { select: { id: true, name: true, nameVi: true } } },
        },
        parent: { select: { id: true, name: true, nameVi: true, isUpgradeable: true } },
        children: { select: { id: true, name: true, nameVi: true, tier: true, isUpgradeable: true } },
      },
    });

    if (!attribute) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ data: attribute });
  } catch (error) {
    return handleError(error);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission("services", "update");
    const { id } = await params;
    const data = await req.json();

    const existing = await prisma.serviceAttribute.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const attribute = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const updated = await tx.serviceAttribute.update({
        where: { id },
        data: {
          ...(data.slug !== undefined && { slug: data.slug }),
          ...(data.name !== undefined && { name: data.name }),
          ...(data.nameVi !== undefined && { nameVi: data.nameVi }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.descriptionVi !== undefined && { descriptionVi: data.descriptionVi }),
          ...(data.category !== undefined && { category: data.category }),
          ...(data.categoryVi !== undefined && { categoryVi: data.categoryVi }),
          ...(data.icon !== undefined && { icon: data.icon }),
          ...(data.price !== undefined && { price: Number(data.price) }),
          ...(data.isRequired !== undefined && { isRequired: data.isRequired }),
          ...(data.sortOrder !== undefined && { sortOrder: Number(data.sortOrder) }),
          ...(data.isActive !== undefined && { isActive: data.isActive }),
          ...(data.tier !== undefined && { tier: data.tier }),
          ...(data.xpPoints !== undefined && { xpPoints: Number(data.xpPoints) }),
          ...(data.parentId !== undefined && { parentId: data.parentId || null }),
          ...(data.isUpgradeable !== undefined && { isUpgradeable: data.isUpgradeable }),
        },
      });

      // SYNC: Update Feature (Comparison Matrix) if nameVi, name, or slug matches
      const featuresToSync = await tx.feature.findMany({
        where: {
          OR: [
            { featureName: { equals: data.nameVi || existing.nameVi, mode: "insensitive" } },
            { featureName: { equals: data.name || existing.name, mode: "insensitive" } },
            { featureName: { equals: data.slug || existing.slug, mode: "insensitive" } },
          ],
        },
        select: { id: true },
      });

      if (featuresToSync.length > 0) {
        await tx.feature.updateMany({
          where: { id: { in: featuresToSync.map((f: typeof featuresToSync[number]) => f.id) } },
          data: {
            isActive: data.isActive !== undefined ? data.isActive : existing.isActive,
            // Only update name/category if they are explicitly provided in the request
            ...(data.nameVi && { featureName: data.nameVi }),
            ...(data.categoryVi && { category: data.categoryVi }),
          },
        });
      }

      return updated;
    });

    await createAuditLog({
      userId: session.userId,
      action: "update",
      resource: "service_attributes",
      resourceId: id,
      oldValues: existing as unknown as Record<string, unknown>,
      newValues: data,
    });

    revalidatePath("/vi/services");
    revalidatePath("/en/services");
    // Also revalidate website paths to show updated matrix immediately
    revalidatePath("/vi/thiet-ke-website");
    revalidatePath("/en/thiet-ke-website");

    return NextResponse.json({ data: attribute });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission("services", "delete");
    const { id } = await params;

    const existing = await prisma.serviceAttribute.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // SYNC: Delete from Feature (Matrix) if name match (case-insensitive)
      const featuresToDelete = await tx.feature.findMany({
        where: {
          OR: [
            { featureName: { equals: existing.nameVi, mode: "insensitive" } },
            { featureName: { equals: existing.name, mode: "insensitive" } },
          ],
        },
        select: { id: true },
      });

      if (featuresToDelete.length > 0) {
        await tx.feature.deleteMany({
          where: { id: { in: featuresToDelete.map((f: typeof featuresToDelete[number]) => f.id) } },
        });
      }

      await tx.serviceAttribute.delete({ where: { id } });
    });

    await createAuditLog({
      userId: session.userId,
      action: "delete",
      resource: "service_attributes",
      resourceId: id,
      oldValues: existing as unknown as Record<string, unknown>,
    });

    revalidatePath("/vi/services");
    revalidatePath("/en/services");
    revalidatePath("/vi/thiet-ke-website");
    revalidatePath("/en/thiet-ke-website");

    return ok({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
