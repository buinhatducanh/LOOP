"use client";

import { createContext, useState, useEffect, useContext } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAdminAuth } from "./admin-auth-provider";
import { AdminSidebar } from "./admin-sidebar";
import { AdminTopbar } from "./admin-topbar";

// ─── Sidebar Width Context ──────────────────────────────────────────────

const SIDEBAR_EXPANDED = 256; // w-64
const SIDEBAR_COLLAPSED = 64; // w-16

export const SidebarWidthCtx = createContext(SIDEBAR_EXPANDED);

export function useSidebarWidth() {
  return useContext(SidebarWidthCtx);
}

// ─── Shell ────────────────────────────────────────────────────────────────

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { user, loading, login } = useAdminAuth();
  const pathname = usePathname() ?? "/admin";
  const router = useRouter();
  const [sidebarWidth, setSidebarWidth] = useState(SIDEBAR_EXPANDED);

  // Safety timeout: always show UI after 3s even if /me hangs
  const [showUI, setShowUI] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setShowUI(true), 3_000);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    if (!loading) setShowUI(true);
  }, [loading]);

  if (!showUI) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div
            className="h-10 w-10 animate-spin rounded-full border-2"
            style={{
              borderColor: "rgba(139,92,246,0.3)",
              borderTopColor: "#8B5CF6",
            }}
          />
          <p className="text-sm" style={{ color: "rgba(209,213,219,0.4)" }}>Đang tải...</p>
        </div>
      </div>
    );
  }

  // Not logged in → Login
  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center p-4">
        <div
          className="w-full max-w-sm rounded-2xl p-8"
          style={{
            background: "rgba(15,17,23,0.98)",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 25px 60px rgba(0,0,0,0.5)",
          }}
        >
          <LoginForm login={login} router={router} />
        </div>
      </div>
    );
  }

  // ✅ Logged in + authorized
  return (
    <SidebarWidthCtx.Provider value={sidebarWidth}>
      <div className="flex h-screen">
        <AdminSidebar onCollapse={(collapsed) => setSidebarWidth(collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED)} />
        <div
          className="flex flex-1 flex-col"
          style={{ marginLeft: sidebarWidth, transition: "margin-left 0.3s" }}
        >
          <AdminTopbar />
          <main className="flex-1 overflow-auto p-6">{children}</main>
        </div>
      </div>
    </SidebarWidthCtx.Provider>
  );
}

// ─── Login Form ────────────────────────────────────────────────────────────

import type { AdminAuthContextType } from "./admin-auth-provider";

function LoginForm({
  login,
  router,
}: {
  login: AdminAuthContextType["login"];
  router: ReturnType<typeof useRouter>;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await login(email, password);
    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }
    router.push("/admin");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="text-center">
        <div
          className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl text-lg font-bold text-white"
          style={{
            background: "linear-gradient(135deg, #8B5CF6, #06B6D4)",
            boxShadow: "0 0 20px rgba(139,92,246,0.4)",
          }}
        >
          L
        </div>
        <h1
          className="text-xl font-bold"
          style={{
            background: "linear-gradient(to right, #C4B5FD, #A5F3FC)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          LOOP Admin
        </h1>
        <p className="mt-1 text-sm" style={{ color: "rgba(209,213,219,0.5)" }}>
          Đăng nhập để truy cập hệ thống
        </p>
      </div>

      {error && (
        <div
          className="rounded-lg p-3 text-sm"
          style={{ background: "rgba(248,113,113,0.1)", color: "#F87171" }}
        >
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium" style={{ color: "rgba(209,213,219,0.8)" }}>
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@loop.vn"
            required
            className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.10)",
              color: "#FFFFFF",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "rgba(139,92,246,0.6)";
              e.currentTarget.style.boxShadow = "0 0 0 2px rgba(139,92,246,0.15)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.10)";
              e.currentTarget.style.boxShadow = "none";
            }}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium" style={{ color: "rgba(209,213,219,0.8)" }}>
            Mật khẩu
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.10)",
              color: "#FFFFFF",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "rgba(139,92,246,0.6)";
              e.currentTarget.style.boxShadow = "0 0 0 2px rgba(139,92,246,0.15)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.10)";
              e.currentTarget.style.boxShadow = "none";
            }}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg py-2.5 text-sm font-medium text-white transition-all"
          style={{
            background: "linear-gradient(135deg, #8B5CF6, #06B6D4)",
            boxShadow: "0 0 20px rgba(139,92,246,0.3)",
          }}
          onMouseEnter={(e) => {
            if (!loading) (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 24px rgba(139,92,246,0.45)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 20px rgba(139,92,246,0.3)";
          }}
        >
          {loading ? "Đang đăng nhập..." : "Đăng nhập"}
        </button>
      </div>
    </form>
  );
}
