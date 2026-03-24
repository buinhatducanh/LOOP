import { inngest } from "./client";
import { prisma } from "@/lib/prisma";
import {
  sendStandupReminder,
  sendSlaViolationAlert,
  sendSlaWarning,
  sendLpMonthlyReport,
} from "@/lib/email/sender";

// ─── Daily Standup Reminder ────────────────────────────────────────────────────
// Cron: 08:30 mỗi ngày thứ 2–6
export const dailyStandupReminder = inngest.createFunction(
  { id: "daily-standup-reminder", name: "Daily Standup Reminder", triggers: [{ cron: "0 8 * * 1-5" }] },
  async () => {
    const activeProjects = await prisma.order.findMany({
      where: { projectStatus: "active", isActiveProject: true },
      select: { id: true, orderNumber: true, customerName: true },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let sentCount = 0;

    for (const project of activeProjects) {
      const projectMembers = await prisma.projectMember.findMany({
        where: { projectId: project.id },
        include: { member: { select: { id: true, name: true, email: true } } },
      });

      for (const pm of projectMembers) {
        if (!pm.member?.email) continue;

        const existing = await prisma.dailyStandup.findUnique({
          where: {
            projectId_memberId_date: {
              projectId: project.id,
              memberId: pm.memberId,
              date: today,
            },
          },
        });

        if (!existing) {
          await sendStandupReminder({
            memberName: pm.member.name,
            memberEmail: pm.member.email,
            projectName: project.customerName,
            projectOrderNumber: project.orderNumber,
            standupDate: today,
          });
          sentCount++;
        }
      }
    }

    return { projects: activeProjects.length, remindersSent: sentCount };
  }
);

// ─── SLA Violation Check ──────────────────────────────────────────────────────
// Cron: mỗi giờ
export const slaViolationCheck = inngest.createFunction(
  { id: "sla-violation-check", name: "SLA Violation Check", triggers: [{ cron: "0 * * * *" }] },
  async () => {
    const now = new Date();

    const violatedTasks = await prisma.task.findMany({
      where: {
        violated: false,
        status: { in: ["in_progress", "in_review"] },
        slaDeadline: { not: null, lt: now },
      },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        backlog: {
          include: {
            project: { select: { id: true, orderNumber: true } },
          },
        },
      },
    });

    for (const task of violatedTasks) {
      await prisma.task.update({
        where: { id: task.id },
        data: { violated: true },
      });

      await prisma.taskViolation.create({
        data: {
          taskId: task.id,
          type: "deadline_missed",
          note: `SLA deadline passed: ${task.slaDeadline?.toISOString()}`,
        },
      });

      // Send violation alert email
      const assigneeData = task.assignee;
      if (assigneeData?.email) {
        await sendSlaViolationAlert({
          taskTitle: task.title,
          taskId: task.id,
          projectOrderNumber: task.backlog.project.orderNumber,
          deadline: task.slaDeadline!,
          assignees: [{ name: assigneeData.name, email: assigneeData.email }],
        });
      }
    }

    return { violatedCount: violatedTasks.length };
  }
);

// ─── SLA Warning Notification ──────────────────────────────────────────────────
// Cron: mỗi giờ — warn 24h before deadline
export const slaWarningNotification = inngest.createFunction(
  { id: "sla-warning-notification", name: "SLA Warning", triggers: [{ cron: "0 * * * *" }] },
  async () => {
    const warnBefore = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const tasks = await prisma.task.findMany({
      where: {
        violated: false,
        status: { in: ["in_progress", "in_review"] },
        slaDeadline: { not: null, gt: new Date(), lte: warnBefore },
      },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        backlog: {
          include: {
            project: { select: { id: true, orderNumber: true } },
          },
        },
      },
    });

    for (const task of tasks) {
      const assignee = task.assignee;
      if (!assignee?.email) continue;

      const hoursLeft = Math.round(
        (new Date(task.slaDeadline!).getTime() - Date.now()) / (1000 * 60 * 60)
      );

      await sendSlaWarning({
        taskTitle: task.title,
        taskId: task.id,
        projectOrderNumber: task.backlog.project.orderNumber,
        deadline: task.slaDeadline!,
        hoursRemaining: hoursLeft,
        assigneeName: assignee.name,
        assigneeEmail: assignee.email,
      });
    }

    return { warningCount: tasks.length };
  }
);

// ─── LP Monthly Report ────────────────────────────────────────────────────────
// Cron: ngày 1 mỗi tháng, 08:00
export const lpMonthlyReport = inngest.createFunction(
  { id: "lp-monthly-report", name: "LP Monthly Report", triggers: [{ cron: "0 8 1 * *" }] },
  async () => {
    const startOfMonth = new Date();
    startOfMonth.setDate(1); startOfMonth.setHours(0, 0, 0, 0);

    const [awards, tasks] = await Promise.all([
      prisma.lpAward.findMany({
        where: { createdAt: { gte: startOfMonth }, status: "approved" },
        include: {
          project: { select: { orderNumber: true, customerName: true } },
        },
      }),
      prisma.task.findMany({
        where: { completedAt: { gte: startOfMonth } },
        select: { id: true, status: true, violated: true },
      }),
    ]);

    const totalLp = awards.reduce((s, a) => s + a.lpAmount, 0);
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === "done").length;
    const violatedTasks = tasks.filter(t => t.violated).length;

    const period = new Intl.DateTimeFormat("vi-VN", { month: "long", year: "numeric" }).format(startOfMonth);

    // Send to admin email from env or settings
    const adminEmail = process.env.ADMIN_EMAIL ?? "alerts@loop.vn";
    await sendLpMonthlyReport({
      totalLp,
      completedTasks,
      violatedTasks,
      completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      violationRate: totalTasks > 0 ? Math.round((violatedTasks / totalTasks) * 100) : 0,
      period,
    }, adminEmail);

    return { totalLp, completedTasks, violatedTasks, period };
  }
);

// Export all PM functions for the Inngest route handler
export const pmFunctions = [
  dailyStandupReminder,
  slaViolationCheck,
  slaWarningNotification,
  lpMonthlyReport,
];
