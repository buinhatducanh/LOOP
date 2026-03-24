"use client";
import React from "react";
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

export default function AdminInstructorsPage() {
  const columns: ColumnDef<any>[] = [
    {
      key: "name",
      header: "Tên giảng viên",
      cell: ({ row }) => (
        <span className="font-medium text-white">{row.name ?? "—"}</span>
      ),
    },
    {
      key: "title",
      header: "Chức danh",
      cell: ({ value }): React.ReactNode => String(value ?? ""),
    },
    {
      key: "bio",
      header: "Giới thiệu",
      cell: ({ value }): React.ReactNode =>
        value ? (
          <span className="line-clamp-2 text-xs text-slate-400">{String(value)}</span>
        ) : (
          "—"
        ),
    },
    {
      key: "memberId",
      header: "Thành viên liên kết",
      cell: ({ value }): React.ReactNode =>
        value ? <span className="text-xs text-purple-400">Đã liên kết</span> : <span className="text-xs text-slate-500">Chưa liên kết</span>,
    },
    {
      key: "userId",
      header: "User liên kết",
      cell: ({ value }): React.ReactNode =>
        value ? <span className="text-xs text-cyan-400">Đã liên kết</span> : <span className="text-xs text-slate-500">Chưa liên kết</span>,
    },
    {
      key: "createdAt",
      header: "Ngày tạo",
      cell: ({ value }) =>
        value ? VI_DATE.format(new Date(value as string)) : "—",
    },
  ];

  const actions: Action<any>[] = [
    { type: "edit", title: "Sửa" },
    { type: "delete", title: "Xóa" },
  ];

  const formFields: FormField[] = [
    { key: "name", label: "Tên giảng viên", type: "text", required: true },
    { key: "title", label: "Chức danh", type: "text" },
    { key: "bio", label: "Giới thiệu", type: "textarea" },
    { key: "image", label: "Hình ảnh", type: "image" },
    { key: "linkedin", label: "LinkedIn", type: "text" },
    { key: "twitter", label: "Twitter", type: "text" },
  ];

  const filters: FilterConfig[] = [
    { key: "search", label: "Tìm kiếm", type: "search", placeholder: "Tìm theo tên, chức danh..." },
  ];

  return (
    <AdminCrudList<any>
      apiPath="/api/admin/edu/instructors"
      entityName="Giảng viên"
      columns={columns}
      actions={actions}
      formFields={formFields}
      filters={filters}
    />
  );
}
