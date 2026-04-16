import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/client/events/stream
 *
 * Server-Sent Events (SSE) endpoint for real-time customer notifications.
 * Users receive their own notifications (scoped by userId).
 *
 * Events emitted:
 * - connected — on successful auth
 * - ping — heartbeat every 25s to keep proxies from closing idle connection
 * - notification — user's own notifications
 *
 * 5-minute server-side safety timeout to prevent orphaned streams.
 */

// ── Notification type metadata (for client-side enrichment) ─────────────────

function enrichNotification(n: {
 id: string;
 type: string;
 title: string;
 message: string;
 link?: string | null;
 isRead: boolean;
 createdAt: Date;
}): {
 id: string;
 type: string;
 title: string;
 message: string;
 link?: string | null;
 isRead: boolean;
 createdAt: string;
 icon: string;
 color: string;
 category: string;
} {
 const typeConfig: Record<string, { icon: string; color: string; category: string }> = {
 order_update: { icon: "shopping-cart", color: "#818CF8", category: "order" },
 demo_ready: { icon: "check-circle", color: "#3B82F6", category: "order" },
 invoice: { icon: "file-text", color: "#22C55E", category: "order" },
 lp_earned: { icon: "zap", color: "#FFD700", category: "lp" },
 message: { icon: "message-square", color: "#818CF8", category: "client" },
 system: { icon: "settings", color: "#94A3B8", category: "system" },
 vip_promotion: { icon: "star", color: "#EC4899", category: "vip" },
 payment_reminder: { icon: "credit-card", color: "#F59E0B", category: "order" },
 order_completed: { icon: "check-circle", color: "#22C55E", category: "order" },
 referral_bonus: { icon: "users", color: "#14B8A6", category: "lp" },
 quest_reward: { icon: "trophy", color: "#FFD700", category: "quest" },
 };
 const cfg = typeConfig[n.type] ?? { icon: "bell", color: "#94A3B8", category: "system" };
 return {
 id: n.id,
 type: n.type,
 title: n.title,
 message: n.message,
 link: n.link ?? undefined,
 isRead: n.isRead,
 createdAt: n.createdAt.toISOString(),
 icon: cfg.icon,
 color: cfg.color,
 category: cfg.category,
 };
}

export async function GET(req: NextRequest) {
 try {
 const session = await requireAuth(req);

 let interval: ReturnType<typeof setInterval> | undefined;
 let timeout: ReturnType<typeof setTimeout> | undefined;
 let lastPollAt = new Date(0);

 const stream = new ReadableStream({
 start(controller) {
 const encoder = new TextEncoder();

 const send = (event: string, data: unknown) => {
 try {
 controller.enqueue(
 encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
 );
 } catch {
 // controller may be closed
 }
 };

 // ── 1. Initial connection event ──────────────────────────────────────
 send("connected", {
 userId: session.userId,
 accountType: session.accountType,
 connectedAt: new Date().toISOString(),
 });

 // ── 2. Send unread notifications immediately ─────────────────────────
 const initialPoll = async () => {
 try {
 const notifications = await prisma.notification.findMany({
 where: {
 userId: session.userId,
 createdAt: { gt: lastPollAt },
 },
 orderBy: { createdAt: "asc" },
 take: 50,
 });

 if (notifications.length > 0) {
 lastPollAt = new Date();
 for (const n of notifications) {
 send("notification", enrichNotification(n));
 }
 }
 } catch {
 // non-fatal
 }
 };

 void initialPoll();

 // ── 3. Poll every 30 seconds for new notifications ──────────────────
 interval = setInterval(async () => {
 try {
 const notifications = await prisma.notification.findMany({
 where: {
 userId: session.userId,
 createdAt: { gt: lastPollAt },
 },
 orderBy: { createdAt: "asc" },
 take: 50,
 });

 if (notifications.length > 0) {
 lastPollAt = new Date();
 for (const n of notifications) {
 send("notification", enrichNotification(n));
 }
 }

 // Heartbeat
 send("ping", { ts: new Date().toISOString() });
 } catch {
 // keep stream alive
 }
 }, 30_000);

 // ── 4. 5-minute server-side safety timeout ──────────────────────────
 timeout = setTimeout(() => {
 if (interval) clearInterval(interval);
 try {
 controller.close();
 } catch {
 // ignore races
 }
 }, 5 * 60 * 1000);
 },

 cancel() {
 if (interval) clearInterval(interval);
 if (timeout) clearTimeout(timeout);
 },
 });

 return new Response(stream, {
 headers: {
 "Content-Type": "text/event-stream",
 "Cache-Control": "no-cache, no-transform",
 Connection: "keep-alive",
 "X-Accel-Buffering": "no",
 },
 status: 200,
 });
 } catch {
 return new Response(JSON.stringify({ error: "Unauthorized" }), {
 status: 401,
 headers: { "Content-Type": "application/json" },
 });
 }
}
