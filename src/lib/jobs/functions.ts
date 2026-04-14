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
  sendDemoReadyEmail,
  sendStandupReminder,
  sendSlaViolationAlert,
  sendSlaWarning,
  sendLpMonthlyReport,
} from "@/lib/email/sender";
import type {
  ContactSubmittedPayload,
  OrderCreatedPayload,
  DemoReadyPayload,
} from "./client";

// ─── Event Types ─────────────────────────────────────────────────────────────
// (Re-exported from client.ts for convenience)
export { EVENTS };
export type { ContactSubmittedPayload, OrderCreatedPayload, DemoReadyPayload };

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

// ─── Demo Ready Email ─────────────────────────────────────────────────────────
export const demoReadyJob = inngest.createFunction(
  {
    id: "demo-ready-job",
    name: "Demo Ready",
    triggers: [{ event: EVENTS.DEMO_READY }],
  },
  async ({ event }) => {
    const payload = event.data as DemoReadyPayload;

    // Only send email if customer has an email
    if (payload.customerEmail) {
      await sendDemoReadyEmail({
        customerName: payload.customerName,
        customerEmail: payload.customerEmail,
        orderNumber: payload.orderNumber,
        maskedUrl: payload.maskedUrl,
      });
    }

    return { sent: !!payload.customerEmail, demoId: payload.demoId };
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
      // P0-5 FIX: wrap task update + violation record in a transaction.
      // Previously sequential writes — if crash after task.update but before
      // taskViolation.create, task is marked violated with no audit trail.
      await prisma.$transaction(async (tx) => {
        await tx.task.update({
          where: { id: task.id },
          data: { violated: true },
        });

        await tx.taskViolation.create({
          data: {
            taskId: task.id,
            type: "deadline_missed",
            note: `SLA deadline passed: ${task.slaDeadline?.toISOString()}`,
          },
        });
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
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.loops.vn";

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
          // Abort after 10s — compatible with Node.js 18+ (AbortSignal.timeout is Node 20+)
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 10_000);
          await fetch(url, {
            headers: { "User-Agent": "LOOP-CacheWarmer/1.0" },
            signal: controller.signal as AbortSignal,
          }).finally(() => clearTimeout(timeout));
        } catch (err) {
          console.warn(`[CacheWarmer] Failed to warm: ${url}`, err);
        }
      }
    });

    return { warmed: urls.length, timestamp: new Date().toISOString() };
  }
);

// ═══════════════════════════════════════════════════════════════════════════
// CATEGORY 3: QUEST / EVENT CRON JOBS
// ═══════════════════════════════════════════════════════════════════════════

// ─── Quest Frequency Reset ────────────────────────────────────────────────
// Cron: daily at midnight — resets quest progress based on frequency
export const questFrequencyReset = inngest.createFunction(
  {
    id: "quest-frequency-reset",
    name: "Quest Frequency Reset",
    triggers: [{ cron: "0 0 * * *" }],
  },
  async ({ step }) => {
    const today = new Date();
    const isMonday = today.getDay() === 1;
    const isFirstOfMonth = today.getDate() === 1;

    // Daily: reset daily quests (progress → 0, completed → false)
    const dailyResult = await step.run("reset-daily-quests", async () => {
      const { prisma } = await import("@/lib/prisma");
      const result = await prisma.questParticipant.updateMany({
        where: {
          quest: { frequency: "daily" },
          completed: false,
        },
        data: { progress: 0 },
      });
      return result.count;
    });

    // Weekly (Monday): reset weekly quests
    const weeklyResult = isMonday
      ? await step.run("reset-weekly-quests", async () => {
          const { prisma } = await import("@/lib/prisma");
          const result = await prisma.questParticipant.updateMany({
            where: { quest: { frequency: "weekly" } },
            data: { progress: 0, completed: false },
          });
          return result.count;
        })
      : 0;

    // Monthly (1st): reset monthly quests
    const monthlyResult = isFirstOfMonth
      ? await step.run("reset-monthly-quests", async () => {
          const { prisma } = await import("@/lib/prisma");
          const result = await prisma.questParticipant.updateMany({
            where: { quest: { frequency: "monthly" } },
            data: { progress: 0, completed: false },
          });
          return result.count;
        })
      : 0;

    return {
      daily: dailyResult,
      weekly: weeklyResult,
      monthly: monthlyResult,
      isMonday,
      isFirstOfMonth,
    };
  }
);

