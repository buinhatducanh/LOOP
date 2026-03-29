/**
 * Inngest Job Functions — background tasks triggered by events and cron.
 *
 * Two categories of jobs:
 *   1. Event-driven (emails, notifications) — fire when specific events occur
 *   2. Cron-scheduled (SLA checks, standup, reports) — fire on a schedule
 *
 * All jobs run in isolated, retry-safe Inngest workers.
 * They survive Vercel cold starts and 10s serverless timeouts.
 *
 * In production, Inngest runs these in isolated, retry-safe workers
 * that survive Vercel cold starts and 10s serverless timeouts.
 *
 * Setup:
 *   All functions are registered in src/app/api/inngest/route.ts.
 *   Jobs are consolidated here (no separate PM / Inngest split).
 */

import { inngest } from "./client";
import { EVENTS } from "./client";
import { prisma } from "@/lib/prisma";
import {
  sendContactConfirmation as emailSendContact,
  sendAdminContactNotification as emailSendAdminContact,
  sendOrderConfirmation as emailSendOrder,
  sendStandupReminder,
  sendSlaViolationAlert,
  sendSlaWarning,
  sendLpMonthlyReport,
} from "@/lib/email/sender";
import type {
  ContactSubmittedPayload,
  OrderCreatedPayload,
} from "./client";

// ─── Event Types ─────────────────────────────────────────────────────────────
// (Re-exported from client.ts for convenience)
export { EVENTS };
export type { ContactSubmittedPayload, OrderCreatedPayload };

// ═══════════════════════════════════════════════════════════════════════════
// CATEGORY 1: EVENT-DRIVEN JOBS
// ═══════════════════════════════════════════════════════════════════════════

// ─── Contact Confirmation Email ────────────────────────────────────────────
export const contactConfirmationJob = inngest.createFunction(
  {
    id: "contact-confirmation-job",
    name: "Contact Confirmation",
    triggers: [{ event: EVENTS.CONTACT_SUBMITTED }],
  },
  async ({ event }) => {
    const payload = event.data as ContactSubmittedPayload;

    await Promise.all([
      emailSendContact({
        name: payload.name,
        email: payload.email,
        message: payload.message,
        phone: payload.phone,
        service: payload.service,
      }),
      emailSendAdminContact({
        name: payload.name,
        email: payload.email,
        message: payload.message,
        phone: payload.phone,
        service: payload.service,
      }),
    ]);

    return { sent: true, email: payload.email };
  }
);

// ─── Order Confirmation Email ───────────────────────────────────────────────
export const orderConfirmationJob = inngest.createFunction(
  {
    id: "order-confirmation-job",
    name: "Order Confirmation",
    triggers: [{ event: EVENTS.ORDER_CREATED }],
  },
  async ({ event }) => {
    const payload = event.data as OrderCreatedPayload;

    await emailSendOrder({
      orderNumber: payload.orderNumber,
      customerName: payload.customerName,
      customerEmail: payload.customerEmail,
      totalAmount: payload.totalAmount,
      items: payload.items,
    });

    return { sent: true, orderNumber: payload.orderNumber };
  }
);

// ═══════════════════════════════════════════════════════════════════════════
// CATEGORY 2: CRON-SCHEDULED JOBS
// ═══════════════════════════════════════════════════════════════════════════

