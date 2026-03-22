"use client";

import { AdminCrudList } from "@/components/admin/admin-crud-list";
import type { ColumnDef, FormField, FilterConfig } from "@/components/admin/admin-crud-list";
import { StatusBadge } from "@/components/admin/admin-crud-list";

interface ServiceAttribute {
  id: string;
  slug: string;
  name: string;
  nameVi: string;
  description: string;
  category: string;
  categoryVi: string;
  icon: string;
  price: number;
  isRequired: boolean;
  sortOrder: number;
  isActive: boolean;
  tier: string;
  xpPoints: number;
  createdAt: string;
}

const fmtPrice = (n: number) =>
  Intl.NumberFormat("vi-VN").format(n) + " ₫";

const TIER_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  basic: { bg: "bg-slate-500/15", text: "text-slate-400", dot: "bg-slate-400" },
  advanced: { bg: "bg-purple-500/15", text: "text-purple-400", dot: "bg-purple-400" },
};

const TierBadge = ({ tier }: { tier: string }) => {
  const colors = TIER_COLORS[tier] ?? TIER_COLORS.basic;
  const label = tier === "basic" ? "Cơ bản" : tier === "advanced" ? "Nâng cao" : tier;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${colors.bg} ${colors.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${colors.dot}`} />
      {label}
    </span>
  );
};

const columns: ColumnDef<ServiceAttribute>[] = [
  {
    key: "name",
    header: "Tên tính năng",
    accessor: (r) => (
      <div className="space-y-0.5">
        <span className="font-medium text-white">{r.nameVi || "—"}</span>
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
    key: "category",
    header: "Danh mục",
    accessor: (r) => r.categoryVi || r.category || "—",
  },
  {
    key: "tier",
    header: "Cấp độ",
    accessor: (r) => <TierBadge tier={r.tier ?? "basic"} />,
    width: "100px",
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
  {
    key: "isRequired",
    header: "Bắt buộc",
    accessor: (r) => <StatusBadge status={String(r.isRequired)} />,
    width: "110px",
  },
  { key: "sortOrder", header: "Thứ tự", width: "80px" },
  {
    key: "isActive",
    header: "Trạng thái",
    accessor: (r) => <StatusBadge status={String(r.isActive)} />,
    width: "120px",
  },
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
  { type: "text", key: "nameVi", label: "Tên (VI)", required: true },
  { type: "text", key: "slug", label: "Slug" },
  { type: "text", key: "category", label: "Danh mục (EN)" },
  { type: "text", key: "categoryVi", label: "Danh mục (VI)" },
  { type: "textarea", key: "description", label: "Mô tả (EN)", rows: 3 },
  { type: "textarea", key: "descriptionVi", label: "Mô tả (VI)", rows: 3 },
  { type: "text", key: "icon", label: "Biểu tượng", placeholder: "⚙️" },
  { type: "number", key: "price", label: "Giá", min: 0 },
  {
    type: "select",
    key: "tier",
    label: "Cấp độ",
    options: [
      { value: "basic", label: "Cơ bản" },
      { value: "advanced", label: "Nâng cao" },
    ],
  },
  { type: "boolean", key: "isRequired", label: "Bắt buộc" },
  { type: "boolean", key: "isActive", label: "Hoạt động" },
  { type: "number", key: "sortOrder", label: "Thứ tự", min: 0 },
];

const filters: FilterConfig[] = [
  { key: "search", label: "Tìm kiếm", type: "search", placeholder: "Tìm theo tên…" },
  {
    key: "tier",
    label: "Cấp độ",
    type: "select",
    options: [
      { value: "basic", label: "Cơ bản" },
      { value: "advanced", label: "Nâng cao" },
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

export default function AdminServiceAttributesPage() {
  return (
    <AdminCrudList<ServiceAttribute>
      apiPath="/api/admin/service-attributes"
      entityName="Kho Tính Năng"
      columns={columns}
      actions={[{ type: "edit" }, { type: "delete" }]}
      formFields={formFields}
      filters={filters}
      statusKey="isActive"
    />
  );
}
