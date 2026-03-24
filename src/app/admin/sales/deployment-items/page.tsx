"use client";
import {
  AdminCrudList,
  type ColumnDef,
  type Action,
  type FormField,
  type FilterConfig,
} from "@/components/admin/admin-crud-list";

export default function AdminDeploymentItemsPage() {
  const columns: ColumnDef<any>[] = [
    { key: "slug", header: "Slug" },
    { key: "title", header: "Tiêu đề" },
    { key: "titleVi", header: "Tiêu đề (VI)" },
    {
      key: "handedToClient",
      header: "Giao cho khách",
      cell: ({ value }) => (
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${value ? "bg-green-500/20 text-green-400" : "bg-slate-500/20 text-slate-400"}`}>
          {value ? "Có" : "Không"}
        </span>
      ),
    },
    { key: "icon", header: "Icon" },
    { key: "note", header: "Ghi chú" },
    { key: "sortOrder", header: "Thứ tự" },
    {
      key: "isActive",
      header: "Trạng thái",
      cell: ({ value }) => (
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${value ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
          {value ? "Đang bật" : "Đã tắt"}
        </span>
      ),
    },
  ];

  const actions: Action<any>[] = [{ type: "edit" }, { type: "delete" }];

  const formFields: FormField[] = [
    { key: "slug", label: "Slug", type: "text" },
    { key: "title", label: "Tiêu đề", type: "text" },
    { key: "titleVi", label: "Tiêu đề (Tiếng Việt)", type: "text" },
    { key: "description", label: "Mô tả", type: "textarea" },
    { key: "descriptionVi", label: "Mô tả (Tiếng Việt)", type: "textarea" },
    { key: "icon", label: "Icon (emoji)", type: "text" },
    { key: "handedToClient", label: "Giao cho khách", type: "boolean" },
    { key: "note", label: "Ghi chú", type: "text" },
    { key: "noteVi", label: "Ghi chú (Tiếng Việt)", type: "text" },
    { key: "sortOrder", label: "Thứ tự", type: "number" },
    { key: "isActive", label: "Kích hoạt", type: "boolean" },
  ];

  const filters: FilterConfig[] = [
    { key: "search", label: "Tìm kiếm", type: "search", placeholder: "Tìm theo tiêu đề..." },
    {
      key: "isActive",
      label: "Trạng thái",
      type: "select",
      options: [
        { value: "true", label: "Đang bật" },
        { value: "false", label: "Đã tắt" },
      ],
    },
  ];

  return (
    <AdminCrudList<any>
      apiPath="/api/admin/packages/deployment-items"
      entityName="Deployment Items"
      columns={columns}
      actions={actions}
      formFields={formFields}
      filters={filters}
    />
  );
}
