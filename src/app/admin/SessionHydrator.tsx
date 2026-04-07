"use client";

/**
 * SessionHydrator — verifies auth session with server on every mount.
 *
 * R3 upgrade (2026-04-07):
 *   1. Page reloads → Zustand re-hydrates from localStorage (isAuthenticated=true)
 *   2. SessionHydrator mounts → calls /me if token exists
 *   3. /me = 200 → store updated with fresh data + tokenExpiry refreshed
 *      /me = 401 → fetchSession clears store (redirect to login via AuthGuard)
 *
 * DB cold-start handling: retries once after 500ms on connection errors.
 *
 * NOTE: Uses useLayoutEffect to run BEFORE React renders children.
 * This avoids the "setState during render" issue.
 */
import { useLayoutEffect, useRef } from "react";
import { useAuthStore } from "@/app/store/authStore";
import { adminApi, type ApiErrorResponse } from "@/lib/api/client";

/** R3: Fetch /me with DB cold-start retry. */
async function _fetchMeWithRetry(): Promise<{
  ok: boolean;
  user?: unknown;
}> {
  const MAX_RETRIES = 1;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await adminApi.get<{ user: unknown } | ApiErrorResponse>(
        "/api/admin/auth/me",
        { throwOnError: false }
      );
      return { ok: !("error" in res), user: "user" in res ? res.user : undefined };
    } catch {
      // Network error — retry on cold-start
      if (attempt < MAX_RETRIES) {
        await new Promise<void>((r) => setTimeout(r, 500));
      }
    }
  }

  // All retries exhausted
  return { ok: false };
}

export function SessionHydrator() {
  const fetchSession = useAuthStore((s) => s.fetchSession);
  const initialized = useRef(false);

  useLayoutEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // Only verify session if a staff token exists in localStorage.
    // Without this guard, every page load calls /me and gets 401 (log spam).
    const hasStaffToken =
      typeof window !== "undefined" &&
      !!localStorage.getItem("loop-staff-token");

    if (hasStaffToken) {
      void fetchSession();
    }
    // If no token, user is guest — nothing to hydrate
  }, [fetchSession]);

  return null;
}