// ─── Event LP Bonus Auto-Award ───────────────────────────────────────────
// Cron: daily at 01:00 — awards lpBonus to participants of ended events
export const eventLpBonusAward = inngest.createFunction(
  {
    id: "event-lp-bonus-award",
    name: "Event LP Bonus Award",
    triggers: [{ cron: "0 1 * * *" }],
  },
  async ({ step }) => {
    // Find events that ended yesterday (endDate <= yesterday AND isActive=true)
    const endedEvents = await step.run("find-ended-events", async () => {
      const { prisma } = await import("@/lib/prisma");
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(23, 59, 59, 999);

      return prisma.companyEvent.findMany({
        where: {
          endDate: { lte: yesterday },
          isActive: true,
        },
        select: { id: true, title: true, lpBonus: true },
      });
    });

    let totalAwarded = 0;

    for (const event of endedEvents) {
      const awarded = await step.run(`award-event-bonus-${event.id}`, async () => {
        if (!event.lpBonus || event.lpBonus <= 0) return 0;

        const { prisma } = await import("@/lib/prisma");

        // Get all participants who completed all quests for this event
        const participants = await prisma.questParticipant.findMany({
          where: { eventId: event.id, completed: true },
          select: { userId: true },
        });

        let awardedCount = 0;

        for (const p of participants) {
          // Find member by userId (read — stays outside tx for isolation)
          const member = await prisma.teamMember.findFirst({
            where: { user: { id: p.userId } },
            select: { id: true },
          });
          if (!member) continue;

          // ⚠️ FIX: wrap lpAward.create + teamMember.update in a transaction
          // to prevent phantom awards (award recorded but LP not credited).
          await prisma.$transaction(async (tx) => {
            await tx.lpAward.create({
              data: {
                memberId: member.id,
                projectId: event.id, // LpAward.projectId stores event id as reference
                lpAmount: event.lpBonus,
                expAmount: 0,
                source: "event_bonus",
                status: "approved", // auto-approved since it's a bonus
              },
            });

            await tx.teamMember.update({
              where: { id: member.id },
              data: { availableLp: { increment: event.lpBonus } },
            });
          });

          awardedCount++;
        }

        // Deactivate the event
        await prisma.companyEvent.update({
          where: { id: event.id },
          data: { isActive: false },
        });

        return awardedCount;
      });

      totalAwarded += awarded;
    }

    return { eventsProcessed: endedEvents.length, totalAwarded };
  }
);

