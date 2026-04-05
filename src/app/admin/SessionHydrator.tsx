"use client";

/**
 * SessionHydrator — syncs server session → Zustand authStore on mount.
 *
 * After a page reload, Zustand authStore is empty (in-memory only).
 * This component runs after hydration and calls fetchSession() to
 * re-populate the store from the HttpOnly cookie via /api/admin/auth/me.
 *
 * Once Zustand is hydrated, all client components that read from the
 * store (AdminSidebar, etc.) will have the correct role/user data.
 */
import { useEffect, useRef } from "react";
import { useAuthStore } from "@/app/store/authStore";

export function SessionHydrator() {
  const fetchSession = useAuthStore((s) => s.fetchSession);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    // Only fetch if Zustand store is empty (fresh reload)
    if (!isAuthenticated) {
      initialized.current = true;
      fetchSession();
    }
  }, [fetchSession, isAuthenticated]);

  return null;
}
