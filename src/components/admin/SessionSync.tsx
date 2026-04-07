"use client";

/**
 * SessionSync — reads user data from Zustand store and passes to layout components.
 *
 * On mount (after rehydration), reads user from persist-backed Zustand store
 * and passes the data down to AdminSidebar + AdminTopbar via inline style/data attributes.
 * This replaces server-side getSession() which fails on soft navigations.
 */
import { useEffect, useRef } from "react";
import { useAuthStore } from "@/app/store/authStore";

export function SessionSync() {
  const _user = useAuthStore((s) => s.user);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    // Store is already rehydrated by the time this runs (SessionHydrator handles fetchSession)
  }, []);

  // Noop — user data is read directly from store in Sidebar/Topbar components.
  // This component exists solely to coordinate timing.
  return null;
}