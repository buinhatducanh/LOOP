import { handleError } from "@/lib/api/response";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";

export async function GET(_req: NextRequest) {
  try {
    await requirePermission("projects", "read");

    const { searchParams } = new URL(req.url);
    const period = parseInt(searchParams.get("period") ?? "30");
    const since = new Date(Date.now() - period * 24 * 60 * 60 * 1000);

    // Daily LP awarded trend
    const lpTrend = await prisma.$queryRaw<{ day: Date; total: bigint }[]>`
      SELECT DATE(approved_at) as day, SUM(lp_amount) as total
      FROM lp_awards
      WHERE status = 'approved' AND approved_at >= ${since}
      GROUP BY DATE(approved_at)
      ORDER BY day ASC
    `;

    // Daily violations trend
    const violationTrend = await prisma.$queryRaw<{ day: Date; total: bigint }[]>`
      SELECT DATE(created_at) as day, COUNT(*) as total
      FROM task_violations
      WHERE created_at >= ${since}
      GROUP BY DATE(created_at)
      ORDER BY day ASC
    `;

    const [
      totalProjects,
      activeProjects,
      totalTasks,
      completedTasks,
      violatedTasks,
      totalLpAwarded,
      pendingAwards,
      recentViolations,
      topMembers,
      projectHealth,
    ] = await Promise.all([
      prisma.order.count({ where: { isActiveProject: true } }),
      prisma.order.count({ where: { isActiveProject: true, projectStatus: "active" } }),

      prisma.task.count({ where: { completedAt: { gte: since } } }),
      prisma.task.count({ where: { status: "done", completedAt: { gte: since } } }),
      prisma.task.count({ where: { violated: true, completedAt: { gte: since } } }),

      prisma.lpAward.aggregate({
        where: { status: "approved", approvedAt: { gte: since } },
        _sum: { lpAmount: true },
        _count: true,
      }),
      prisma.lpAward.aggregate({
        where: { status: "pending" },
        _sum: { lpAmount: true },
        _count: true,
      }),

      prisma.taskViolation.findMany({
        where: { createdAt: { gte: since } },
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          task: { select: { id: true, title: true } },
        },
      }),

      prisma.lpAward.groupBy({
        by: ["memberId"],
        where: { status: "approved", approvedAt: { gte: since } },
        _sum: { lpAmount: true },
        orderBy: { _sum: { lpAmount: "desc" } },
        take: 10,
      }),

      prisma.order.findMany({
        where: { isActiveProject: true },
        select: {
          id: true, orderNumber: true, customerName: true,
          _count: { select: { projectMembers: true } },
          backlogs: {
            select: {
              tasks: {
                select: { status: true, violated: true, slaDeadline: true },
              },
            },
          },
        },
      }),
    ]);

    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const violationRate = totalTasks > 0 ? Math.round((violatedTasks / totalTasks) * 100) : 0;

    const projectsWithHealth = projectHealth.map(p => {
      const allTasks = p.backlogs.flatMap(b => b.tasks);
      const total = allTasks.length;
      const done = allTasks.filter(t => t.status === "done").length;
      const violated = allTasks.filter(t => t.violated).length;
      const overdue = allTasks.filter(t =>
        t.slaDeadline && new Date(t.slaDeadline) < new Date() && t.status !== "done"
      ).length;
      const compRate = total > 0 ? Math.round((done / total) * 100) : 0;
      const score = Math.max(0, Math.min(100, compRate - (violated * 10) - (overdue * 5)));
      const status = score >= 70 ? "green" : score >= 40 ? "amber" : "red";
      return {
        id: p.id,
        orderNumber: p.orderNumber,
        customerName: p.customerName,
        memberCount: p._count.projectMembers,
        totalTasks: total,
        doneTasks: done,
        violatedTasks: violated,
        overdueTasks: overdue,
        completionRate: compRate,
        healthScore: score,
        healthStatus: status,
      };
    });

    const memberIds = topMembers.map(m => m.memberId);
    const members = await prisma.teamMember.findMany({
      where: { id: { in: memberIds } },
      select: { id: true, name: true, email: true },
    });
    const topMembersWithNames = topMembers.map(m => ({
      memberId: m.memberId,
      name: members.find(mem => mem.id === m.memberId)?.name ?? "Unknown",
      totalLp: m._sum?.lpAmount ?? 0,
    }));

    return NextResponse.json({
      data: {
        period: `${period} days`,
        summary: {
          totalProjects,
          activeProjects,
          totalTasks,
          completedTasks,
          violatedTasks,
          completionRate,
          violationRate,
          totalLpAwarded: totalLpAwarded._sum?.lpAmount ?? 0,
          totalLpPending: pendingAwards._sum?.lpAmount ?? 0,
          approvedCount: totalLpAwarded._count,
          pendingCount: pendingAwards._count,
        },
        recentViolations,
        topMembers: topMembersWithNames,
        projectHealth: projectsWithHealth,
        lpTrend: lpTrend.map(d => ({ day: d.day, total: Number(d.total) })),
        violationTrend: violationTrend.map(d => ({ day: d.day, total: Number(d.total) })),
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
