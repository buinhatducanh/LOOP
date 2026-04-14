import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";
import { isCeo, isSuperAdminRole, isAdminRole } from "@/lib/auth/roles";

/**
 * GET /api/admin/events/stream
 *
 * Server-Sent Events (SSE) endpoint for real-time admin notifications.
 * Filters notifications by tab permissions — users only receive notifications
 * relevant to tabs they have access to.
 *
 * Events emitted:
 * - connected — on successful auth, sends user context
 * - ping — heartbeat every 25s to keep proxies from closing idle connection
 * - notification — filtered by user's tab permissions
 *
 * 5-minute server-side safety timeout to prevent orphaned streams.
 */

// ── Tab permission map ───────────────────────────────────────────────────────────
// Maps notification type → required tab permission ("*" = all authenticated users)
const NOTIF_TAB_MAP: Record<string, string | "*"> = {
 // Web & domain
  web_purchase_pending: "web_packages",
 domain_purchase: "web_packages",
 web_expiry_reminder: "web_packages",
 // Orders & sales
 order_created: "orders",
 order_updated: "orders",
 payment_received: "orders",
 demo_ready: "orders",
 client_review: "orders",
 handover_pending: "orders",
 // Clients
 new_client_message: "clients",
 client_feedback: "clients",
 // Revenue & finance
 revenue_milestone: "revenue",
 lp_award: "lp",
 lp_redemption: "lp_manage",
 // Projects
 project_assigned: "projects",
 figma_submitted: "orders",
 figma_approved: "orders",
 figma_rejected: "orders",
 // Quests & events
 quest_completed: "quests_events",
 event_started: "quests_events",
 // Tasks & Kanban
 task_assigned: "kanban",
 task_in_review: "kanban",
 task_done: "kanban",
 sla_violation: "kanban",
 sla_warning: "kanban",
 // Members
 member_joined: "members",
 member_left: "members",
 // Global — everyone sees these
 system: "*",
 staff_checkin: "*",
 admin_alert: "*",
};

// ── Tab permission filter ────────────────────────────────────────────────────────
function canSeeNotif(
 session: {
 role: string;
 tabPermissions?: string[];
 departmentId?: string | null;
 departmentPermissions?: Record<string, string[]>;
 },
 type: string,
): boolean {
 const tab = NOTIF_TAB_MAP[type];
 if (!tab || tab === "*") return true;
 if (isCeo(session.role) || isSuperAdminRole(session.role) || isAdminRole(session.role)) return true;
 if (session.tabPermissions?.includes(tab)) return true;
 if (session.tabPermissions?.includes("*")) return true;
 if (session.departmentId && session.departmentPermissions?.[session.departmentId]?.includes(tab)) return true;
 return false;
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
 controller.enqueue(
 encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
 );
 };

 // ── 1. Initial connection event ──────────────────────────────────────
 send("connected", {
 userId: session.userId,
 role: session.role,
 roleLevel: session.roleLevel,
 connectedAt: new Date().toISOString(),
 });

 // ── 2. Send unread notifications immediately (filtered by tab perms) ──
 const initialPoll = async () => {
 try {
 const notifications = await prisma.adminNotification.findMany({
 where: { createdAt: { gt: lastPollAt } },
 orderBy: { createdAt: "asc" },
 take: 50,
 });

 if (notifications.length > 0) {
 lastPollAt = new Date();
 for (const n of notifications) {
 if (!canSeeNotif(session, n.type)) continue;
 send("notification", {
 id: n.id,
 type: n.type,
 title: n.title,
 message: n.message,
 link: n.link,
 priority: n.priority,
 isRead: n.isRead,
 createdAt: n.createdAt.toISOString(),
 });
 }
 }
 } catch {
 // non-fatal — stream should stay open
 }
 };

 void initialPoll();

 // ── 3. Poll every 30 seconds for new notifications (filtered by tab perms) ──
 interval = setInterval(async () => {
 try {
 const notifications = await prisma.adminNotification.findMany({
 where: { createdAt: { gt: lastPollAt } },
 orderBy: { createdAt: "asc" },
 take: 50,
 });

 if (notifications.length > 0) {
 lastPollAt = new Date();
 for (const n of notifications) {
 if (!canSeeNotif(session, n.type)) continue;
 send("notification", {
 id: n.id,
 type: n.type,
 title: n.title,
 message: n.message,
 link: n.link,
 priority: n.priority,
 isRead: n.isRead,
 createdAt: n.createdAt.toISOString(),
 });
 }
 }

 // Heartbeat
  send("ping", { ts: new Date().toISOString() });
 } catch {
 // keep stream alive even if DB temporarily unavailable
 }
 }, 30_000);

 // ── 4. 5-minute server-side safety timeout ───────────────────────────
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
