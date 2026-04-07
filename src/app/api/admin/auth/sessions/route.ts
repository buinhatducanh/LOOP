/**
 * GET /api/admin/auth/sessions
 *
 * List all active sessions for the authenticated user.
 * Used for "Active Sessions" UI in account settings.
 *
 * Response: { sessions: [{ sessionId, deviceType, ipAddress, createdAt, lastUsedAt, expiresAt }] }
 */

import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth/permissions";
import { getActiveSessions } from "@/lib/auth/session";
import { handleError } from "@/lib/api";

export async function GET(_req: NextRequest) {
  try {
    const session = await requireAuth(req);

    const sessions = await getActiveSessions(session.userId);

    return ok({ sessions });
  } catch (err) {
    return handleError(err);
  }
}