// ─── Daily Standup Reminder ────────────────────────────────────────────────
// Cron: 08:30 every weekday (Mon–Fri)
export const dailyStandupReminder = inngest.createFunction(
  {
    id: "daily-standup-reminder",
    name: "Daily Standup Reminder",
    rateLimit: { limit: 1, period: "1m" },
    triggers: [{ cron: "0 8 * * 1-5" }],
  },
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

// ─── SLA Violation Check ───────────────────────────────────────────────────
// Cron: every hour — marks tasks past deadline and alerts assignees
export const slaViolationCheck = inngest.createFunction(
  {
    id: "sla-violation-check",
    name: "SLA Violation Check",
    triggers: [{ cron: "0 * * * *" }],
  },
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

// ─── SLA Warning Notification ───────────────────────────────────────────────
// Cron: every hour — warn 24h before deadline
export const slaWarningNotification = inngest.createFunction(
  {
    id: "sla-warning-notification",
    name: "SLA Warning",
    triggers: [{ cron: "0 * * * *" }],
  },
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

// ─── LP Monthly Report ─────────────────────────────────────────────────────
// Cron: day 1 of each month at 08:00
export const lpMonthlyReport = inngest.createFunction(
  {
    id: "lp-monthly-report",
    name: "LP Monthly Report",
    triggers: [{ cron: "0 8 1 * *" }],
  },
  async () => {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

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
    const completedTasks = tasks.filter((t) => t.status === "done").length;
    const violatedTasks = tasks.filter((t) => t.violated).length;

    const period = new Intl.DateTimeFormat("vi-VN", {
      month: "long",
      year: "numeric",
    }).format(startOfMonth);

    const adminEmail = process.env.ADMIN_EMAIL ?? "alerts@loop.vn";
    await sendLpMonthlyReport({
      totalLp,
      completedTasks,
      violatedTasks,
      completionRate:
        totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      violationRate:
        totalTasks > 0 ? Math.round((violatedTasks / totalTasks) * 100) : 0,
      period,
    }, adminEmail);

    return { totalLp, completedTasks, violatedTasks, period };
  }
);

// ─── Prune Old Audit Logs ───────────────────────────────────────────────────
// Cron: Sunday at 02:00 UTC — deletes entries older than 90 days
export const pruneOldAuditLogs = inngest.createFunction(
  {
    id: "prune-old-audit-logs",
    name: "Prune Old Audit Logs",
    rateLimit: { limit: 1, period: "1h" },
    triggers: [{ cron: "0 2 * * 0" }],
  },
  async ({ step }) => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 90);

    const deleted = await step.run("delete-old-audit-logs", async () => {
      const { prisma } = await import("@/lib/prisma");
      const result = await prisma.auditLog.deleteMany({
        where: { createdAt: { lt: cutoff } },
      });
      return result.count;
    });

    console.log(`[Inngest] Pruned ${deleted} audit log entries older than ${cutoff.toISOString()}`);

    return { deleted, cutoff: cutoff.toISOString() };
  }
);

// ─── Warm ISR Cache ────────────────────────────────────────────────────────
// Cron: daily at 06:00 + 12:00 UTC — pre-warms hot pages before peak traffic
export const warmCache = inngest.createFunction(
  {
    id: "warm-cache",
    name: "Warm ISR Cache",
    rateLimit: { limit: 1, period: "1h" },
    triggers: [{ cron: "0 6,12 * * *" }],
  },
  async ({ step }) => {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://loop.vn";

    const urls = [
      `${siteUrl}/vi`,
      `${siteUrl}/en`,
      `${siteUrl}/vi/services`,
      `${siteUrl}/en/services`,
      `${siteUrl}/vi/portfolio`,
      `${siteUrl}/vi/pricing`,
      `${siteUrl}/vi/blog`,
    ];

    await step.run("fetch-all-pages", async () => {
      for (const url of urls) {
        try {
          await fetch(url, {
            headers: { "User-Agent": "LOOP-CacheWarmer/1.0" },
            signal: AbortSignal.timeout(10_000),
          });
        } catch (err) {
          console.warn(`[CacheWarmer] Failed to warm: ${url}`, err);
        }
      }
    });

    return { warmed: urls.length, timestamp: new Date().toISOString() };
  }
);

// ─── All Functions (export for Next.js handler) ────────────────────────────
// Register all jobs here — src/app/api/inngest/route.ts imports this array.
export const allJobs = [
  // Event-driven
  contactConfirmationJob,
  orderConfirmationJob,
  // Cron-scheduled
  dailyStandupReminder,
  slaViolationCheck,
  slaWarningNotification,
  lpMonthlyReport,
  pruneOldAuditLogs,
  warmCache,
];
