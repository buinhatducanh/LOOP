"use client";

import { useState } from "react";
import { useAdminAuth } from "./admin-auth-provider";
import { AdminSidebar } from "./admin-sidebar";
import { AdminTopbar } from "./admin-topbar";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAdminAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          <p className="text-sm text-slate-400">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950">
        <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900 p-8">
          <AdminLoginForm />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <div className="ml-64 flex flex-1 flex-col">
        <AdminTopbar />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}

function AdminLoginForm() {
  const { login } = useAdminAuth();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const result = await login(email, password);
    if (result.error) {
      setError(result.error);
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-6 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-lg font-bold text-white">
          L
        </div>
        <h1 className="text-xl font-bold text-white">LOOP Admin</h1>
        <p className="mt-1 text-sm text-slate-400">Đăng nhập để quản trị hệ thống</p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-500/10 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-300">Email</label>
          <input
            name="email"
            type="email"
            required
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            placeholder="admin@loop.vn"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-300">Mật khẩu</label>
          <input
            name="password"
            type="password"
            required
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            placeholder="••••••••"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Đang đăng nhập..." : "Đăng nhập"}
        </button>
      </div>
    </form>
  );
}
