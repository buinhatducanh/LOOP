/**
 * Quote Expiry Job — Inngest background function
 *
 * Cron: every 6 hours — expires stale QuoteRequests past their expiry date.
 * Also sends reminder notifications before expiry.
 *
 * Flow:
 * 1. Load quote_expiry_days from SiteSetting (default: 7 days)
 * 2. Find QuoteRequests: status NOT IN (expired/approved/rejected) AND createdAt < cutoff
 * 3. Update status → "expired", set expiredAt
 * 4. Send admin notification
 * 5. Send email reminder to customer (for near-expiry)
 */

import { inngest } from "./client";
import { prisma } from "@/lib/prisma";

export const quoteExpiryJob = inngest.createFunction(
 {
 id: "quote-expiry",
 name: "Quote Expiry Checker",
 rateLimit: { limit: 1, period: "1h" },
 triggers: [{ cron: "0 */6 * * *" }], // every 6 hours
 },
 async ({ step }) => {
 // ── Step 1: Load expiry config ─────────────────────────────────────────────
 const expiryDays = await step.run("load-expiry-config", async () => {
 const { prisma } = await import("@/lib/prisma");
 const setting = await prisma.siteSetting.findUnique({
 where: { key: "quote_expiry_days" },
 });
 return parseInt(setting?.value ?? "7", 10);
 });

 // ── Step 2: Find expiring quotes ──────────────────────────────────────────
 const cutoff = new Date();
 cutoff.setDate(cutoff.getDate() - expiryDays);

 const expiringQuotes = await step.run("find-expiring-quotes", async () => {
 const { prisma } = await import("@/lib/prisma");
 return prisma.quoteRequest.findMany({
 where: {
 status: { notIn: ["expired", "approved", "rejected", "paid"] },
 createdAt: { lt: cutoff },
  },
 select: {
 id: true,
 customerName: true,
 customerEmail: true,
 totalAmount: true,
 createdAt: true,
 },
 });
 });

 let expiredCount = 0;
 let reminderCount = 0;

 // ── Step 3: Expire old quotes ─────────────────────────────────────────────
 for (const quote of expiringQuotes) {
 const expired = await step.run(`expire-quote-${quote.id}`, async () => {
 const { prisma } = await import("@/lib/prisma");

 await prisma.quoteRequest.update({
 where: { id: quote.id },
 data: {
 status: "expired",
 expiredAt: new Date(),
 },
 });

 // Send admin notification
 await prisma.adminNotification.create({
 data: {
 type: "quote_expired",
 title: `Quote hết hạn: ${quote.customerName}`,
 message: `Quote "${quote.id}" từ ${quote.customerName} (${quote.customerEmail}) đã hết hạn sau ${expiryDays} ngày. Tổng: ${(quote.totalAmount ?? 0).toLocaleString()} VNĐ.`,
 priority: "normal",
 isRead: false,
 },
 });

 return true;
 });
 expiredCount++;
 }

 // ── Step 4: Near-expiry reminders (based on quote_reminder_hours) ───────
 const nearExpiryQuotes = await step.run("find-near-expiry-quotes", async () => {
 const { prisma } = await import("@/lib/prisma");
 const reminderHoursSetting = await prisma.siteSetting.findUnique({
 where: { key: "quote_reminder_hours" },
 });
 const hours = parseInt(reminderHoursSetting?.value ?? "24", 10);
 const hoursCutoff = new Date();
 hoursCutoff.setTime(hoursCutoff.getTime() - (expiryDays * 24 - hours) * 60 * 60 * 1000);

 return prisma.quoteRequest.findMany({
 where: {
 status: { notIn: ["expired", "approved", "rejected", "paid"] },
 createdAt: {
 lt: hoursCutoff,
 gte: cutoff,
 },
 },
 select: {
 id: true,
 customerName: true,
 customerEmail: true,
 totalAmount: true,
 createdAt: true,
 },
 });
 });

 for (const quote of nearExpiryQuotes) {
 await step.run(`remind-quote-${quote.id}`, async () => {
 const { prisma } = await import("@/lib/prisma");
 await prisma.adminNotification.create({
 data: {
 type: "quote_near_expiry",
 title: `Quote sắp hết hạn: ${quote.customerName}`,
 message: `Quote "${quote.id}" sắp hết hạn trong 24h. KH: ${quote.customerName}. Cần duyệt hoặc liên hệ lại.`,
 priority: "high",
 isRead: false,
 },
 });
 return true;
 });
 reminderCount++;
 }

 return {
 expired: expiredCount,
 reminders: reminderCount,
 expiryDays,
 cutoff: cutoff.toISOString(),
 };
 }
);
