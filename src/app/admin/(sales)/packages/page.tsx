"use client";

import { Package } from "lucide-react";

export default function AdminPackagesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Gói dịch vụ</h1>
        <p className="text-sm text-slate-400">Quản lý gói dịch vụ và pricing</p>
      </div>

      <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-slate-800 text-slate-500">
        <Package size={40} className="mb-3 text-slate-700" />
        <p className="text-lg font-medium text-slate-400">Module Gói dịch vụ</p>
        <p className="text-sm">Template, Custom, Subscription packages - Đang phát triển</p>
      </div>
    </div>
  );
}
