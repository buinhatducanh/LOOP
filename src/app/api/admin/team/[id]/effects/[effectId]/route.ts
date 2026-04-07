import { ok, handleError, notFound, badRequest } from "@/lib/api/response";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import { createAuditLog } from "@/lib/auth/audit";

interface UpsertPayload {
  visible?: boolean;
  selectedByMember?: boolean;
  priority?: number;
}

/**
 * PUT /api/admin/team/[id]/effects/[effectId]
 * Upsert one member effect override.
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; effectId: string }> },
) {
  try {
    const session = await requirePermission("effects", "update");
    const { id, effectId } = await params;

    const payload = (await req.json()) as UpsertPayload;

    if (
      payload.visible !== undefined && typeof payload.visible !== "boolean"
    ) {
      return badRequest("visible must be boolean");
    }

    if (
      payload.selectedByMember !== undefined &&
      typeof payload.selectedByMember !== "boolean"
    ) {
      return badRequest("selectedByMember must be boolean");
    }

    if (
      payload.priority !== undefined &&
      (!Number.isInteger(payload.priority) || payload.priority < 0)
    ) {
      return badRequest("priority must be a non-negative integer");
    }

    const [member, effect] = await Promise.all([
      prisma.teamMember.findUnique({ where: { id }, select: { id: true, name: true } }),
      prisma.rankEffect.findUnique({ where: { id: effectId }, select: { id: true, name: true } }),
    ]);

    if (!member) {
      return notFound("member not found");
    }

    if (!effect) {
      return notFound("effect not found");
    }

    const existing = await prisma.memberEffectOverride.findUnique({
      where: { memberId_effectId: { memberId: id, effectId } },
    });

    const override = await prisma.memberEffectOverride.upsert({
      where: { memberId_effectId: { memberId: id, effectId } },
      update: {
        ...(payload.visible !== undefined && { visible: payload.visible }),
        ...(payload.selectedByMember !== undefined && { selectedByMember: payload.selectedByMember }),
        ...(payload.priority !== undefined && { priority: payload.priority }),
      },
      create: {
        memberId: id,
        effectId,
        visible: payload.visible ?? true,
        selectedByMember: payload.selectedByMember ?? true,
        priority: payload.priority ?? 0,
      },
      include: {
        effect: {
          select: {
            id: true,
            name: true,
            type: true,
            rarity: true,
            minRank: true,
            minLevel: true,
            isEnabled: true,
          },
        },
      },
    });

    await createAuditLog({
      userId: session.userId,
      action: existing ? "update" : "create",
      resource: "member_effect_overrides",
      resourceId: override.id,
      oldValues: existing as unknown as Record<string, unknown> | undefined,
      newValues: payload as unknown as Record<string, unknown>,
    });

    return ok(override);
  } catch (error) {
    return handleError(error);
  }
}

/**
 * DELETE /api/admin/team/[id]/effects/[effectId]
 * Remove one member override (falls back to default behavior).
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; effectId: string }> },
) {
  try {
    const session = await requirePermission("effects", "delete");
    const { id, effectId } = await params;

    const existing = await prisma.memberEffectOverride.findUnique({
      where: { memberId_effectId: { memberId: id, effectId } },
    });

    if (!existing) {
      return notFound("member effect override not found");
    }

    await prisma.memberEffectOverride.delete({
      where: { memberId_effectId: { memberId: id, effectId } },
    });

    await createAuditLog({
      userId: session.userId,
      action: "delete",
      resource: "member_effect_overrides",
      resourceId: existing.id,
      oldValues: existing as unknown as Record<string, unknown>,
    });

    return ok({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
