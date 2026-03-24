/**
 * Inngest Job Functions — background tasks triggered by events.
 *
 * Each function is self-contained: it receives its input, processes it,
 * and (optionally) dispatches emails, notifications, or cache operations.
 *
 * In production, Inngest runs these in isolated, retry-safe workers
 * that survive Vercel cold starts and 10s serverless timeouts.
 */

import { inngest, EVENTS } from "./client";
import type { ContactSubmittedPayload, OrderCreatedPayload } from "./client";
import {
  sendContactConfirmation as emailSendContact,
  sendAdminContactNotification as emailSendAdminContact,
  sendOrderConfirmation as emailSendOrder,
} from "@/lib/email/sender";

// ─── Contact Confirmation Email ─────────────────────────────────────────────────
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

// ─── Admin Contact Notification ────────────────────────────────────────────────
export const adminContactNotificationJob = inngest.createFunction(
  {
    id: "admin-contact-notification-job",
    name: "Admin Contact Notification",
    triggers: [{ event: EVENTS.CONTACT_SUBMITTED }],
  },
  async ({ event }) => {
    // Admin notification handled in contactConfirmationJob to avoid double-send
    return { notified: true, event: "contact/submitted" };
  }
);

// ─── Order Confirmation Email ──────────────────────────────────────────────────
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

// ─── Scheduled: Prune Old Audit Logs ──────────────────────────────────────────
/**
 * Scheduled job — runs every Sunday at 02:00 UTC.
 * Deletes audit log entries older than 90 days to keep DB lean.
 *
 * To enable: configure a cron trigger in Inngest dashboard:
 *   cron: "0 2 * * 0"
 */
export const pruneOldAuditLogs = inngest.createFunction(
  {
    id: "prune-old-audit-logs",
    name: "Prune Old Audit Logs",
    rateLimit: { limit: 1, period: "1h" },
    triggers: [{ cron: "0 2 * * 0" }],
  },
  async ({ step }) => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 90); // 90-day retention

    const deleted = await step.run("delete-old-audit-logs", async () => {
      // Lazy import to avoid loading Prisma in every worker boot
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

// ─── Scheduled: Warm Cache ─────────────────────────────────────────────────────
/**
 * Pre-warms ISR cache for hot pages before peak traffic.
 * Runs every day at 06:00 + 12:00 UTC (before VN business hours).
 *
 * Fetches key pages so subsequent visitors get cached pages
 * instead of hitting cold ISR regenerations.
 */
export const warmCache = inngest.createFunction(
  {
    id: "warm-cache",
    name: "Warm ISR Cache",
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
      // Sequential fetch to avoid hammering the server
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

// ─── Compose: All Functions (export for Next.js handler) ──────────────────────
export const allJobs = [
  contactConfirmationJob,
  adminContactNotificationJob,
  orderConfirmationJob,
  pruneOldAuditLogs,
  warmCache,
];
