import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";
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
      return NextResponse.json({ error: "Team member not found" }, { status: 404 });
    }
    const fields = await syncRankFields(memberId);
    return NextResponse.json({
      data: { memberId, ...(fields ?? {}), syncedAt: new Date().toISOString() },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Server error";
    const status = msg === "Unauthorized" ? 401 : msg === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
