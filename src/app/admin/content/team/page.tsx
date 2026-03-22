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

export default function AdminTeamPage() {
  const columns: ColumnDef<any>[] = [
    {
      key: "name",
      header: "Tên",
      cell: ({ row }) => (
        <span className="font-medium text-white">{row.name}</span>
      ),
    },
    { key: "role", header: "Vai trò" },
    {
      key: "isActive",
      header: "Trạng thái",
      cell: ({ value }) =>
        value ? (
          <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-xs font-medium text-green-400">Hoạt động</span>
        ) : (
          <span className="rounded-full bg-slate-500/20 px-2 py-0.5 text-xs font-medium text-slate-400">Tắt</span>
        ),
    },
    { key: "sortOrder", header: "Thứ tự" },
    {
      key: "createdAt",
      header: "Ngày tạo",
      cell: ({ value }) =>
        value
          ? VI_DATE.format(new Date(value as string))
          : "—",
    },
  ];

  const actions: Action<any>[] = [
    { type: "edit", title: "Sửa" },
    { type: "delete", title: "Xóa" },
  ];

  const formFields: FormField[] = [
    { key: "name", label: "Tên", type: "text", required: true },
    { key: "slug", label: "Slug", type: "slug", sourceKey: "name" },
    { key: "role", label: "Vai trò", type: "text", required: true },
    { key: "shortBio", label: "Giới thiệu ngắn", type: "textarea" },
    { key: "bio", label: "Bio", type: "textarea" },
    { key: "image", label: "Hình ảnh", type: "image" },
    { key: "linkedin", label: "LinkedIn", type: "text" },
    { key: "twitter", label: "Twitter", type: "text" },
    { key: "github", label: "GitHub", type: "text" },
    { key: "sortOrder", label: "Thứ tự", type: "number" },
    { key: "isActive", label: "Hoạt động", type: "boolean" },
  ];

  const filters: FilterConfig[] = [
    { key: "search", label: "Tìm kiếm", type: "search", placeholder: "Tìm theo tên, vai trò..." },
    {
      key: "isActive",
      label: "Trạng thái",
      type: "select",
      options: [
        { value: "true", label: "Hoạt động" },
        { value: "false", label: "Tắt" },
      ],
    },
  ];

  return (
    <AdminCrudList<any>
      apiPath="/api/admin/team"
      entityName="Đội ngũ"
      columns={columns}
      actions={actions}
      formFields={formFields}
      filters={filters}
      statusKey="isActive"
    />
  );
}
