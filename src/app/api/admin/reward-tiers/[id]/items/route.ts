import { handleError } from "@/lib/api/response";
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

    const items = await prisma.rewardTierItem.findMany({
      where: { rewardTierId: id },
      include: {
        addonService: true,
      },
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json({ data: items });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission("services", "create");
    const { id } = await params;
    const data = await req.json();

    const tier = await prisma.rewardTier.findUnique({ where: { id } });
    if (!tier) {
      return NextResponse.json({ error: "Reward tier not found" }, { status: 404 });
    }

    const item = await prisma.rewardTierItem.create({
      data: {
        rewardTierId: id,
        addonServiceId: data.addonServiceId,
        quantity: Number(data.quantity) || 1,
        durationMonths: Number(data.durationMonths) || null,
        description: data.description || null,
        sortOrder: Number(data.sortOrder) || 0,
      },
    });

    await createAuditLog({
      userId: session.userId,
      action: "create",
      resource: "reward_tiers",
      resourceId: item.id,
      newValues: data,
    });

    revalidatePath("/vi/services");
    revalidatePath("/en/services");

    return NextResponse.json({ data: item }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
