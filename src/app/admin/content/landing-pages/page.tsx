"use client";

import { AdminCrudList } from "@/components/admin/admin-crud-list";
import type { ColumnDef, FormField, FilterConfig } from "@/components/admin/admin-crud-list";
import { StatusBadge } from "@/components/admin/admin-crud-list";

interface LandingPage {
  id: string;
  slug: string;
  name: string;
  locale: string;
  isPublished: boolean;
  isDefault: boolean;
  seoTitle: string;
  seoDesc: string;
  seoKeywords: string;
  createdAt: string;
}

const columns: ColumnDef<LandingPage>[] = [
  { key: "name", header: "Tên trang" },
  { key: "slug", header: "Slug" },
  {
    key: "locale",
    header: "Ngôn ngữ",
    accessor: (r) => <StatusBadge status={r.locale} />,
    width: "100px",
  },
  {
    key: "isPublished",
    header: "Xuất bản",
    accessor: (r) => <StatusBadge status={String(r.isPublished)} />,
    width: "120px",
  },
  {
    key: "isDefault",
    header: "Mặc định",
    accessor: (r) =>
      r.isDefault ? (
        <span className="inline-flex items-center gap-1 rounded-full bg-cyan-500/15 px-2 py-0.5 text-xs font-medium text-cyan-400">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
          Mặc định
        </span>
      ) : (
        <span className="text-slate-600">—</span>
      ),
    width: "110px",
  },
  { key: "seoTitle", header: "SEO Title" },
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
  { type: "text", key: "slug", label: "Slug", required: true },
  { type: "text", key: "name", label: "Tên trang", required: true },
  {
    type: "select",
    key: "locale",
    label: "Ngôn ngữ",
    required: true,
    options: [
      { value: "vi", label: "Tiếng Việt" },
      { value: "en", label: "English" },
    ],
  },
  { type: "boolean", key: "isPublished", label: "Xuất bản" },
  { type: "boolean", key: "isDefault", label: "Trang mặc định" },
  { type: "text", key: "seoTitle", label: "SEO Title" },
  { type: "textarea", key: "seoDesc", label: "SEO Description", rows: 3 },
  { type: "text", key: "seoKeywords", label: "SEO Keywords", placeholder: "keyword1, keyword2, ..." },
];

const filters: FilterConfig[] = [
  { key: "search", label: "Tìm kiếm", type: "search", placeholder: "Tìm theo tên, slug…" },
  {
    key: "locale",
    label: "Ngôn ngữ",
    type: "select",
    options: [
      { value: "vi", label: "Tiếng Việt" },
      { value: "en", label: "English" },
    ],
  },
  {
    key: "isPublished",
    label: "Xuất bản",
    type: "select",
    options: [
      { value: "true", label: "Đã xuất bản" },
      { value: "false", label: "Chưa xuất bản" },
    ],
  },
];

export default function AdminLandingPagesPage() {
  return (
    <AdminCrudList<LandingPage>
      apiPath="/api/admin/landing-pages"
      entityName="Landing Pages"
      columns={columns}
      actions={[{ type: "edit" }, { type: "delete" }]}
      formFields={formFields}
      filters={filters}
      statusKey="isPublished"
    />
  );
}
