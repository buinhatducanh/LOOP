"use client";

import { AdminCrudList } from "@/components/admin/admin-crud-list";
import type { ColumnDef, FormField, FilterConfig } from "@/components/admin/admin-crud-list";
import { StatusBadge } from "@/components/admin/admin-crud-list";

interface Package {
  id: string;
  slug: string;
  name: string;
  nameVi: string;
  price: number;
  period: string;
  highlighted: boolean;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
}

const fmtPrice = (n: number) =>
  Intl.NumberFormat("vi-VN").format(n) + " ₫";

const columns: ColumnDef<Package>[] = [
  {
    key: "name",
    header: "Tên gói",
    accessor: (r) => (
      <div className="space-y-0.5">
        <span className="font-semibold text-white">{r.nameVi || "—"}</span>
        {r.nameVi && r.name && (
          <>
            <br />
            <span className="text-xs text-slate-500">{r.name}</span>
          </>
        )}
      </div>
    ),
  },
  {
    key: "price",
    header: "Giá",
    accessor: (r) =>
      r.price != null ? (
        <span className="font-medium text-white">{fmtPrice(r.price)}</span>
      ) : (
        <span className="text-slate-600">—</span>
      ),
    width: "140px",
  },
  { key: "period", header: "Thời hạn" },
  {
    key: "highlighted",
    header: "Nổi bật",
    accessor: (r) => <StatusBadge status={String(r.highlighted)} />,
    width: "110px",
  },
  {
    key: "isActive",
    header: "Trạng thái",
    accessor: (r) => <StatusBadge status={String(r.isActive)} />,
    width: "120px",
  },
  { key: "sortOrder", header: "Thứ tự", width: "80px" },
  {
    key: "createdAt",
    header: "Ngày tạo",
    accessor: (r) =>
      r.createdAt
        ? Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(r.createdAt))
        : "—",
    width: "120px",
  },
];

const formFields: FormField[] = [
  { type: "text", key: "name", label: "Tên (EN)", required: true },
  { type: "text", key: "nameVi", label: "Tên (VI)" },
  { type: "text", key: "slug", label: "Slug" },
  { type: "number", key: "price", label: "Giá", min: 0 },
  { type: "text", key: "period", label: "Thời hạn", placeholder: "tháng / năm" },
  { type: "boolean", key: "highlighted", label: "Nổi bật" },
  { type: "boolean", key: "isActive", label: "Hoạt động" },
  { type: "number", key: "sortOrder", label: "Thứ tự", min: 0 },
];

const filters: FilterConfig[] = [
  { key: "search", label: "Tìm kiếm", type: "search", placeholder: "Tìm theo tên…" },
  {
    key: "highlighted",
    label: "Nổi bật",
    type: "select",
    options: [
      { value: "true", label: "Nổi bật" },
      { value: "false", label: "Thường" },
    ],
  },
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

export default function AdminPackagesPage() {
  return (
    <AdminCrudList<Package>
      apiPath="/api/admin/packages"
      entityName="Gói dịch vụ"
      columns={columns}
      actions={[{ type: "edit" }, { type: "delete" }]}
      formFields={formFields}
      filters={filters}
      statusKey="isActive"
    />
  );
}
