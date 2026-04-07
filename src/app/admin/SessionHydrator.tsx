"use client";

/**
 * SessionHydrator — verifies auth session with server on every mount.
 *
 * R3 upgrade (2026-04-07):
 *   1. Page reloads → Zustand re-hydrates from localStorage (isAuthenticated=true)
 *   2. SessionHydrator mounts → calls /me if Zustand says staff + authenticated
 *   3. /me = 200 → store updated with fresh data + tokenExpiry refreshed
 *      /me = 401 → fetchSession clears store → AuthGuard redirects to login
 *
 * DB cold-start handling: retries once after 500ms on connection errors.
 *
 * NOTE: Uses useLayoutEffect to run BEFORE React renders children.
 * This avoids the "setState during render" issue.
 */
import { useLayoutEffect, useRef } from "react";
import { useAuthStore } from "@/app/store/authStore";

export function SessionHydrator() {
  const initialized = useRef(false);

  useLayoutEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // ── R3 fix: read from Zustand state, NOT localStorage directly ───────────────
    // Zustand is set synchronously by login() — it won't "disappear" mid-render.
    // It is also populated from localStorage on page load (persist middleware).
    // This avoids the race condition where AuthGuard clears the token before
    // SessionHydrator can call /me for verification.
    //
    // Decision tree:
    //   Zustand says authenticated + staff → verify with /me
    //   Zustand says not authenticated   → do nothing (AuthGuard handles redirect)
    //   Zustand not yet hydrated         → poll until it is
    //
    // R2 note: fetchSession() handles DB cold-start retry internally (1 retry).
    // R3 note: We only call fetchSession() when Zustand believes we are authenticated.
    //          If the cached session is stale (e.g. server-side session revoked),
    //          /me = 401 → fetchSession() clears Zustand → AuthGuard redirects.
    const store = useAuthStore.getState();
    if (!store.sessionHydrated) {
      // Zustand not yet rehydrated from localStorage — wait for it
      const interval = setInterval(() => {
        const s = useAuthStore.getState();
        if (s.sessionHydrated) {
          clearInterval(interval);
          // Now check Zustand state
          if (s.isAuthenticated && s.accountType === "staff") {
            void s.fetchSession();
          }
          // else: not authenticated — AuthGuard will redirect
        }
      }, 50);

      // Safety: if hydration never fires (SSR edge), don't block
      const timeout = setTimeout(() => {
        clearInterval(interval);
        // If we still have a staff token in localStorage but Zustand failed to
        // hydrate, fall back to direct /me call as a last resort
        const storedToken =
          typeof window !== "undefined"
            ? localStorage.getItem("loop-staff-token")
            : null;
        if (storedToken) {
          const s = useAuthStore.getState();
          void s.fetchSession();
        }
      }, 5000);

      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    }

    // Zustand hydrated — verify session if we believe we be authenticated
    if (store.isAuthenticated && store.accountType === "staff") {
      void store.fetchSession();
    }
    // else: not authenticated — AuthGuard handles redirect
  }, []);

  return null;
}
