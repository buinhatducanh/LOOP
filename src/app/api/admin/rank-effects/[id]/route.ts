import { handleError } from "@/lib/api/response";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const _session = await requirePermission("effects", "read");
    const { id } = await params;
    const effect = await prisma.rankEffect.findUnique({ where: { id } });
    if (!effect) return ok({ error: "not found" }, 404);
    return ok(effect);
  } catch (error) {
    return handleError(error);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const _session = await requirePermission("effects", "update");
    const { id } = await params;
    const data = await req.json();
    const existing = await prisma.rankEffect.findUnique({ where: { id } });
    if (!existing) return ok({ error: "not found" }, 404);

    const updated = await prisma.rankEffect.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.type !== undefined && { type: data.type }),
        ...(data.rarity !== undefined && { rarity: data.rarity }),
        ...(data.icon !== undefined && { icon: data.icon }),
        ...(data.color !== undefined && { color: data.color }),
        ...(data.minRank !== undefined && { minRank: data.minRank }),
        ...(data.minLevel !== undefined && { minLevel: parseInt(data.minLevel) }),
        ...(data.maxLevel !== undefined && { maxLevel: data.maxLevel ? parseInt(data.maxLevel) : null }),
        ...(data.isEnabled !== undefined && { isEnabled: data.isEnabled }),
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
    const _session = await requirePermission("effects", "delete");
    const { id } = await params;
    await prisma.rankEffect.delete({ where: { id } });
    return ok({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
