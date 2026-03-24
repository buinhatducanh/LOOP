import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import { createAuditLog } from "@/lib/auth/audit";

// POST /api/admin/lp-awards/[id]/approve
// PM approves → credit LP to member, update ProjectMember
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requirePermission("lp-awards", "update");
    const { id } = await params;
    const { action } = await req.json(); // "approve" | "reject"

    const award = await prisma.lpAward.findUnique({ where: { id } });
    if (!award) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (award.status !== "pending") {
      return NextResponse.json({ error: "Award already processed" }, { status: 400 });
    }

    if (action === "reject") {
      const { reason } = await req.json();
      const updated = await prisma.lpAward.update({
        where: { id },
        data: { status: "rejected", rejectedReason: reason ?? "Rejected by PM" },
      });
      return NextResponse.json({ data: updated });
    }

    if (action !== "approve") {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    // Approve: credit LP to member
    const now = new Date();

    // Look up TeamMember.id from session.userId via User.teamMemberId
    const approverMember = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { teamMember: { select: { id: true } } },
    });

    const updated = await prisma.lpAward.update({
      where: { id },
      data: { status: "approved", approvedBy: approverMember?.teamMember?.id ?? null, approvedAt: now },
    });

    // Update ProjectMember earnedLp/exp
    const pmRecord = await prisma.projectMember.findUnique({
      where: {
        projectId_memberId: { projectId: award.projectId, memberId: award.memberId },
      },
    });

    if (pmRecord) {
      await prisma.projectMember.update({
        where: { id: pmRecord.id },
        data: {
          earnedLp: pmRecord.earnedLp + award.lpAmount,
          exp: pmRecord.exp + award.expAmount,
        },
      });
    }

    await createAuditLog({
      userId: session.userId,
      action: "approve",
      resource: "lp-awards",
      resourceId: id,
      newValues: { lpAmount: award.lpAmount, memberId: award.memberId },
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
