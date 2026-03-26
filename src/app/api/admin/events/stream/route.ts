import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth/permissions";

/**
 * GET /api/admin/events/stream
 * Lightweight SSE stream for admin realtime updates.
 *
 * Current implementation emits:
 * - connected event immediately
 * - ping heartbeat every 25s
 *
 * Frontend can keep EventSource open and react to events.
 */
export async function GET(_req: NextRequest) {
  try {
    const session = await requireAuth();

    let interval: ReturnType<typeof setInterval> | undefined;
    let timeout: ReturnType<typeof setTimeout> | undefined;

    const stream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();

        const send = (event: string, data: unknown) => {
          controller.enqueue(
            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
          );
        };

        // Initial connection event
        send("connected", {
          userId: session.userId,
          role: session.role,
          connectedAt: new Date().toISOString(),
        });

        // Heartbeat to keep proxies from closing idle connection
        interval = setInterval(() => {
          send("ping", { ts: new Date().toISOString() });
        }, 25_000);

        // 5-minute server-side safety timeout
        timeout = setTimeout(() => {
          if (interval) clearInterval(interval);
          try {
            controller.close();
          } catch {
            // ignore close races
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
