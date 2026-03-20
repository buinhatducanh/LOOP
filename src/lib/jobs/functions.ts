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

// ─── Contact Confirmation Email ─────────────────────────────────────────────────
/**
 * Sends a confirmation email to the customer after they submit a contact form.
 * Triggered by: contact/submitted event
 * Retry policy: 3 attempts with exponential backoff
 */
export const sendContactConfirmation = inngest.createFunction(
  { id: "send-contact-confirmation", name: "Send Contact Confirmation" },
  { event: EVENTS.CONTACT_SUBMITTED },
  async ({ event }) => {
    const payload = event.data as ContactSubmittedPayload;

    // TODO: Integrate Resend or SendGrid
    // const resend = new Resend(process.env.RESEND_API_KEY);
    // await resend.emails.send({
    //   from: "LOOP <hello@loop.vn>",
    //   to: payload.email,
    //   subject: `Cảm ơn ${payload.name} đã liên hệ với LOOP!`,
    //   html: renderContactConfirmationEmail(payload),
    // });

    console.log(
      `[Inngest] Contact confirmation email queued for:`,
      payload.email,
      payload.timestamp
    );

    return { sent: true, email: payload.email };
  }
);

// ─── Admin Contact Notification ─────────────────────────────────────────────────
/**
 * Notifies admins about new contact form submissions.
 * Sends to configured admin emails from site settings.
 */
export const notifyAdminsOfContact = inngest.createFunction(
  { id: "notify-admins-contact", name: "Notify Admins — New Contact" },
  { event: EVENTS.CONTACT_SUBMITTED },
  async ({ event }) => {
    const payload = event.data as ContactSubmittedPayload;

    // TODO: Send to admin notification channel
    // Options: Resend to admin@loop.vn, Slack webhook, Discord webhook
    console.log(
      `[Inngest] Admin notification for new contact from:`,
      payload.name,
      payload.email
    );

    return { notified: true };
  }
);

// ─── Order Confirmation Email ──────────────────────────────────────────────────
/**
 * Sends order confirmation email after a service order is created.
 * Triggered by: order/created event
 */
export const sendOrderConfirmation = inngest.createFunction(
  { id: "send-order-confirmation", name: "Send Order Confirmation" },
  { event: EVENTS.ORDER_CREATED },
  async ({ event }) => {
    const payload = event.data as OrderCreatedPayload;

    // TODO: Integrate Resend
    // await resend.emails.send({
    //   from: "LOOP <orders@loop.vn>",
    //   to: payload.customerEmail,
    //   subject: `Đơn hàng ${payload.orderNumber} đã được tiếp nhận`,
    //   html: renderOrderConfirmationEmail(payload),
    // });

    console.log(
      `[Inngest] Order confirmation queued:`,
      payload.orderNumber,
      payload.customerEmail
    );

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
    rateLimit: { limit: 1, period: "1h" }, // Run at most once per hour
  },
  { cron: "0 2 * * 0" }, // Every Sunday at 02:00 UTC
  async ({ step }) => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 90); // 90-day retention

    const deleted = await step.run("delete-old-audit-logs", async () => {
      const { Prisma } = await import("@prisma/client");
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
  },
  { cron: "0 6,12 * * *" }, // 06:00 and 12:00 UTC
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
  sendContactConfirmation,
  notifyAdminsOfContact,
  sendOrderConfirmation,
  pruneOldAuditLogs,
  warmCache,
];
