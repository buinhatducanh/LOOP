import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth/permissions";
import { authLogger } from "@/lib/logger";

/**
 * GET /api/admin/auth/me
 *
 * Returns the current authenticated admin user.
 *
 * Session source (in priority order):
 *  1. Authorization: Bearer <token> — FE API client sends JWT from localStorage
 *  2. HttpOnly auth-token cookie — server-side session (SSR, curl)
 *
 * Uses requireAuth() which:
 *   - Reads Bearer token first (from FE API calls)
 *   - Falls back to cookie session (server-side)
 *   - Throws AuthError(401) if neither is valid
 *
 * Neon cold-start: retries once after 500ms if DB connection fails.
 */
async function withRetry<T>(fn: () => Promise<T>): Promise<T | null> {
  for (let i = 0; i < 2; i++) {
    try {
      return await fn();
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

export async function GET(_req: NextRequest) {
  const start = Date.now();

  try {
    const _session = await withRetry(() => requireAuth(req));

    if (!session) {
      // DB unavailable — return 401 so client clears session gracefully
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    authLogger.withSLO("GET /api/admin/auth/me success", {
      endpoint: "/api/admin/auth/me",
      method: "GET",
      statusCode: 200,
      latencyMs: Date.now() - start,
    });

    // Return full session user (now includes sessionId, permissions, accessTags, etc.)
    return NextResponse.json({ user: session });
  } catch (err: unknown) {
    const statusCode =
      (err as { statusCode?: number }).statusCode ?? 401;

    authLogger.withSLO("GET /api/admin/auth/me failed", {
      endpoint: "/api/admin/auth/me",
      method: "GET",
      statusCode,
      latencyMs: Date.now() - start,
      error: err instanceof Error ? err.message : String(err),
    });

    return NextResponse.json(
      { error: statusCode === 401 ? "Unauthorized" : "Server error" },
      { status: statusCode }
    );
  }
}
