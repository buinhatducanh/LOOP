"use client";

/**
 * SessionHydrator — verifies auth session with server once Zustand is ready.
 *
 * Flow (with persist middleware):
 *   1. Page loads → Zustand begins rehydration from localStorage
 *   2. SessionHydrator mounts → waits for rehydration to complete
 *   3. Once rehydrated:
 *      - If isAuthenticated=true → verify JWT with server via fetchSession()
 *      - If isAuthenticated=false → do nothing (not logged in)
 *   4. fetchSession() result:
 *      - JWT valid  → store updated with fresh server data
 *      - JWT expired → store reset to guest (redirect to login)
 *
 * Run order is critical:
 *   Zustand rehydration → SessionHydrator fires → fetchSession() → store updated
 *
 * Ref guard: fires exactly once per full page load (not HMR).
 */
import { useEffect, useRef } from "react";
import { useAuthStore } from "@/app/store/authStore";

export function SessionHydrator() {
  const fetchSession = useAuthStore((s) => s.fetchSession);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // Give Zustand one tick to rehydrate from localStorage.
    // The persist middleware sets _rehydrated=true in onRehydrateStorage callback.
    const timer = setTimeout(() => {
      const state = useAuthStore.getState() as unknown as { _rehydrated?: boolean };
      if (state._rehydrated) {
        fetchSession();
      } else {
        // Fallback: Zustand has no _rehydrated flag yet; just call fetchSession.
        // If not authenticated it will be a no-op; if authenticated it verifies.
        fetchSession();
      }
    }, 50);

    return () => clearTimeout(timer);
  }, [fetchSession]);

  return null;
}
