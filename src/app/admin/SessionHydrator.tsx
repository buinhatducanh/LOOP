"use client";

/**
 * SessionHydrator — verifies auth session with server on every mount.
 *
 * Flow (with persist middleware):
 *   1. Page reloads → Zustand re-hydrates from localStorage (isAuthenticated=true)
 *   2. SessionHydrator mounts → calls fetchSession() to verify JWT with server
 *   3. JWT valid    → /me returns user data → store updated with fresh data
 *      JWT expired   → /me returns error → fetchSession resets store to guest
 *
 * Runs once per full page load (not per HMR), regardless of localStorage state.
 * This prevents ghost sessions where user is "logged in" locally but JWT expired.
 *
 * NOTE: Uses useLayoutEffect to run BEFORE React renders children.
 * This avoids the "setState during render" issue that AdminSessionInit had.
 * Zustand store is already re-hydrated from localStorage before this runs.
 */
import { useLayoutEffect, useRef } from "react";
import { useAuthStore } from "@/app/store/authStore";

export function SessionHydrator() {
  const fetchSession = useAuthStore((s) => s.fetchSession);
  const initialized = useRef(false);

  // useLayoutEffect: runs synchronously after DOM mutations but before paint.
  // Ensures store is updated BEFORE any child components read from it.
  useLayoutEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    fetchSession();
  }, []); // run once on mount

  return null;
}
