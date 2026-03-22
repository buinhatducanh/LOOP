"use client";

import { AdminCrudList } from "@/components/admin/admin-crud-list";
import type { ColumnDef, FormField, FilterConfig } from "@/components/admin/admin-crud-list";
import { StatusBadge } from "@/components/admin/admin-crud-list";

interface WebTemplate {
  id: string;
  slug: string;
  name: string;
  nameVi: string;
  category: string;
  thumbnail: string;
  demoUrl: string;
  price: number;
  originalPrice: number;
  currency: string;
  technologies: string;
  deliveryTime: string;
  highlighted: boolean;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
}

const fmtPrice = (n: number) =>
  Intl.NumberFormat("vi-VN").format(n) + " ₫";

const columns: ColumnDef<WebTemplate>[] = [
  {
    key: "thumbnail",
    header: "Ảnh",
    accessor: (r) =>
      r.thumbnail ? (
        <img
          src={r.thumbnail}
          alt={r.nameVi || r.name}
          className="h-12 w-16 rounded-lg object-cover border border-slate-700"
        />
      ) : (
        <span className="text-slate-600">—</span>
      ),
    width: "80px",
  },
  {
    key: "name",
    header: "Tên giao diện",
    accessor: (r) => (
      <div className="space-y-0.5">
        <span className="font-semibold text-white">{r.nameVi || r.name || "—"}</span>
        {(r.nameVi && r.name) && (
          <br />
        )}
        {(r.nameVi && r.name) && (
          <span className="text-xs text-slate-500">{r.name}</span>
        )}
      </div>
    ),
  },
  { key: "category", header: "Danh mục" },
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
  { type: "image", key: "thumbnail", label: "Ảnh đại diện" },
  { type: "text", key: "category", label: "Danh mục" },
  { type: "text", key: "demoUrl", label: "URL Demo", placeholder: "https://" },
  { type: "number", key: "price", label: "Giá", required: true, min: 0 },
  { type: "number", key: "originalPrice", label: "Giá gốc", min: 0 },
  { type: "text", key: "currency", label: "Đơn vị tiền tệ", placeholder: "VND" },
  { type: "text", key: "deliveryTime", label: "Thời gian giao hàng" },
  { type: "textarea", key: "technologies", label: "Công nghệ", rows: 3, placeholder: "React, Node.js, PostgreSQL, ..." },
  { type: "boolean", key: "highlighted", label: "Nổi bật" },
  { type: "number", key: "sortOrder", label: "Thứ tự", min: 0 },
  { type: "boolean", key: "isActive", label: "Hoạt động" },
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

export default function AdminWebTemplatesPage() {
  return (
    <AdminCrudList<WebTemplate>
      apiPath="/api/admin/web-templates"
      entityName="Kho Giao Diện"
      columns={columns}
      actions={[{ type: "edit" }, { type: "delete" }]}
      formFields={formFields}
      filters={filters}
      statusKey="isActive"
    />
  );
}
