import { handleError, ok } from "@/lib/api/response";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import { createAuditLog } from "@/lib/auth/audit";
import { revalidatePath } from "next/cache";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const session = await requirePermission("services", "update");
    const { id, itemId } = await params;
    const data = await req.json();

    const existing = await prisma.rewardTierItem.findUnique({
      where: { id: itemId },
    });
    if (!existing || existing.rewardTierId !== id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const item = await prisma.rewardTierItem.update({
      where: { id: itemId },
      data: {
        addonServiceId: data.addonServiceId,
        quantity: Number(data.quantity) || 1,
        durationMonths: Number(data.durationMonths) || null,
        description: data.description ?? null,
        sortOrder: Number(data.sortOrder) || 0,
      },
    });

    await createAuditLog({
      userId: session.userId,
      action: "update",
      resource: "reward_tiers",
      resourceId: itemId,
      oldValues: existing as unknown as Record<string, unknown>,
      newValues: data,
    });

    revalidatePath("/vi/services");
    revalidatePath("/en/services");

    return NextResponse.json({ data: item });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const session = await requirePermission("services", "delete");
    const { id, itemId } = await params;

    const existing = await prisma.rewardTierItem.findUnique({
      where: { id: itemId },
    });
    if (!existing || existing.rewardTierId !== id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.rewardTierItem.delete({ where: { id: itemId } });

    await createAuditLog({
      userId: session.userId,
      action: "delete",
      resource: "reward_tiers",
      resourceId: itemId,
      oldValues: existing as unknown as Record<string, unknown>,
    });

    revalidatePath("/vi/services");
    revalidatePath("/en/services");

    return ok({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
