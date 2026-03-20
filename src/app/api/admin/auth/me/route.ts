import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/permissions";
import { NextRequest } from "next/server";

/**
 * GET /api/admin/auth/me
 * Returns the current authenticated admin user.
 *
 * Performance notes:
 * - Credentials login: reads `auth-method=credentials` cookie → uses custom JWT
 *   path only (no NextAuth path attempt) → 1 DB call instead of 2.
 * - Neon cold-start: retries once after 500ms if connection fails.
 * - DB unavailable: returns 401 (graceful degradation, client clears session).
 */
async function getSessionWithRetry(attempts = 2): Promise<ReturnType<typeof getSession>> {
  for (let i = 0; i < attempts; i++) {
    try {
      return await getSession();
    } catch (err: unknown) {
      const isConnectionError =
        err instanceof Error &&
        (err.message.includes("Can't reach database") ||
          err.message.includes("Connection terminated") ||
          err.message.includes("timeout") ||
          err.message.includes("P1001") ||
          err.message.includes("P2024"));

      if (i < attempts - 1 && isConnectionError) {
        // Neon cold-start / pool exhausted — retry after 500ms
        await new Promise((r) => setTimeout(r, 500));
        continue;
      }
      throw err;
    }
  }
  return null;
}

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionWithRetry();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ user: session });
  } catch (err) {
    console.error("[/api/admin/auth/me]", err);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