// ─── Domain & Hosting Expiry Notification ─────────────────────────────────
// Cron: every day at 09:00 — alerts admins about expiring domain/hosting
export const domainHostingExpiryNotification = inngest.createFunction(
 {
 id: "domain-hosting-expiry-notification",
 name: "Domain & Hosting Expiry Notification",
 rateLimit: { limit: 1, period: "1m" },
 triggers: [{ cron: "0 9 * * *" }],
 },
 async () => {
 const now = new Date();

 // 30-day warning window
 const warningDate = new Date(now);
 warningDate.setDate(warningDate.getDate() + 30);

 // 7-day urgent window
 const urgentDate = new Date(now);
 urgentDate.setDate(urgentDate.getDate() + 7);

 // 1-day critical window
 const criticalDate = new Date(now);
 criticalDate.setDate(criticalDate.getDate() + 1);

 // 1-day overdue window (expired but within 1 day)
 const overdueEnd = new Date(now);
 overdueEnd.setDate(overdueEnd.getDate() + 1);

 // Find websites with domain expiring in 30 days or less
 const domainExpiring = await prisma.customerWebsite.findMany({
 where: {
 domain: { not: null },
 domainExpiresAt: {
 lte: warningDate,
 gte: now,
 },
 autoRenewDomain: false,
 },
 select: {
 id: true,
 domain: true,
 customerName: true,
 customerEmail: true,
 domainExpiresAt: true,
 },
 });

 // Find websites with hosting expiring in 30 days or less
 const hostingExpiring = await prisma.customerWebsite.findMany({
 where: {
 hostingPlanId: { not: null },
 hostingExpiresAt: {
 lte: warningDate,
 gte: now,
 },
 autoRenewHosting: false,
 },
 select: {
 id: true,
 domain: true,
 customerName: true,
 customerEmail: true,
 hostingExpiresAt: true,
 },
 });

 let notifiedCount = 0;

 const classifyPriority = (expiresAt: Date) => {
 if (expiresAt <= criticalDate) return "urgent";
 if (expiresAt <= urgentDate) return "high";
 return "normal";
 };

 const todayStart = new Date(now);
 todayStart.setHours(0, 0, 0, 0);

 // Domain expiry notifications
 for (const site of domainExpiring) {
 if (!site.domainExpiresAt) continue;
 const expiresAt = site.domainExpiresAt;
 const priority = classifyPriority(expiresAt);
 const daysLeft = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

 const alreadyNotified = await prisma.adminNotification.findFirst({
 where: { type: "domain_expiry", link: `/admin/web_packages?website=${site.id}`, createdAt: { gte: todayStart } },
 });

 if (alreadyNotified) continue;

 await prisma.adminNotification.create({
 data: {
 type: "domain_expiry",
 title: `Domain "${site.domain}" sắp hết hạn (${daysLeft} ngày)`,
 message: `${site.customerName ?? site.customerEmail} — domain hết hạn ngày ${expiresAt.toLocaleDateString("vi-VN")}. Auto-renew: OFF.`,
 link: `/admin/web_packages?website=${site.id}`,
 priority,
 isRead: false,
 },
 });
 notifiedCount++;
 }

 // Hosting expiry notifications
 for (const site of hostingExpiring) {
 if (!site.hostingExpiresAt) continue;
 const expiresAt = site.hostingExpiresAt;
 const priority = classifyPriority(expiresAt);
 const daysLeft = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

 const alreadyNotified = await prisma.adminNotification.findFirst({
 where: { type: "hosting_expiry", link: `/admin/web_packages?website=${site.id}`, createdAt: { gte: todayStart } },
 });

 if (alreadyNotified) continue;

 await prisma.adminNotification.create({
 data: {
 type: "hosting_expiry",
 title: `Hosting "${site.domain}" sắp hết hạn (${daysLeft} ngày)`,
 message: `${site.customerName ?? site.customerEmail} — hosting hết hạn ngày ${expiresAt.toLocaleDateString("vi-VN")}. Auto-renew: OFF.`,
 link: `/admin/web_packages?website=${site.id}`,
 priority,
 isRead: false,
 },
 });
 notifiedCount++;
 }

 return { domainExpiring: domainExpiring.length, hostingExpiring: hostingExpiring.length, notifiedCount };
 }
);

// ─── All Functions (export for Next.js handler) ────────────────────────────
// Register all jobs here — src/app/api/inngest/route.ts imports this array.
export const allJobs = [
  // Event-driven
  contactConfirmationJob,
  orderConfirmationJob,
  demoReadyJob,
  // Cron-scheduled
  dailyStandupReminder,
  slaViolationCheck,
  slaWarningNotification,
  lpMonthlyReport,
  pruneOldAuditLogs,
  warmCache,
  // Quest/Event
  questFrequencyReset,
  eventLpBonusAward,
 // Web Package
 domainHostingExpiryNotification,
];
