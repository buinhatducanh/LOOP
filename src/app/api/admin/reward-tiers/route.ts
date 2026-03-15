import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import { createAuditLog } from "@/lib/auth/audit";
import { revalidatePath } from "next/cache";

export async function GET(req: NextRequest) {
  try {
    await requirePermission("services", "read");

    const data = await prisma.rewardTier.findMany({
      orderBy: { level: "asc" },
      include: {
        items: {
          include: {
            addonService: true,
          },
        },
      },
    });

    return NextResponse.json({ data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requirePermission("services", "create");
    const data = await req.json();

    const existing = await prisma.rewardTier.findUnique({
      where: { level: Number(data.level) },
    });
    if (existing) {
      return NextResponse.json(
        { error: "A reward tier with this level already exists" },
        { status: 409 }
      );
    }

    const tier = await prisma.rewardTier.create({
      data: {
        level: Number(data.level),
        name: data.name,
        nameVi: data.nameVi,
        description: data.description || null,
        minXp: Number(data.minXp) || 0,
        isActive: data.isActive ?? true,
      },
    });

    await createAuditLog({
      userId: session.userId,
      action: "create",
      resource: "reward_tiers",
      resourceId: tier.id,
      newValues: data,
    });

    revalidatePath("/vi/services");
    revalidatePath("/en/services");

    return NextResponse.json({ data: tier }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
