"use client";

/**
 * AuthGuard — protects admin routes (staff-only).
 *
 * Auth flow:
 *   1. Zustand hydrated → isAuthenticated=true + accountType=staff
 *      → RENDER IMMEDIATELY (no delay)
 *      → useEffect: verify session with /me in background
 *      → /me = 401 → clear auth store → setStatus("blocked") → useEffect: redirect
 *
 *   2. Zustand hydrated → isAuthenticated=false OR no token in localStorage
 *      → RENDER null immediately
 *      → useEffect: redirect to /admin/login
 *
 * Rules:
 *   - NEVER call Zustand set() during render phase (anti-pattern)
 *   - NEVER call router.replace() during render phase (React error)
 *   - All state mutations MUST be in useEffect
 *
 * Fix (2026-04-07): AuthGuard now checks localStorage directly for the staff token
 * BEFORE making routing decisions, so it works even when Zustand hasn't rehydrated
 * yet from a freshly logged-in session (e.g. footer login → /admin/overview navigation).
 */
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/app/store/authStore";
import { adminApi, type ApiErrorResponse } from "@/lib/api/client";

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Lightweight JWT expiry check without signature verification.
 * Only decodes the payload — fast enough to run synchronously.
 * Returns null if the token is missing or malformed.
 */
function getTokenExpiry(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    // exp is seconds; convert to ms
    return payload.exp ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

function isTokenExpired(expiryMs: number): boolean {
  return Date.now() >= expiryMs;
}

/**
 * Returns "allowed" if we should render the admin UI, "blocked" if we should
 * redirect to login. Checks Zustand store AND falls back to localStorage token.
 */
type DecisionResult = "allowed" | "blocked";

function makeDecision(opts: {
  isAuthenticated: boolean;
  accountType: string | null;
  tokenExpiry: number | null;
}): DecisionResult {
  const { isAuthenticated, accountType, tokenExpiry } = opts;

  // ── Check 1: localStorage has the staff token ──────────────────────────────
  // This is the primary signal after a successful login.
  // It is always set synchronously by login() before navigation.
  const storedToken = typeof window !== "undefined"
    ? localStorage.getItem("loop-staff-token")
    : null;

  if (storedToken) {
    // Token present — check if we know it has expired
    if (tokenExpiry !== null && isTokenExpired(tokenExpiry)) {
      // We know the JWT has expired — clear it and block
      localStorage.removeItem("loop-staff-token");
      return "blocked";
    }
    // Token present and not expired → ALLOW immediately
    // (background /me verification will catch edge cases)
    return "allowed";
  }

  // ── Check 2: Zustand says authenticated + correct accountType ─────────────
  // This handles pages visited while already logged in (page refresh).
  if (isAuthenticated && accountType === "staff") {
    // Zustand believes session is valid → ALLOW
    // (background /me verification will catch expired token)
    return "allowed";
  }

  // ── Check 3: Nothing — block ───────────────────────────────────────────────
  return "blocked";
}

// ── Async session verification ────────────────────────────────────────────────

async function verifySessionWithServer(): Promise<boolean> {
  const MAX_RETRIES = 1;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await adminApi.get<{ user: unknown } | ApiErrorResponse>(
        "/api/admin/auth/me",
        { throwOnError: false }
      );
      return !("error" in res);
    } catch {
      if (attempt < MAX_RETRIES) {
        await new Promise<void>((r) => setTimeout(r, 500));
      }
    }
  }
  return false;
}

// ── SessionStatus ──────────────────────────────────────────────────────────────

type SessionStatus =
  | "pending"   // waiting for Zustand hydration
  | "allowed"   // session valid — render admin UI
  | "blocked"; // no session — redirect to login

// ── Component ─────────────────────────────────────────────────────────────────

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  // ── Local status state ───────────────────────────────────────────────────────
  const [status, setStatus] = useState<SessionStatus>("pending");
  const redirectFired = useRef(false);

  // ── Hydration check + auth decision ─────────────────────────────────────────
  useEffect(() => {
    /**
     * Zustand 5: persist API is on the store API (useAuthStore.persist),
     * NOT on the state object returned by getState().
     * In Zustand 4 the API was on getState().persist; in Zustand 5 it moved
     * to useAuthStore.persist (the store itself IS the API).
     */
    const checkHydration = (): boolean => {
      return !!useAuthStore.persist?.hasHydrated?.();
    };

    const decide = () => {
      /**
       * Read FRESH Zustand state — NOT the closure variables.
       * This fixes the race condition where AuthGuard checks stale state
       * (isAuthenticated=false) before Zustand rehydrates from localStorage
       * after a soft navigation from the homepage.
       */
      const fresh = useAuthStore.getState();
      const freshTokenExpiry = fresh.tokenExpiry;
      const result = makeDecision({
        isAuthenticated: fresh.isAuthenticated,
        accountType: fresh.accountType,
        tokenExpiry: freshTokenExpiry,
      });

      // If blocked, clear any stale localStorage token
      if (result === "blocked") {
        localStorage.removeItem("loop-staff-token");
      }

      setStatus(result);

      // Background revalidation: always confirm with /me when allowed
      if (result === "allowed") {
        void (async () => {
          const valid = await verifySessionWithServer();
          if (!valid) {
            // Server says 401 → token dead (e.g. DB reset, forced logout)
            localStorage.removeItem("loop-staff-token");
            setStatus("blocked");
          }
          // If valid, keep status="allowed" — no state change needed
        })();
      }
    };

    if (!checkHydration()) {
      // Zustand not yet hydrated — check localStorage as fallback.
      // This prevents race condition when opening /admin in a new tab.
      const storedToken = localStorage.getItem("loop-staff-token");
      if (storedToken) {
        const exp = getTokenExpiry(storedToken);
        if (!exp || !isTokenExpired(exp)) {
          // Token exists and not expired → allow immediately
          setStatus("allowed");
          void (async () => {
            const valid = await verifySessionWithServer();
            if (!valid) {
              localStorage.removeItem("loop-staff-token");
              setStatus("blocked");
            }
          })();
          return;
        }
        // Token expired → clear and wait for hydration
        localStorage.removeItem("loop-staff-token");
      }

      // No localStorage token → poll Zustand hydration
      const interval = setInterval(() => {
        if (checkHydration()) {
          clearInterval(interval);
          decide();
        }
      }, 50);

      // Safety: if Zustand hydration never fires (e.g. SSR edge case),
      // don't block — the only way to be here without a token is truly no session.
      const timeout = setTimeout(() => {
        clearInterval(interval);
        setStatus("blocked");
      }, 5000);

      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    }

    decide();
  }, []); // No reactive deps — Zustand state read via getState() inside decide()

  // ── Redirect — ONLY in useEffect (never during render) ─────────────────────
  useEffect(() => {
    if (status === "blocked" && !redirectFired.current) {
      redirectFired.current = true;
      // Redirect to /admin/login which renders the footer login modal.
      // The page is already /admin/login so no navigation actually occurs —
      // the modal just needs to be opened by the page itself.
      if (!window.location.pathname.includes("/admin/login")) {
        router.replace("/admin/login");
      }
    }
  }, [status, router]);

  // ── Render ─────────────────────────────────────────────────────────────────

  // Waiting for Zustand hydration → render nothing
  if (status === "pending") return null;

  // No valid session → render nothing (redirect fires in useEffect above)
  if (status === "blocked") return null;

  // Valid session → render admin UI immediately
  return <>{children}</>;
}

