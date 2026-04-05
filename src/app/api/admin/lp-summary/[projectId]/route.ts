import { handleError } from "@/lib/api/response";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";

// GET /api/admin/lp-summary/[projectId]
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> },
) {
  try {
    await requirePermission("lp-redemptions", "read");
    const { projectId } = await params;

    // 1. Get project members with their member info
    const projectMembers = await prisma.projectMember.findMany({
      where: { projectId },
      include: {
        member: { select: { id: true, name: true, role: true } },
      },
    });

    // 2. Get all LP awards for this project
    const awards = await prisma.lpAward.findMany({
      where: { projectId },
    });

    // 3. Get all tasks for this project
    const tasks = await prisma.task.findMany({
      where: { backlog: { projectId } },
      select: {
        id: true, status: true, lp: true, priority: true,
        violated: true, assigneeId: true,
      },
    });

    // 4. Calculate per-member LP stats
    const memberStats: Record<string, { approved: number; pending: number; rejected: number }> = {};
    for (const award of awards) {
      if (!memberStats[award.memberId]) memberStats[award.memberId] = { approved: 0, pending: 0, rejected: 0 };
      if (award.status === "approved") memberStats[award.memberId].approved += award.lpAmount;
      if (award.status === "pending") memberStats[award.memberId].pending += award.lpAmount;
      if (award.status === "rejected") memberStats[award.memberId].rejected += award.lpAmount;
    }

    // 5. Task stats
    const taskStats = {
      total: tasks.length,
      backlog: tasks.filter(t => t.status === "backlog").length,
      inProgress: tasks.filter(t => t.status === "in_progress").length,
      inReview: tasks.filter(t => t.status === "in_review").length,
      done: tasks.filter(t => t.status === "done").length,
      violated: tasks.filter(t => t.violated).length,
      totalLpAllocated: tasks.reduce((s, t) => s + t.lp, 0),
      totalLpEarned: awards.filter(a => a.status === "approved").reduce((s, a) => s + a.lpAmount, 0),
    };

    // 6. Recent awards
    const recentAwards = await prisma.lpAward.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    const membersWithStats = projectMembers.map(pm => ({
      id: pm.member.id,
      name: pm.member.name,
      role: pm.member.role,
      assignedLp: pm.assignedLp,
      earnedLp: memberStats[pm.member.id]?.approved ?? 0,
      earnedExp: pm.exp,
    }));

    return NextResponse.json({
      data: {
        projectId,
        members: membersWithStats,
        memberStats,
        taskStats,
        recentAwards,
        totalLpAwarded: awards.filter(a => a.status === "approved").reduce((s, a) => s + a.lpAmount, 0),
        totalLpPending: awards.filter(a => a.status === "pending").reduce((s, a) => s + a.lpAmount, 0),
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
