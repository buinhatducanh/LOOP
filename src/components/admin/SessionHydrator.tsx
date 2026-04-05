"use client";

/**
 * SessionHydrator — hydrates Zustand authStore from localStorage on admin mount.
 *
 * Behavior:
 *   - If store already has isAuthenticated=true (e.g. just logged in, redirected)
 *     → do nothing — store already has the valid session, no need to re-fetch.
 *   - If store is empty (direct navigation to /admin) → fetch session from server.
 *     → Server uses HttpOnly cookie to validate JWT.
 *     → fetchSession() handles expired/invalid tokens by resetting store to guest.
 *
 * This prevents the bug where just-logged-in users got logged out because
 * fetchSession() ran immediately and the token wasn't sent correctly yet.
 *
 * Run order:
 *   Zustand rehydration from localStorage → SessionHydrator reads store
 *   → decides whether to call fetchSession()
 */
import { useLayoutEffect, useRef } from "react";
import { useAuthStore } from "@/app/store/authStore";

export function SessionHydrator() {
  const fetchSession = useAuthStore((s) => s.fetchSession);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const initialized = useRef(false);

  useLayoutEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // Only fetch session if store is empty (direct navigation).
    // If isAuthenticated=true, user just logged in — store already has valid data.
    if (!isAuthenticated) {
      fetchSession();
    }
  }, [fetchSession, isAuthenticated]);

  return null;
}
