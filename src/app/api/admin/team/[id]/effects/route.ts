import { ok, handleError, notFound } from "@/lib/api/response";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";

/**
 * GET /api/admin/team/[id]/effects
 * Returns member effect overrides for one team member.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requirePermission("effects", "read");
    const { id } = await params;

    const member = await prisma.teamMember.findUnique({ where: { id }, select: { id: true, name: true } });
    if (!member) {
      return notFound("member not found");
    }

    const overrides = await prisma.memberEffectOverride.findMany({
      where: { memberId: id },
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
      orderBy: [{ priority: "desc" }, { updatedAt: "desc" }],
    });

    return ok({
      memberId: member.id,
      memberName: member.name,
      overrides,
    });
  } catch (error) {
    return handleError(error);
  }
}
