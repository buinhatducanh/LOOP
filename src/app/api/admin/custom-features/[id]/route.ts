import { handleError, ok } from "@/lib/api/response";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
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
        parent: { select: { id: true, name: true, nameVi: true, isUpgradeable: true } },
        children: { select: { id: true, name: true, nameVi: true, tier: true, isUpgradeable: true } },
      },
    });

    if (!attribute || attribute.tier !== "custom") {
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
    if (!existing || existing.tier !== "custom") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const attribute = await prisma.serviceAttribute.update({
      where: { id },
      data: {
        slug: data.slug,
        name: data.name,
        nameVi: data.nameVi,
        description: data.description ?? null,
        descriptionVi: data.descriptionVi ?? null,
        category: data.category ?? "Tùy chỉnh",
        categoryVi: data.categoryVi ?? data.category ?? "Tùy chỉnh",
        icon: data.icon ?? null,
        price: Number(data.price) || 0,
        isRequired: data.isRequired ?? false,
        sortOrder: Number(data.sortOrder) || 0,
        isActive: data.isActive ?? true,
        xpPoints: Number(data.xpPoints) || 0,
        parentId: data.parentId || null,
        isUpgradeable: data.isUpgradeable ?? false,
        // Keep tier as "custom" — don't allow changing tier
      },
    });

    await createAuditLog({
      userId: session.userId,
      action: "update",
      resource: "custom_features",
      resourceId: id,
      oldValues: existing as unknown as Record<string, unknown>,
      newValues: data,
    });

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
    if (!existing || existing.tier !== "custom") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.serviceAttribute.delete({ where: { id } });

    await createAuditLog({
      userId: session.userId,
      action: "delete",
      resource: "custom_features",
      resourceId: id,
      oldValues: existing as unknown as Record<string, unknown>,
    });

    revalidatePath("/vi/thiet-ke-website");
    revalidatePath("/en/thiet-ke-website");

    return ok({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
