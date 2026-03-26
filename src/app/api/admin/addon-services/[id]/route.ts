import { ok, handleError } from "@/lib/api/response";
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

    const addonService = await prisma.addonService.findUnique({
      where: { id },
      include: {
        _count: { select: { rewardTierItems: true, orderRewards: true } },
      },
    });

    if (!addonService) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ data: addonService });
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

    const existing = await prisma.addonService.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const addonService = await prisma.addonService.update({
      where: { id },
      data: {
        slug: data.slug,
        name: data.name,
        nameVi: data.nameVi,
        description: data.description ?? null,
        descriptionVi: data.descriptionVi ?? null,
        icon: data.icon ?? null,
        type: data.type,
        price: Number(data.price) || 0,
        billingPeriod: data.billingPeriod ?? null,
        /** LP cost: null = not redeemable with LP */
        lpCost: data.lpCost != null ? Number(data.lpCost) : null,
        metadata: data.metadata ?? undefined,
        sortOrder: Number(data.sortOrder) || 0,
        isActive: data.isActive ?? true,
      },
    });

    await createAuditLog({
      userId: session.userId,
      action: "update",
      resource: "addon_services",
      resourceId: id,
      oldValues: existing as unknown as Record<string, unknown>,
      newValues: data,
    });

    revalidatePath("/vi/services");
    revalidatePath("/en/services");

    return NextResponse.json({ data: addonService });
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

    const existing = await prisma.addonService.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.addonService.delete({ where: { id } });

    await createAuditLog({
      userId: session.userId,
      action: "delete",
      resource: "addon_services",
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
