"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAdminAuth } from "./admin-auth-provider";
import { AdminSidebar } from "./admin-sidebar";
import { AdminTopbar } from "./admin-topbar";

// ─── Shell ────────────────────────────────────────────────────────────────

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { user, loading, login } = useAdminAuth();
  const pathname = usePathname() ?? "/admin";
  const router = useRouter();

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
      <div className="flex h-screen items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-blue-500/30 border-t-blue-500" />
          <p className="text-sm text-slate-500">Đang tải...</p>
        </div>
      </div>
    );
  }

  // Not logged in → Login
  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950 p-4">
        <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 p-8">
          <LoginForm login={login} router={router} />
        </div>
      </div>
    );
  }

  // ✅ Logged in + authorized
  return (
    <div className="flex h-screen">
      <AdminSidebar />
      <div className="ml-64 flex flex-1 flex-col">
        <AdminTopbar />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}

// ─── Login Form ───────────────────────────────────────────────────────────

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
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-lg font-bold text-white">
          L
        </div>
        <h1 className="text-xl font-bold text-white">LOOP Admin</h1>
        <p className="mt-1 text-sm text-slate-400">Đăng nhập để truy cập hệ thống</p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-500/10 p-3 text-sm text-red-400">{error}</div>
      )}

      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-300">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@loop.vn"
            required
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-300">Mật khẩu</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Đang đăng nhập..." : "Đăng nhập"}
        </button>
      </div>
    </form>
  );
}
