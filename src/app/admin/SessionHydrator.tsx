"use client";

/**
 * SessionHydrator — verifies auth session with server on every mount.
 *
 * Fix (2026-04-10): Neon cold-start protection.
 *
 * Problem: On page reload with a warm Zustand store (isAuthenticated=true),
 * SessionHydrator immediately calls /me. If Neon is cold-starting, /me takes
 * 5+ seconds and returns 401 — clearing the store and showing a login modal
 * even though the session is valid. This causes a "flicker" on every reload.
 *
 * Solution:
 * 1. GRACE PERIOD: Wait 3 seconds after mount before calling /me. Neon
 *    typically warms up within 2-3 seconds, so by then /me will succeed.
 * 2. ONCE-VERIFIED: Track whether we've ever received a successful /me.
 *    Once verified, future page reloads still verify (session could have
 *    expired or been revoked server-side).
 * 3. STORE-CACHED BEHAVIOR: Keep the warm store active during the grace
 *    period so AuthGuard renders the admin UI immediately.
 */
import { useEffect, useRef } from "react";
import { useAuthStore } from "@/app/store/authStore";

const GRACE_PERIOD_MS = 3000; // Wait for Neon to warm up before /me
const MAX_RETRY_COUNT = 1;
const RETRY_DELAY_MS = 2000;

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
            scheduleVerification();
          }
        }
      }, 50);
      return;
    }

    // Zustand hydrated — verify session if staff
    if (store.isAuthenticated && store.accountType === "staff") {
      scheduleVerification();
    }
  }, []);

  /**
   * Schedule /me verification after the Neon warm-up grace period.
   * Keeps the warm Zustand store active so AuthGuard renders immediately.
   */
  function scheduleVerification() {
    setTimeout(() => {
      verifyWithRetry(0);
    }, GRACE_PERIOD_MS);
  }

  /**
   * Call /me with 1 retry on 401 (covers Neon cold-start scenario).
   * Only clears the store if /me definitively fails.
   */
  async function verifyWithRetry(retryCount: number) {
    const currentStore = useAuthStore.getState();

    // Guard: only verify if still staff session
    if (!currentStore.isAuthenticated || currentStore.accountType !== "staff") {
      return;
    }

    try {
      await currentStore.fetchSession();
    } catch (err) {
      const is401 =
        err instanceof Error &&
        (err.message.includes("401") || err.message.includes("Unauthorized"));

      if (is401 && retryCount < MAX_RETRY_COUNT) {
        // First /me failed with 401 — likely Neon cold-start.
        // Retry once after a short delay to let Neon fully initialize.
        setTimeout(() => {
          verifyWithRetry(retryCount + 1);
        }, RETRY_DELAY_MS);
        return;
      }

      // Retry failed or non-401 error — clear session (server rejected it)
      useAuthStore.setState({
        isAuthenticated: false,
        user: null,
        role: "guest" as const,
        accountType: null,
        accessibleTabs: [],
        sessionHydrated: true,
        tokenExpiry: null,
      });
    }
  }

  return null;
}
