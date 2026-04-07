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
 */
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/app/store/authStore";
import { adminApi, type ApiErrorResponse } from "@/lib/api/client";

// ── Cookie helpers ─────────────────────────────────────────────────────────────

function hasStoredStaffToken(): boolean {
  if (typeof window === "undefined") return false;
  return !!localStorage.getItem("loop-staff-token");
}

function hasAuthFlagCookie(): boolean {
  if (typeof window === "undefined") return false;
  return document.cookie.split(";").some((c) => c.trim().startsWith("auth-logged-in="));
}

function isTokenExpired(expiry: number | null): boolean {
  if (!expiry) return false;
  return Date.now() >= expiry;
}

// ── Async session verification ──────────────────────────────────────────────────

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

  // ── Zustand selectors (read synchronously — these are in-memory, no side effects) ──
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const accountType = useAuthStore((s) => s.accountType);
  const sessionHydrated = useAuthStore((s) => s.sessionHydrated);
  const tokenExpiry = useAuthStore((s) => s.tokenExpiry);

  // ── Local status state ───────────────────────────────────────────────────────
  const [status, setStatus] = useState<SessionStatus>("pending");
  const redirectFired = useRef(false);

  // ── Hydration check ──────────────────────────────────────────────────────────
  useEffect(() => {
    const checkHydration = (): boolean => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const store = useAuthStore.getState() as any;
      return !!store.persist?.hasHydrated?.();
    };

    const decide = () => {
      const expired = isTokenExpired(tokenExpiry);
      const noToken = !hasStoredStaffToken() && !hasAuthFlagCookie();

      // Case 1: No cached session → block immediately
      if (!isAuthenticated || accountType !== "staff" || noToken) {
        setStatus("blocked");
        return;
      }

      // Case 2: Token expired (and we know it) → block immediately
      if (expired && sessionHydrated) {
        // Clear stale localStorage token so we don't allow stale access
        localStorage.removeItem("loop-staff-token");
        setStatus("blocked");
        return;
      }

      // Case 3: Have cached session, token not expired → allow
      setStatus("allowed");

      // Case 4: Background revalidation — /me confirms or denies
      void (async () => {
        const valid = await verifySessionWithServer();
        if (!valid) {
          // Server says 401 → session is dead
          localStorage.removeItem("loop-staff-token");
          setStatus("blocked");
        }
        // If valid, keep status="allowed" — no state change needed
      })();
    };

    if (!checkHydration()) {
      const interval = setInterval(() => {
        if (checkHydration()) {
          clearInterval(interval);
          decide();
        }
      }, 50);

      // Safety timeout: allow after 2s even if storage never hydrates
      const timeout = setTimeout(() => {
        clearInterval(interval);
        decide();
      }, 2000);

      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    }

    decide();
  }, [isAuthenticated, accountType, sessionHydrated, tokenExpiry]);

  // ── Redirect — ONLY in useEffect (never during render) ─────────────────────
  useEffect(() => {
    if (status === "blocked" && !redirectFired.current) {
      redirectFired.current = true;
      router.replace("/admin/login");
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
