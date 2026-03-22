"use client";

import { AdminCrudList } from "@/components/admin/admin-crud-list";
import type { ColumnDef, FilterConfig } from "@/components/admin/admin-crud-list";
import { StatusBadge } from "@/components/admin/admin-crud-list";

interface QuoteRequest {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  companyName: string;
  selectedItems: string;
  totalAmount: number;
  notes: string;
  status: string;
  createdAt: string;
}

const fmtPrice = (n: number) =>
  Intl.NumberFormat("vi-VN").format(n) + " ₫";

const columns: ColumnDef<QuoteRequest>[] = [
  { key: "customerName", header: "Khách hàng" },
  { key: "customerEmail", header: "Email" },
  { key: "customerPhone", header: "Điện thoại" },
  { key: "companyName", header: "Công ty" },
  {
    key: "totalAmount",
    header: "Tổng tiền",
    accessor: (r) =>
      r.totalAmount != null ? (
        <span className="font-medium text-white">{fmtPrice(r.totalAmount)}</span>
      ) : (
        <span className="text-slate-600">—</span>
      ),
    width: "140px",
  },
  {
    key: "status",
    header: "Trạng thái",
    accessor: (r) => <StatusBadge status={r.status ?? "new"} />,
    width: "120px",
  },
  {
    key: "createdAt",
    header: "Ngày gửi",
    accessor: (r) =>
      r.createdAt
        ? Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(r.createdAt))
        : "—",
    width: "120px",
  },
];

const filters: FilterConfig[] = [
  { key: "search", label: "Tìm kiếm", type: "search", placeholder: "Tìm theo tên, email…" },
  {
    key: "status",
    label: "Trạng thái",
    type: "select",
    options: [
      { value: "new", label: "Mới" },
      { value: "responded", label: "Đã phản hồi" },
      { value: "closed", label: "Đóng" },
    ],
  },
];

export default function AdminQuoteRequestsPage() {
  return (
    <AdminCrudList<QuoteRequest>
      apiPath="/api/admin/quote-requests"
      entityName="Yêu cầu Báo giá"
      columns={columns}
      actions={[{ type: "view" }]}
      formFields={[]}
      filters={filters}
      statusKey="status"
    />
  );
}
