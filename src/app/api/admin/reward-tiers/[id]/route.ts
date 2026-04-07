import { handleError } from "@/lib/api/response";
import { NextRequest } from "next/server";
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

    const tier = await prisma.rewardTier.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            addonService: true,
          },
        },
      },
    });

    if (!tier) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ data: tier });
  } catch (error) {
    return handleError(error);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const _session = await requirePermission("services", "update");
    const { id } = await params;
    const data = await req.json();

    const existing = await prisma.rewardTier.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const tier = await prisma.rewardTier.update({
      where: { id },
      data: {
        level: Number(data.level),
        name: data.name,
        nameVi: data.nameVi,
        description: data.description ?? null,
        minXp: Number(data.minXp) || 0,
        isActive: data.isActive ?? true,
      },
    });

    await createAuditLog({
      userId: session.userId,
      action: "update",
      resource: "reward_tiers",
      resourceId: id,
      oldValues: existing as unknown as Record<string, unknown>,
      newValues: data,
    });

    revalidatePath("/vi/services");
    revalidatePath("/en/services");

    return NextResponse.json({ data: tier });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const _session = await requirePermission("services", "delete");
    const { id } = await params;

    const existing = await prisma.rewardTier.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.rewardTierItem.deleteMany({ where: { rewardTierId: id } });
    await prisma.rewardTier.delete({ where: { id } });

    await createAuditLog({
      userId: session.userId,
      action: "delete",
      resource: "reward_tiers",
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
