import { NextRequest, NextResponse } from "next/server";
import { getSession, getSessionFromBearer } from "@/lib/auth/permissions";
import { authLogger } from "@/lib/logger";

/**
 * GET /api/admin/auth/me
 * Returns the current authenticated admin user.
 *
 * Session source (in priority order):
 *  1. Authorization: Bearer <token> — FE API client sends JWT from localStorage
 *  2. HttpOnly auth-token cookie — server-side session (SSR, curl)
 *
 * Performance notes:
 * - Neon cold-start: retries once after 500ms if connection fails.
 * - DB unavailable: returns 401 (graceful degradation, client clears session).
 */

async function getSessionWithRetry(): Promise<ReturnType<typeof getSession> | null> {
  for (let i = 0; i < 2; i++) {
    try {
      return await getSession();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      const isConnErr =
        msg.includes("Can't reach database") ||
        msg.includes("Connection terminated") ||
        msg.includes("timeout") ||
        msg.includes("P1001") ||
        msg.includes("P2024");

      if (i < 1 && isConnErr) {
        await new Promise<void>((r) => setTimeout(r, 500));
        continue;
      }
      throw err;
    }
  }
  return null;
}

export async function GET(req: NextRequest) {
  const start = Date.now();
  try {
    // Priority 1: Authorization header (FE sends Bearer token from localStorage)
    const bearer = req.headers.get("Authorization");
    if (bearer?.startsWith("Bearer ")) {
      const token = bearer.slice(7);
      const session = await getSessionFromBearer(token);
      if (session) {
        authLogger.withSLO("GET /api/admin/auth/me success", {
          endpoint: "/api/admin/auth/me",
          method: "GET",
          statusCode: 200,
          latencyMs: Date.now() - start,
        });
        return NextResponse.json({ user: session });
      }
      // Bearer token invalid — 401 (do not fall through to cookie path)
      authLogger.withSLO("GET /api/admin/auth/me unauthorized", {
        endpoint: "/api/admin/auth/me",
        method: "GET",
        statusCode: 401,
        latencyMs: Date.now() - start,
      });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Priority 2: Cookie-based session (server-side SSR)
    const session = await getSessionWithRetry();
    if (!session) {
      authLogger.withSLO("GET /api/admin/auth/me no session", {
        endpoint: "/api/admin/auth/me",
        method: "GET",
        statusCode: 401,
        latencyMs: Date.now() - start,
      });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    authLogger.withSLO("GET /api/admin/auth/me success", {
      endpoint: "/api/admin/auth/me",
      method: "GET",
      statusCode: 200,
      latencyMs: Date.now() - start,
    });
    return NextResponse.json({ user: session });
  } catch (err) {
    authLogger.withSLO("GET /api/admin/auth/me failed", {
      endpoint: "/api/admin/auth/me",
      method: "GET",
      statusCode: 401,
      latencyMs: Date.now() - start,
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
