"use client";
import {
  AdminCrudList,
  type ColumnDef,
  type Action,
  type FormField,
  type FilterConfig,
} from "@/components/admin/admin-crud-list";

export default function AdminPricingFeaturesPage() {
  const columns: ColumnDef<any>[] = [
    { key: "name", header: "Tên tính năng" },
    { key: "nameVi", header: "Tên (VI)" },
    { key: "tooltip", header: "Tooltip" },
    { key: "tooltipVi", header: "Tooltip (VI)" },
    { key: "category", header: "Danh mục", cell: ({ value }) => <span className="text-slate-300">{(value as any)?.nameVi ?? (value as any)?.name ?? "—"}</span> },
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
    { key: "categoryId", label: "Danh mục", type: "text" },
    { key: "name", label: "Tên tính năng", type: "text" },
    { key: "nameVi", label: "Tên (Tiếng Việt)", type: "text" },
    { key: "tooltip", label: "Tooltip", type: "text" },
    { key: "tooltipVi", label: "Tooltip (Tiếng Việt)", type: "text" },
    { key: "values", label: "Giá trị (JSON)", type: "textarea" },
    { key: "sortOrder", label: "Thứ tự", type: "number" },
    { key: "isActive", label: "Kích hoạt", type: "boolean" },
  ];

  const filters: FilterConfig[] = [
    { key: "search", label: "Tìm kiếm", type: "search", placeholder: "Tìm theo tên..." },
  ];

  return (
    <AdminCrudList<any>
      apiPath="/api/admin/packages/comparison-features"
      entityName="Pricing Features"
      columns={columns}
      actions={actions}
      formFields={formFields}
      filters={filters}
    />
  );
}
