"use client";

import { AdminCrudList } from "@/components/admin/admin-crud-list";
import type { ColumnDef, FormField, FilterConfig } from "@/components/admin/admin-crud-list";
import { StatusBadge } from "@/components/admin/admin-crud-list";

interface Website {
  id: string;
  domain: string;
  name: string;
  status: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  description: string;
  createdAt: string;
}

const columns: ColumnDef<Website>[] = [
  { key: "name", header: "Tên website" },
  { key: "domain", header: "Domain" },
  { key: "customerName", header: "Khách hàng" },
  { key: "customerEmail", header: "Email KH" },
  {
    key: "status",
    header: "Trạng thái",
    accessor: (r) => <StatusBadge status={r.status ?? "active"} />,
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
  { type: "text", key: "domain", label: "Domain", placeholder: "example.com" },
  { type: "text", key: "name", label: "Tên website" },
  { type: "text", key: "customerName", label: "Tên khách hàng" },
  { type: "text", key: "customerEmail", label: "Email khách hàng" },
  {
    type: "select",
    key: "status",
    label: "Trạng thái",
    options: [
      { value: "active", label: "Hoạt động" },
      { value: "inactive", label: "Không hoạt động" },
      { value: "suspended", label: "Tạm ngưng" },
      { value: "expired", label: "Hết hạn" },
    ],
  },
  { type: "textarea", key: "description", label: "Mô tả", rows: 3 },
];

const filters: FilterConfig[] = [
  { key: "search", label: "Tìm kiếm", type: "search", placeholder: "Tìm theo tên, domain…" },
  {
    key: "status",
    label: "Trạng thái",
    type: "select",
    options: [
      { value: "active", label: "Hoạt động" },
      { value: "inactive", label: "Không hoạt động" },
      { value: "suspended", label: "Tạm ngưng" },
      { value: "expired", label: "Hết hạn" },
    ],
  },
];

export default function AdminWebsitesPage() {
  return (
    <AdminCrudList<Website>
      apiPath="/api/admin/customer-websites"
      entityName="Website KH"
      columns={columns}
      actions={[{ type: "view" }, { type: "edit" }]}
      formFields={formFields}
      filters={filters}
      statusKey="status"
    />
  );
}
