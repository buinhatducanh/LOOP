import { NextRequest } from "next/server";
import { ok } from "@/lib/api";
import { createAuditLog } from "@/lib/auth/audit";
import { getSession } from "@/lib/auth/permissions";
import { revokeSession } from "@/lib/auth/session";
import { verifyAccessToken } from "@/lib/auth/token";

/**
 * POST /api/admin/auth/logout
 *
 * Revokes the current staff session in DB and clears all auth cookies.
 *
 * Split Auth (Option C):
 *   1. Extract sessionId from the access token (Bearer or cookie)
 *   2. Revoke the RefreshToken DB record (immediate force-logout)
 *   3. Clear all auth cookies (loop-staff-token, loop-customer-token, legacy keys)
 *   4. Audit log
 *
 * Does NOT require authentication — clears whatever session exists.
 * This ensures logout works even if the session is partially expired.
 */
export async function POST(req: NextRequest) {
  // Step 1: Try to get session for audit log and revocation
  let sessionId: string | null = null;
  let userId: string | null = null;

  // Try Bearer token first (FE sends from localStorage)
  const bearer = req.headers.get("Authorization");
  if (bearer?.startsWith("Bearer ")) {
    try {
      const payload = await verifyAccessToken(bearer.slice(7));
      sessionId = payload.sid;
      userId = payload.sub;
    } catch {
      // Token invalid/expired — still attempt cookie-based extraction
    }
  }

  // Fallback: try to get session from cookie
  if (!sessionId) {
    try {
      const _s = await getSession();
      if (_s) {
        sessionId = (_s as { sessionId?: string }).sessionId ?? null;
        userId = _s.userId;
      }
    } catch {
      // No valid session — proceed with clearing cookies only
    }
  }

  // Step 2: Revoke session in DB (if we have sessionId)
  if (sessionId) {
    try {
      await revokeSession(sessionId);
    } catch {
      // Don't block logout on DB errors — cookies must be cleared
    }
  }

  // Step 3: Audit log
  if (userId) {
    createAuditLog({
      userId,
      action: "logout",
      resource: "auth",
      resourceId: sessionId ?? undefined,
    }).catch(() => {/* fire-and-forget */});
  }

  // Step 4: Always clear all auth cookies (split auth: Option C)
  const response = ok({ success: true, revoked: sessionId ? true : false });

  const toClear = [
    // Staff tokens
    ["loop-staff-token", { httpOnly: true }],
    ["auth-token", { httpOnly: true }],           // legacy
    // Customer tokens (clear to prevent cross-account state)
    ["loop-customer-token", { httpOnly: true }],
    // Refresh + flags
    ["refresh-token", { httpOnly: true }],
    ["auth-method", { httpOnly: false }],
    ["auth-logged-in", { httpOnly: false }],
  ] as [string, { httpOnly: boolean }][];

  for (const [name, opts] of toClear) {
    response.cookies.set(name, "", {
      httpOnly: opts.httpOnly,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    });
  }

  return response;
}