import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";

export async function GET(req: NextRequest) {
  try {
    await requirePermission("projects", "read");

    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get("days") ?? "30");
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const members = await prisma.teamMember.findMany();

    // LP awards by member (approved in period)
    const lpAwards = await prisma.lpAward.findMany({
      where: { status: "approved", approvedAt: { gte: since } },
      select: { memberId: true, lpAmount: true, expAmount: true },
    });

    // Tasks completed in period
    const tasks = await prisma.task.findMany({
      where: {
        assigneeId: { not: null },
        completedAt: { gte: since },
      },
      select: {
        assigneeId: true,
        status: true,
        violated: true,
      },
    });

    // Violations in period
    const violations = await prisma.taskViolation.findMany({
      where: { createdAt: { gte: since } },
      select: { id: true },
    });

    // Project members with project info
    const projectMembers = await prisma.projectMember.findMany({
      include: {
        project: { select: { id: true, orderNumber: true, customerName: true } },
      },
    });

    const performance = members.map(member => {
      const memberAwards = lpAwards.filter(a => a.memberId === member.id);
      const memberTasks = tasks.filter(t => t.assigneeId === member.id);
      const memberViolations = violations.length;

      const totalLp = memberAwards.reduce((s, a) => s + a.lpAmount, 0);
      const totalExp = memberAwards.reduce((s, a) => s + a.expAmount, 0);
      const doneTasks = memberTasks.filter(t => t.status === "done");
      const completedCount = doneTasks.length;
      const violatedCount = memberTasks.filter(t => t.violated).length;

      const score = Math.max(0, Math.round(
        (totalLp * 2) + (completedCount * 10) - (violatedCount * 20) - (memberViolations * 5)
      ));

      const memberProjectMembers = projectMembers.filter(pm => pm.memberId === member.id);

      return {
        id: member.id,
        name: member.name,
        email: member.email,
        role: member.role,
        projects: memberProjectMembers.map(pm => ({
          projectId: pm.projectId,
          orderNumber: pm.project.orderNumber,
          customerName: pm.project.customerName,
          assignedLp: pm.assignedLp,
          earnedLp: pm.earnedLp,
        })),
        periodLp: totalLp,
        periodExp: totalExp,
        completedTasks: completedCount,
        violatedTasks: violatedCount,
        violationCount: memberViolations,
        performanceScore: score,
        status: score >= 80 ? "excellent" : score >= 50 ? "good" : "needs_improvement",
      };
    });

    return NextResponse.json({ data: performance });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
