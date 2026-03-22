"use client";

import { AdminCrudList } from "@/components/admin/admin-crud-list";
import type { ColumnDef, FilterConfig } from "@/components/admin/admin-crud-list";

interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId: string;
  createdAt: string;
}

const ACTION_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  create: { bg: "bg-green-500/15", text: "text-green-400", dot: "bg-green-400" },
  update: { bg: "bg-blue-500/15", text: "text-blue-400", dot: "bg-blue-400" },
  delete: { bg: "bg-red-500/15", text: "text-red-400", dot: "bg-red-400" },
  read: { bg: "bg-slate-500/15", text: "text-slate-400", dot: "bg-slate-400" },
};

const ACTION_LABELS: Record<string, string> = {
  create: "Tạo",
  update: "Sửa",
  delete: "Xóa",
  read: "Xem",
};

const ActionBadge = ({ action }: { action: string }) => {
  const colors = ACTION_COLORS[action] ?? { bg: "bg-slate-500/15", text: "text-slate-400", dot: "bg-slate-400" };
  const label = ACTION_LABELS[action] ?? action;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${colors.bg} ${colors.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${colors.dot}`} />
      {label}
    </span>
  );
};

const columns: ColumnDef<AuditLog>[] = [
  {
    key: "action",
    header: "Hành động",
    accessor: (r) => <ActionBadge action={r.action ?? "read"} />,
    width: "100px",
  },
  { key: "resource", header: "Tài nguyên" },
  { key: "resourceId", header: "ID tài nguyên" },
  { key: "userId", header: "User ID" },
  {
    key: "createdAt",
    header: "Thời gian",
    accessor: (r) =>
      r.createdAt
        ? Intl.DateTimeFormat("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }).format(new Date(r.createdAt))
        : "—",
    width: "160px",
  },
];

const filters: FilterConfig[] = [
  {
    key: "action",
    label: "Hành động",
    type: "select",
    options: [
      { value: "create", label: "Tạo" },
      { value: "update", label: "Sửa" },
      { value: "delete", label: "Xóa" },
      { value: "read", label: "Xem" },
    ],
  },
  { key: "resource", label: "Tài nguyên", type: "search", placeholder: "Tìm theo tài nguyên…" },
];

export default function AdminAuditLogPage() {
  return (
    <AdminCrudList<AuditLog>
      apiPath="/api/admin/audit-log"
      entityName="Nhật ký Hệ thống"
      columns={columns}
      actions={[]}
      formFields={[]}
      filters={filters}
    />
  );
}
