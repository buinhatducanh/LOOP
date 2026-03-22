"use client";
import {
  AdminCrudList,
  type ColumnDef,
  type Action,
  type FormField,
  type FilterConfig,
} from "@/components/admin/admin-crud-list";

export default function AdminProjectsPage() {
  const columns: ColumnDef<any>[] = [
    { key: "title", header: "Tên dự án" },
    { key: "client", header: "Khách hàng" },
    { key: "category", header: "Danh mục" },
    {
      key: "image",
      header: "Hình ảnh",
      cell: ({ value }) =>
        value ? (
          <img src={String(value)} alt="" className="h-8 w-8 rounded-full object-cover" />
        ) : (
          <span className="text-slate-500">—</span>
        ),
    },
    {
      key: "isPublished",
      header: "Trạng thái",
      cell: ({ value }) =>
        value ? (
          <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-xs font-medium text-green-400">Xuất bản</span>
        ) : (
          <span className="rounded-full bg-slate-500/20 px-2 py-0.5 text-xs font-medium text-slate-400">Nháp</span>
        ),
    },
    { key: "sortOrder", header: "Thứ tự" },
  ];

  const actions: Action<any>[] = [
    { type: "edit", title: "Sửa" },
    { type: "delete", title: "Xóa" },
  ];

  const formFields: FormField[] = [
    { key: "title", label: "Tên dự án", type: "text", required: true },
    { key: "slug", label: "Slug", type: "slug", sourceKey: "title" },
    { key: "client", label: "Khách hàng", type: "text" },
    { key: "category", label: "Danh mục", type: "text" },
    { key: "image", label: "Hình ảnh", type: "image" },
    { key: "description", label: "Mô tả", type: "textarea" },
    { key: "serviceId", label: "Dịch vụ", type: "text" },
    { key: "sortOrder", label: "Thứ tự", type: "number" },
    { key: "isPublished", label: "Xuất bản", type: "boolean" },
  ];

  const filters: FilterConfig[] = [
    { key: "search", label: "Tìm kiếm", type: "search", placeholder: "Tìm theo tên, khách hàng..." },
    { key: "serviceId", label: "Dịch vụ", type: "select", options: [] },
    {
      key: "isPublished",
      label: "Trạng thái",
      type: "select",
      options: [
        { value: "true", label: "Xuất bản" },
        { value: "false", label: "Nháp" },
      ],
    },
  ];

  return (
    <AdminCrudList<any>
      apiPath="/api/admin/projects"
      entityName="Dự án"
      columns={columns}
      actions={actions}
      formFields={formFields}
      filters={filters}
      statusKey="isPublished"
    />
  );
}
