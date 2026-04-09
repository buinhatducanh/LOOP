"use client";

/**
 * SessionHydrator — verifies auth session with server on every mount.
 *
 * Fix (2026-04-09): uses useRef to ensure exactly ONE /me call per mount.
 * Previous useLayoutEffect approach caused race conditions with AuthGuard
 * reading stale Zustand state.
 *
 * Flow:
 *   Page reload → Zustand rehydrates from localStorage (isAuthenticated=true)
 *   SessionHydrator useEffect fires (once, guarded by ref) → /me
 *   /me = 200 → store synced → AuthGuard renders admin UI
 *   /me = 401 → store cleared → AuthGuard redirects to login
 */
import { useEffect, useRef } from "react";
import { useAuthStore } from "@/app/store/authStore";

export function SessionHydrator() {
  const triggered = useRef(false);

  useEffect(() => {
    if (triggered.current) return;
    triggered.current = true;

    const store = useAuthStore.getState();

    // If Zustand hasn't rehydrated yet, poll until it does
    if (!store.sessionHydrated) {
      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;
        const s = useAuthStore.getState();
        if (s.sessionHydrated || attempts > 100) {
          clearInterval(interval);
          if (s.isAuthenticated && s.accountType === "staff") {
            void s.fetchSession();
          }
        }
      }, 50);
      return;
    }

    // Zustand hydrated — verify session if staff
    if (store.isAuthenticated && store.accountType === "staff") {
      void store.fetchSession();
    }
  }, []);

  return null;
}
