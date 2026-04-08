import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/admin/events/stream
 *
 * Server-Sent Events (SSE) endpoint for real-time admin notifications.
 *
 * Events emitted:
 * - connected  — on successful auth, sends user context
 * - ping       — heartbeat every 25s to keep proxies from closing idle connection
 * - notification — when new AdminNotification records exist since last poll
 *
 * Frontend connects via EventSource and reacts to these events.
 * Client should store last-poll timestamp locally and pass it as a query param
 * (handled server-side via closure, no re-auth needed per poll).
 *
 * 5-minute server-side safety timeout to prevent orphaned streams.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth(req);

    let interval: ReturnType<typeof setInterval> | undefined;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    let lastPollAt = new Date(0); // track notifications since this point

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

        // ── 2. Send any unread notifications immediately ────────────────────
        // (polling loop below will only pick up newer ones after this pass)
        const initialPoll = async () => {
          try {
            const notifications = await prisma.adminNotification.findMany({
              where: { createdAt: { gt: lastPollAt } },
              orderBy: { createdAt: "asc" },
              take: 50,
            });

            if (notifications.length > 0) {
              lastPollAt = new Date(); // don't re-send these
              for (const n of notifications) {
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

        void initialPoll(); // fire immediately after connect

        // ── 3. Poll every 30 seconds for new notifications ─────────────────
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
