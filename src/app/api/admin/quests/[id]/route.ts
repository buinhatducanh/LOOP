import { handleError, ok } from "@/lib/api/response";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requirePermission("quests", "read");
    const { id } = await params;
    const quest = await prisma.quest.findUnique({
      where: { id },
      include: { _count: { select: { participants: true } } },
    });
    if (!quest) return ok({ error: "not found" }, 404);
    return ok({ ...quest, participantCount: quest._count?.participants ?? 0 });
  } catch (error) {
    return handleError(error);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requirePermission("quests", "update");
    const { id } = await params;
    const data = await req.json();
    const existing = await prisma.quest.findUnique({ where: { id } });
    if (!existing) return ok({ error: "not found" }, 404);

    const updated = await prisma.quest.update({
      where: { id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.lpReward !== undefined && { lpReward: parseInt(data.lpReward) }),
        ...(data.xpReward !== undefined && { xpReward: parseInt(data.xpReward) }),
        ...(data.frequency !== undefined && { frequency: data.frequency }),
        ...(data.category !== undefined && { category: data.category }),
        ...(data.icon !== undefined && { icon: data.icon }),
        ...(data.color !== undefined && { color: data.color }),
        ...(data.target !== undefined && { target: parseInt(data.target) }),
        ...(data.forRoles !== undefined && { forRoles: data.forRoles }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.sortOrder !== undefined && { sortOrder: parseInt(data.sortOrder) }),
      },
    });
    return ok(updated);
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requirePermission("quests", "delete");
    const { id } = await params;
    await prisma.quest.delete({ where: { id } });
    return ok({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
