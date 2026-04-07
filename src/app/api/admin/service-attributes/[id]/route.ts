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
        templateAttributes: {
          include: { template: { select: { id: true, name: true, nameVi: true } } },
        },
        parent: { select: { id: true, name: true, nameVi: true } },
        children: { select: { id: true, name: true, nameVi: true, tier: true } },
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

    const attribute = await prisma.serviceAttribute.update({
      where: { id },
      data: {
        slug: data.slug,
        name: data.name,
        nameVi: data.nameVi,
        description: data.description ?? null,
        descriptionVi: data.descriptionVi ?? null,
        category: data.category,
        categoryVi: data.categoryVi,
        icon: data.icon ?? null,
        price: Number(data.price) || 0,
        isRequired: data.isRequired ?? false,
        sortOrder: Number(data.sortOrder) || 0,
        isActive: data.isActive ?? true,
        tier: data.tier || "basic",
        xpPoints: Number(data.xpPoints) || 0,
        parentId: data.parentId || null,
      },
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

    await prisma.serviceAttribute.delete({ where: { id } });

    await createAuditLog({
      userId: session.userId,
      action: "delete",
      resource: "service_attributes",
      resourceId: id,
      oldValues: existing as unknown as Record<string, unknown>,
    });

    revalidatePath("/vi/services");
    revalidatePath("/en/services");

    return ok({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
