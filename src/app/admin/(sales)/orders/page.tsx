"use client";

import { ShoppingCart } from "lucide-react";

export default function AdminOrdersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Quản lý Đơn hàng</h1>
        <p className="text-sm text-slate-400">Theo dõi và xử lý đơn hàng</p>
      </div>

      <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-slate-800 text-slate-500">
        <ShoppingCart size={40} className="mb-3 text-slate-700" />
        <p className="text-lg font-medium text-slate-400">Module Đơn hàng</p>
        <p className="text-sm">Kanban board + Table view - Đang phát triển (Phase 12)</p>
      </div>
    </div>
  );
}
