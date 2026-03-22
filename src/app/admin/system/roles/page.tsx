"use client";

import { Suspense } from "react";

export default function AdminRolesPage() {
  return (
    <Suspense>
      <AdminRolesContent />
    </Suspense>
  );
}

function AdminRolesContent() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Phân quyền</h1>
        <p className="text-sm text-slate-400">Quản lý roles & permissions</p>
      </div>
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-8 text-center">
        <p className="text-slate-400">Đang tải...</p>
      </div>
    </div>
  );
}
