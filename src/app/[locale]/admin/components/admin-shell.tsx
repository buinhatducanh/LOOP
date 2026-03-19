"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { signIn } from "next-auth/react";
import { useAdminAuth } from "@/app/[locale]/admin/components/admin-auth-provider";
import { AdminSidebar } from "./admin-sidebar";
import { AdminTopbar } from "./admin-topbar";
import { NAV_PERMISSIONS, ROLE_LEVEL } from "@/lib/auth/roles";

function getPathAccessLevel(pathname: string): number {
  // Find most specific config (longest match)
  let best: number | undefined = undefined;
  for (const path of Object.keys(NAV_PERMISSIONS)) {
    if (pathname.startsWith(path) || path === pathname) {
      const level = NAV_PERMISSIONS[path]?.minRoleLevel;
      if (level !== undefined) {
        if (best === undefined || level < best) best = level;
      }
    }
  }
  return best ?? 5; // default: all authenticated staff
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAdminAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [checkDone, setCheckDone] = useState(false);

  useEffect(() => {
    if (!loading) setCheckDone(true);
  }, [loading, user]);

  if (!checkDone) {
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
          <LoginForm />
        </div>
      </div>
    );
  }

  // Check path-level permission
  const requiredLevel = getPathAccessLevel(pathname);
  const userLevel = ROLE_LEVEL[user.role] ?? 99;

  if (userLevel > requiredLevel) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950 p-4">
        <div className="text-center">
          <div className="mb-6 text-6xl">🔒</div>
          <h2 className="mb-3 text-2xl font-bold text-white">Không có quyền truy cập</h2>
          <p className="mb-2 text-sm text-slate-400">
            Tài khoản <span className="text-white font-medium">{user.role}</span> không được phép truy cập trang này.
          </p>
          <p className="mb-8 text-xs text-slate-600">
            Liên hệ quản trị viên để được cấp quyền.
          </p>
          <div className="flex justify-center gap-3">
            <button
              onClick={() => router.back()}
              className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700"
            >
              ← Quay lại
            </button>
            <button
              onClick={() => router.push("/vi/admin")}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
            >
              Về Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Authorized
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

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Đăng nhập thất bại");
        return;
      }
      router.refresh();
    } catch {
      setError("Lỗi kết nối máy chủ");
    } finally {
      setLoading(false);
    }
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
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
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
