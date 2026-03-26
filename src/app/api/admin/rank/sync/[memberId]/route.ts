import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import { handleError, notFound, ok } from "@/lib/api";
import { syncRankFields } from "@/lib/rank/xp";

// POST /api/admin/rank/sync/[memberId]
// syncRankFields reads LpAward + LpTransaction, computes rank, persists to TeamMember, returns fields.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ memberId: string }> }
) {
  try {
    await requirePermission("lp-awards", "update");
    const { memberId } = await params;
    const member = await prisma.teamMember.findUnique({
      where: { id: memberId },
      select: { id: true },
    });
    if (!member) {
      return notFound("Team member");
    }
    const fields = await syncRankFields(memberId);
    return ok({ memberId, ...(fields ?? {}), syncedAt: new Date().toISOString() });
  } catch (error) {
    return handleError(error);
  }
}
