"use client";

/**
 * AuthGuard — protects admin routes (staff-only).
 *
 * Auth flow:
 *   1. Zustand hydrated → isAuthenticated=true + accountType=staff
 *      → RENDER IMMEDIATELY (no /me verification, no expiry check)
 *   2. Zustand hydrated → isAuthenticated=false OR no token in localStorage
 *      → RENDER null immediately
 *      → useEffect:
 *         • Has stale token → show "Phiên hết hạn" modal
 *         • No token → render AdminLoginModal (no redirect needed)
 *
 * Auto-logout on token expiry shows a modal instead of a harsh redirect.
 *
 * Rules:
 *   - NEVER call Zustand set() during render phase (anti-pattern)
 *   - NEVER call router.replace() during render phase (React error)
 *   - All state mutations MUST be in useEffect
 */
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/app/store/authStore";
import { AdminLoginModal } from "./AdminLoginModal";

// ── Session Expiry Modal ────────────────────────────────────────────────────────

function SessionExpiryModal({
  onDismiss,
}: {
  onDismiss: () => void;
}) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.7)",
        backdropFilter: "blur(4px)",
      }}
    >
      <div
        style={{
          background: "#111827",
          border: "1px solid rgba(236,72,153,0.3)",
          borderRadius: 16,
          padding: "32px 28px",
          maxWidth: 400,
          width: "90%",
          textAlign: "center",
          boxShadow: "0 0 40px rgba(236,72,153,0.15)",
        }}
      >
        {/* Lock icon */}
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: "rgba(236,72,153,0.12)",
            border: "1px solid rgba(236,72,153,0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px",
          }}
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#EC4899" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>

        <h3 style={{ color: "#FFFFFF", fontSize: 18, fontWeight: 700, marginBottom: 8, fontFamily: "'Cinzel', serif" }}>
          Phiên đăng nhập hết hạn
        </h3>
        <p style={{ color: "#94A3B8", fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
          Phiên làm việc của bạn đã hết hạn. Vui lòng đăng nhập lại để tiếp tục sử dụng hệ thống.
        </p>

        <button
          onClick={onDismiss}
          style={{
            width: "100%",
            padding: "12px 20px",
            borderRadius: 10,
            border: "none",
            background: "linear-gradient(135deg, #6B3DF5, #EC4899)",
            color: "#FFFFFF",
            fontSize: 15,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Quay về trang chủ
        </button>
      </div>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Returns "allowed" if we should render the admin UI, "blocked" if we should
 * redirect to login. Checks Zustand store AND falls back to localStorage token.
 *
 * NOTE: Auto-logout on token expiry is DISABLED — sessions stay alive regardless
 * of JWT expiry. Sessions only end when the user explicitly logs out or
 * the server returns 401.
 */
type DecisionResult = "allowed" | "blocked";

function makeDecision(opts: {
  isAuthenticated: boolean;
  accountType: string | null;
}): DecisionResult {
  const { isAuthenticated, accountType } = opts;

  // ── Check: Must have a valid localStorage token (not just Zustand state).
  //    Zustand state may be stale (e.g. persisted from previous session after
  //    server redirected to login?reason=expired). Only trust Zustand when a
  //    valid, non-expired localStorage token also exists.
  const localToken =
    typeof window !== "undefined"
      ? localStorage.getItem("loop-staff-token")
      : null;

  if (localToken) {
    // Token in localStorage — decode and verify expiry (avoids SSR issues)
    try {
      const parts = localToken.split(".");
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
        const isExpired = payload.exp ? Date.now() >= payload.exp * 1000 : true;
        if (!isExpired && isAuthenticated && accountType === "staff") {
          return "allowed";
        }
        // Token expired — treat as no token
      }
    } catch {
      // Malformed token — treat as no token
    }
  }

  // ── No valid localStorage token — block ──────────────────────────────────
  return "blocked";
}

// ── SessionStatus ──────────────────────────────────────────────────────────────

type SessionStatus =
  | "pending"   // waiting for Zustand hydration
  | "allowed"   // session valid — render admin UI
  | "blocked"; // no session — redirect to login

// ── Component ─────────────────────────────────────────────────────────────────

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  // ── Local status state + expiry modal ────────────────────────────────────────
  const [status, setStatus] = useState<SessionStatus>("pending");
  const [showExpiryModal, setShowExpiryModal] = useState(false);

  // ── Hydration check + auth decision ─────────────────────────────────────────
  useEffect(() => {
    const checkHydration = (): boolean => {
      return !!useAuthStore.persist?.hasHydrated?.();
    };

    const decide = () => {
      const fresh = useAuthStore.getState();
      const result = makeDecision({
        isAuthenticated: fresh.isAuthenticated,
        accountType: fresh.accountType,
      });
      setStatus(result);
    };

    if (!checkHydration()) {
      const interval = setInterval(() => {
        if (checkHydration()) {
          clearInterval(interval);
          decide();
        }
      }, 50);

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

  // ── Handle blocked status ────────────────────────────────────────────────────
  useEffect(() => {
    if (status === "blocked") {
      const hasStaleToken =
        typeof window !== "undefined" &&
        !!localStorage.getItem("loop-staff-token");

      if (hasStaleToken) {
        // Stale session — show expiry modal
        setShowExpiryModal(true);
      }
      // No token at all → AdminLoginModal renders below (no redirect needed)
    }
  }, [status]);

  // ── Dismiss modal → clear stale token, redirect to home ──────────────────────
  const handleDismiss = () => {
    localStorage.removeItem("loop-staff-token");
    setShowExpiryModal(false);
    // Redirect to home page — token is expired, no point showing login form
    router.push("/vi");
  };

  // ── Sync: clear stale token when Zustand session is cleared by 401 ─────────────
  useEffect(() => {
    const unsubscribe = useAuthStore.subscribe((state, prev) => {
      // isAuthenticated flipped true → false after being hydrated (401 from /me)
      if (prev.isAuthenticated && !state.isAuthenticated && state.sessionHydrated) {
        localStorage.removeItem("loop-staff-token");
      }
    });
    return unsubscribe;
  }, []);

  // ── Render ───────────────────────────────────────────────────────────────────

  if (status === "pending") return null;

  // Blocked: show login form (expiry modal overlays it)
  if (status === "blocked") {
    return (
      <>
        <AdminLoginModal>
          <div style={{ display: "none" }} />
        </AdminLoginModal>
        {showExpiryModal && <SessionExpiryModal onDismiss={handleDismiss} />}
      </>
    );
  }

  return children;
}

