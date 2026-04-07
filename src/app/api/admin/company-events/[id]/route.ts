import { handleError } from "@/lib/api/response";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const _session = await requirePermission("quests", "read");
    const { id } = await params;
    const event = await prisma.companyEvent.findUnique({
      where: { id },
      include: { _count: { select: { participants: true } } },
    });
    if (!event) return ok({ error: "not found" }, 404);
    return ok({ ...event, participantCount: event._count?.participants ?? 0 });
  } catch (error) {
    return handleError(error);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const _session = await requirePermission("quests", "update");
    const { id } = await params;
    const data = await req.json();
    const existing = await prisma.companyEvent.findUnique({ where: { id } });
    if (!existing) return ok({ error: "not found" }, 404);

    const updated = await prisma.companyEvent.update({
      where: { id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.type !== undefined && { type: data.type }),
        ...(data.startDate !== undefined && { startDate: new Date(data.startDate) }),
        ...(data.endDate !== undefined && { endDate: new Date(data.endDate) }),
        ...(data.lpBonus !== undefined && { lpBonus: parseInt(data.lpBonus) }),
        ...(data.color !== undefined && { color: data.color }),
        ...(data.icon !== undefined && { icon: data.icon }),
        ...(data.bannerUrl !== undefined && { bannerUrl: data.bannerUrl ?? null }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });
    return ok(updated);
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const _session = await requirePermission("quests", "delete");
    const { id } = await params;
    await prisma.companyEvent.delete({ where: { id } });
    return ok({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
