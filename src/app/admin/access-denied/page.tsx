"use client";

import { useRouter } from "next/navigation";
import { ShieldX } from "lucide-react";

export default function AccessDeniedPage() {
  const router = useRouter();

  return (
    <div className="flex h-screen items-center justify-center bg-slate-950 p-6">
      <div className="text-center max-w-md">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10">
          <ShieldX size={32} className="text-red-400" />
        </div>
        <h1 className="mb-3 text-3xl font-bold text-white">Truy cập bị từ chối</h1>
        <p className="mb-2 text-sm text-slate-400">
          Bạn không có quyền truy cập trang này.
        </p>
        <p className="mb-8 text-xs text-slate-600">
          Liên hệ quản trị viên để được cấp quyền hoặc quay lại dashboard.
        </p>
        <div className="flex justify-center gap-3">
          <button
            onClick={() => router.back()}
            className="rounded-lg border border-slate-700 bg-slate-800 px-5 py-2.5 text-sm text-slate-300 hover:bg-slate-700 transition-colors"
          >
            ← Quay lại
          </button>
          <button
            onClick={() => router.push("/admin")}
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            Về Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
