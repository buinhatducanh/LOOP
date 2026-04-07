/**
 * DELETE /api/admin/auth/sessions/[id]
 *
 * Revoke a specific session by sessionId.
 * Used for "Sign out device" feature in Active Sessions UI.
 *
 * Users can only revoke their own sessions.
 * Super admin can revoke any session.
 */

import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth/permissions";
import { revokeSession, revokeAllSessions } from "@/lib/auth/session";
import { ok, handleError, badRequest, notFound } from "@/lib/api";
import { isSuperAdmin } from "@/lib/auth/permissions";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth(req);
    const { id: sessionId } = await params;

    if (!sessionId) {
      return badRequest("Missing session ID");
    }

    // "logout everywhere" special keyword
    if (sessionId === "all") {
      const count = await revokeAllSessions(session.userId);
      return ok({ revoked: count, scope: "all" });
    }

    // Users can only revoke their own sessions (super_admin can revoke any)
    if (!isSuperAdmin(session) && session.sessionId === sessionId) {
      return badRequest("Cannot revoke current session — use logout instead");
    }

    const revoked = await revokeSession(sessionId);
    if (!revoked) {
      return notFound("Session not found or already revoked");
    }

    return ok({ revoked: 1, sessionId });
  } catch (err) {
    return handleError(err);
  }
}
