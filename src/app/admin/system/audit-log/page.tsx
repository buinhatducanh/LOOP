"use client";

import { useEffect, useState, useCallback } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { DataTable } from "../../../../components/data-table";

interface AuditEntry {
  id: string;
  action: string;
  resource: string;
  resourceId: string | null;
  ipAddress: string | null;
  createdAt: string;
  user: { name: string; email: string } | null;
}

const actionColors: Record<string, string> = {
  create: "bg-green-500/20 text-green-400",
  update: "bg-blue-500/20 text-blue-400",
  delete: "bg-red-500/20 text-red-400",
  login_success: "bg-emerald-500/20 text-emerald-400",
  login_failed: "bg-red-500/20 text-red-400",
};

const columns: ColumnDef<AuditEntry, unknown>[] = [
  {
    accessorKey: "createdAt",
    header: "Thời gian",
    cell: ({ row }) => (
      <span className="text-xs text-slate-400">
        {new Date(row.original.createdAt).toLocaleString("vi-VN")}
      </span>
    ),
  },
  {
    id: "user",
    header: "Người dùng",
    cell: ({ row }) => (
      <div>
        <p className="text-sm text-white">{row.original.user?.name || "System"}</p>
        <p className="text-xs text-slate-500">{row.original.user?.email || ""}</p>
      </div>
    ),
  },
  {
    accessorKey: "action",
    header: "Hành động",
    cell: ({ row }) => (
      <span
        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
          actionColors[row.original.action] || "bg-slate-700 text-slate-300"
        }`}
      >
        {row.original.action}
      </span>
    ),
  },
  {
    accessorKey: "resource",
    header: "Module",
    cell: ({ row }) => (
      <span className="text-sm capitalize text-slate-300">{row.original.resource}</span>
    ),
  },
  {
    accessorKey: "resourceId",
    header: "ID",
    cell: ({ row }) => (
      <span className="font-mono text-xs text-slate-500">
        {row.original.resourceId ? row.original.resourceId.slice(0, 8) + "..." : "—"}
      </span>
    ),
  },
  {
    accessorKey: "ipAddress",
    header: "IP",
    cell: ({ row }) => (
      <span className="text-xs text-slate-500">{row.original.ipAddress || "—"}</span>
    ),
  },
];

export default function AdminAuditLogPage() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 0 });

  const fetchData = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/audit-log?page=${page}&limit=50`);
      const data = await res.json();
      setLogs(data.data || []);
      setPagination(data.pagination || { page: 1, limit: 50, total: 0, totalPages: 0 });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Nhật ký hoạt động</h1>
        <p className="text-sm text-slate-400">Theo dõi mọi hành động trong hệ thống</p>
      </div>

      <DataTable
        data={logs}
        columns={columns}
        loading={loading}
        pagination={pagination}
        onPageChange={fetchData}
      />
    </div>
  );
}
