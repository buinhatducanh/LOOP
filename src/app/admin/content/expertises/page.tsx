"use client";

import { AdminCrudList } from "@/components/admin/admin-crud-list";
import type { ColumnDef, FormField, FilterConfig } from "@/components/admin/admin-crud-list";
import { StatusBadge } from "@/components/admin/admin-crud-list";

interface Expertise {
  id: string;
  name: string;
  nameVi: string;
  category: string;
  categoryVi: string;
  icon: string;
  logo: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
}

const formatDate = (s: string) =>
  Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(s));

const columns: ColumnDef<Expertise>[] = [
  {
    key: "name",
    header: "Tên (VI / EN)",
    accessor: (r) => (
      <div className="space-y-0.5">
        <span className="font-medium text-white">{r.nameVi || "—"}</span>
        <br />
        <span className="text-xs text-slate-500">{r.name || "—"}</span>
      </div>
    ),
  },
  {
    key: "category",
    header: "Danh mục",
    accessor: (r) => (
      <div className="space-y-0.5">
        <span>{r.categoryVi || "—"}</span>
        <br />
        <span className="text-xs text-slate-500">{r.category || "—"}</span>
      </div>
    ),
  },
  {
    key: "icon",
    header: "Biểu tượng",
    accessor: (r) => <span className="text-xl">{r.icon || "—"}</span>,
    width: "80px",
  },
  {
    key: "isActive",
    header: "Trạng thái",
    accessor: (r) => <StatusBadge status={String(r.isActive)} />,
    width: "120px",
  },
  {
    key: "sortOrder",
    header: "Thứ tự",
    width: "80px",
  },
];

const formFields: FormField[] = [
  { type: "text", key: "name", label: "Tên (EN)", required: true },
  { type: "text", key: "nameVi", label: "Tên (VI)", required: true },
  { type: "text", key: "category", label: "Danh mục (EN)" },
  { type: "text", key: "categoryVi", label: "Danh mục (VI)" },
  { type: "text", key: "icon", label: "Biểu tượng", placeholder: "🎯" },
  { type: "image", key: "logo", label: "Logo" },
  { type: "number", key: "sortOrder", label: "Thứ tự", min: 0 },
  { type: "boolean", key: "isActive", label: "Hoạt động" },
];

const filters: FilterConfig[] = [
  { key: "search", label: "Tìm kiếm", type: "search", placeholder: "Tìm theo tên…" },
  {
    key: "isActive",
    label: "Trạng thái",
    type: "select",
    options: [
      { value: "true", label: "Hoạt động" },
      { value: "false", label: "Không hoạt động" },
    ],
  },
];

export default function AdminExpertisesPage() {
  return (
    <AdminCrudList<Expertise>
      apiPath="/api/admin/expertises"
      entityName="Kỹ năng"
      columns={columns}
      actions={[{ type: "edit" }, { type: "delete" }]}
      formFields={formFields}
      filters={filters}
      statusKey="isActive"
    />
  );
}
