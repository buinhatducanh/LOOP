"use client";

import { AdminCrudList } from "@/components/admin/admin-crud-list";
import type { ColumnDef, FormField, FilterConfig } from "@/components/admin/admin-crud-list";
import { StatusBadge } from "@/components/admin/admin-crud-list";

interface HomeSlider {
  id: string;
  image: string;
  title: string;
  subtitle: string;
  link: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
}

const columns: ColumnDef<HomeSlider>[] = [
  {
    key: "image",
    header: "Hình ảnh",
    accessor: (r) =>
      r.image ? (
        <img
          src={r.image}
          alt={r.title}
          className="h-12 w-20 rounded-lg object-cover border border-slate-700"
        />
      ) : (
        <span className="text-slate-600">—</span>
      ),
    width: "100px",
  },
  { key: "title", header: "Tiêu đề" },
  { key: "subtitle", header: "Mô tả phụ" },
  {
    key: "link",
    header: "Liên kết",
    accessor: (r) =>
      r.link ? (
        <a
          href={r.link}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 hover:underline"
        >
          Mở liên kết
        </a>
      ) : (
        <span className="text-slate-600">—</span>
      ),
  },
  {
    key: "sortOrder",
    header: "Thứ tự",
    width: "80px",
  },
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
  { type: "image", key: "image", label: "Hình ảnh" },
  { type: "text", key: "title", label: "Tiêu đề", required: true },
  { type: "text", key: "subtitle", label: "Mô tả phụ" },
  { type: "text", key: "link", label: "Liên kết", placeholder: "https://" },
  { type: "number", key: "sortOrder", label: "Thứ tự", min: 0 },
  { type: "boolean", key: "isActive", label: "Hoạt động" },
];

const filters: FilterConfig[] = [
  { key: "search", label: "Tìm kiếm", type: "search", placeholder: "Tìm theo tiêu đề…" },
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

export default function AdminHomeSlidersPage() {
  return (
    <AdminCrudList<HomeSlider>
      apiPath="/api/admin/home-sliders"
      entityName="Slider Trang chủ"
      columns={columns}
      actions={[{ type: "edit" }, { type: "delete" }]}
      formFields={formFields}
      filters={filters}
      statusKey="isActive"
    />
  );
}
