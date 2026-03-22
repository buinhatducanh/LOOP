"use client";
import {
  AdminCrudList,
  type ColumnDef,
  type Action,
  type FormField,
  type FilterConfig,
} from "@/components/admin/admin-crud-list";

const VI_DATE = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

export default function AdminRolesPage() {
  const columns: ColumnDef<any>[] = [
    { key: "displayName", header: "Tên hiển thị" },
    { key: "description", header: "Mô tả" },
    { key: "level", header: "Cấp độ" },
    {
      key: "isSystem",
      header: "Hệ thống",
      cell: ({ value }) =>
        value ? (
          <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-xs font-medium text-blue-400">System</span>
        ) : (
          <span className="rounded-full bg-slate-500/20 px-2 py-0.5 text-xs font-medium text-slate-400">Custom</span>
        ),
    },
    {
      key: "createdAt",
      header: "Ngày tạo",
      cell: ({ value }) =>
        value ? VI_DATE.format(new Date(value as string)) : "—",
    },
  ];

  const actions: Action<any>[] = [];

  const formFields: FormField[] = [];

  const filters: FilterConfig[] = [
    { key: "search", label: "Tìm kiếm", type: "search", placeholder: "Tìm theo tên hiển thị..." },
  ];

  return (
    <AdminCrudList<any>
      apiPath="/api/admin/roles"
      entityName="Phân quyền"
      columns={columns}
      actions={actions}
      formFields={formFields}
      filters={filters}
    />
  );
}
