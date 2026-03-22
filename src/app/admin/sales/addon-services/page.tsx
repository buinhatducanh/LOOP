"use client";

import { AdminCrudList } from "@/components/admin/admin-crud-list";
import type { ColumnDef, FormField, FilterConfig } from "@/components/admin/admin-crud-list";
import { StatusBadge } from "@/components/admin/admin-crud-list";

interface AddonService {
  id: string;
  slug: string;
  name: string;
  nameVi: string;
  description: string;
  icon: string;
  type: string;
  price: number;
  billingPeriod: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
}

const fmtPrice = (n: number) =>
  Intl.NumberFormat("vi-VN").format(n) + " ₫";

const columns: ColumnDef<AddonService>[] = [
  {
    key: "icon",
    header: "Dịch vụ",
    accessor: (r) => (
      <div className="flex items-center gap-2">
        <span className="text-xl">{r.icon || "—"}</span>
        <div className="space-y-0.5">
          <span className="font-medium text-white">{r.nameVi || r.name || "—"}</span>
          {r.nameVi && r.name && (
            <>
              <br />
              <span className="text-xs text-slate-500">{r.name}</span>
            </>
          )}
        </div>
      </div>
    ),
  },
  {
    key: "type",
    header: "Loại",
    accessor: (r) => <StatusBadge status={r.type ?? "one_time"} />,
    width: "110px",
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
  { key: "billingPeriod", header: "Kỳ thanh toán" },
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
  { type: "textarea", key: "description", label: "Mô tả", rows: 3 },
  { type: "text", key: "icon", label: "Biểu tượng", placeholder: "⚡" },
  {
    type: "select",
    key: "type",
    label: "Loại thanh toán",
    required: true,
    options: [
      { value: "one_time", label: "Một lần" },
      { value: "recurring", label: "Định kỳ" },
    ],
  },
  { type: "number", key: "price", label: "Giá", min: 0 },
  { type: "text", key: "billingPeriod", label: "Kỳ thanh toán", placeholder: "tháng / năm" },
  { type: "boolean", key: "isActive", label: "Hoạt động" },
  { type: "number", key: "sortOrder", label: "Thứ tự", min: 0 },
];

const filters: FilterConfig[] = [
  { key: "search", label: "Tìm kiếm", type: "search", placeholder: "Tìm theo tên…" },
  {
    key: "type",
    label: "Loại",
    type: "select",
    options: [
      { value: "one_time", label: "Một lần" },
      { value: "recurring", label: "Định kỳ" },
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

export default function AdminAddonServicesPage() {
  return (
    <AdminCrudList<AddonService>
      apiPath="/api/admin/addon-services"
      entityName="Dịch vụ Rời"
      columns={columns}
      actions={[{ type: "edit" }, { type: "delete" }]}
      formFields={formFields}
      filters={filters}
      statusKey="isActive"
    />
  );
}
