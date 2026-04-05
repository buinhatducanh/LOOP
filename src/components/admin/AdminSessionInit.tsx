"use client";

/**
 * AdminSessionInit — re-hydrates auth session from server on every mount.
 *
 * Flow:
 *   1. App loads → Zustand re-hydrates from localStorage (user, role, isAuthenticated)
 *   2. AdminSessionInit mounts → calls /api/admin/auth/me to verify token validity
 *   3. If token valid  → store stays populated (no change needed)
 *      If token invalid → /me returns error → fetchSession() resets store to guest
 *   4. Admin layout sees isAuthenticated=true → renders admin shell
 *
 * This ensures:
 *   - User stays logged in across page refreshes (localStorage persistence)
 *   - If JWT expired, they are logged out (not stuck in ghost session)
 *   - Quests/Events always re-fetched from BE (not stale from localStorage)
 */
import { useEffect, useRef } from "react";
import { useAuthStore } from "@/app/store/authStore";

export function AdminSessionInit() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const fetchSession = useAuthStore((s) => s.fetchSession);
  const initialized = useRef(false);

  useEffect(() => {
    // Run once per full page load (not on HMR)
    if (initialized.current) return;
    initialized.current = true;

    if (isAuthenticated) {
      // Re-verify session with server; fetchSession handles invalid/expired tokens
      fetchSession();
    }
  }, []);

  return null;
}
