"use client";

import { Suspense } from "react";

export default function AdminStaffUsersPage() {
  return (
    <Suspense>
      <AdminStaffUsersContent />
    </Suspense>
  );
}

function AdminStaffUsersContent() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Tài Khoản NV</h1>
        <p className="text-sm text-slate-400">Quản lý tài khoản nhân viên</p>
      </div>
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-8 text-center">
        <p className="text-slate-400">Đang tải...</p>
      </div>
    </div>
  );
}
