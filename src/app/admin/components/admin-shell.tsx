"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { signIn } from "next-auth/react";
import { useAdminAuth } from "@/app/[locale]/admin/components/admin-auth-provider";
import { AdminSidebar } from "./admin-sidebar";
import { AdminTopbar } from "./admin-topbar";
import { ROLE_LEVEL, NAV_PERMISSIONS, getRoleDisplayName } from "@/lib/auth/roles";

// ─── Access Block Component ─────────────────────────────────────────────────────

function RoleAccessDenied({
  requiredLevel,
  userRole,
}: {
  requiredLevel: number;
  userRole: string;
}) {
  const router = useRouter();
  const requiredLabel = getRoleDisplayNameByLevel(requiredLevel);
  const userLabel = getRoleDisplayName(userRole);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950">
      <div className="w-full max-w-md rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center">
        <div className="mb-4 text-5xl">🔒</div>
        <h2 className="mb-2 text-xl font-bold text-white">Truy cập bị từ chối</h2>
        <p className="mb-1 text-sm text-slate-400">
          Bạn đang đăng nhập với vai trò <span className="font-medium text-slate-200">{userLabel}</span>
        </p>
        <p className="mb-6 text-sm text-slate-400">
          Trang này yêu cầu quyền từ <span className="font-medium text-slate-200">{requiredLabel}</span> trở lên.
        </p>
        <div className="flex flex-col gap-2">
          <button
            onClick={() => router.back()}
            className="w-full rounded-lg bg-slate-800 px-4 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-700 transition-colors"
          >
            ← Quay lại
          </button>
          <button
            onClick={() => router.push("/admin")}
            className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-500 transition-colors"
          >
            Về Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Auth Block Component ────────────────────────────────────────────────────────

function AdminLoginForm() {
  const { login } = useAdminAuth();
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

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

  async function handleGoogleLogin() {
    setGoogleLoading(true);
    await signIn("google", { callbackUrl: "/admin" });
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

      <button
        type="button"
        onClick={handleGoogleLogin}
        disabled={googleLoading}
        className="mb-4 flex w-full items-center justify-center gap-3 rounded-lg border border-slate-700 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:opacity-50"
      >
        {googleLoading ? (
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
        )}
        Đăng nhập với Google
      </button>

      <div className="relative mb-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-700" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-slate-900 px-2 text-slate-500">Hoặc</span>
        </div>
      </div>

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

// ─── Main Shell ─────────────────────────────────────────────────────────────────

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAdminAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);

  // ── Step 1: Wait for hydration ─────────────────────────────────────────────
  useEffect(() => {
    if (!loading) {
      setIsChecking(false);
    }
  }, [loading]);

  // ── Step 2: Loading spinner ────────────────────────────────────────────────
  if (isChecking || loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          <p className="text-sm text-slate-400">Đang tải...</p>
        </div>
      </div>
    );
  }

  // ── Step 3: Not logged in → login form ────────────────────────────────────
  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950">
        <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900 p-8">
          <AdminLoginForm />
        </div>
      </div>
    );
  }

  // ── Step 4: Check role-level access for this page ─────────────────────────
  const userLevel = ROLE_LEVEL[user.role] ?? 99;

  // Determine required level from NAV_PERMISSIONS (or default to admin=1)
  const navConfig = NAV_PERMISSIONS[pathname];
  const requiredLevel = navConfig?.minRoleLevel ?? 1;

  if (userLevel > requiredLevel) {
    return <RoleAccessDenied requiredLevel={requiredLevel} userRole={user.role} />;
  }

  // ── Step 5: Authenticated + authorized → render admin layout ─────────────
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

// ─── Helpers ───────────────────────────────────────────────────────────────────

function getRoleDisplayName(role: string): string {
  const labels: Record<string, string> = {
    ceo: "CEO / Founder",
    super_admin: "Quản trị tối cao",
    admin: "Quản trị viên",
    project_manager: "Trưởng nhóm / PM",
    media: "Media / Marketing",
    qa: "QA / Tester",
    member: "Thành viên",
  };
  return labels[role] ?? role;
}

function getRoleDisplayNameByLevel(level: number): string {
  const labels: Record<number, string> = {
    [-1]: "CEO / Founder",
    0: "Quản trị tối cao",
    1: "Quản trị viên",
    2: "Trưởng nhóm / PM",
    3: "Media / Marketing",
    4: "QA / Tester",
    5: "Thành viên",
  };
  return labels[level] ?? `Cấp ${level}`;
}
