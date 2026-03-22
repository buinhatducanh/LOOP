"use client";
import {
  AdminCrudList,
  type ColumnDef,
  type Action,
  type FormField,
  type FilterConfig,
} from "@/components/admin/admin-crud-list";

const VI_DATE = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const formatPrice = (n: number) =>
  new Intl.NumberFormat("vi-VN").format(n) + " ₫";

const STATUS_LABELS: Record<string, string> = {
  pending: "Chờ xử lý",
  confirmed: "Đã xác nhận",
  in_progress: "Đang thực hiện",
  completed: "Hoàn thành",
  cancelled: "Đã hủy",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-400",
  confirmed: "bg-blue-500/20 text-blue-400",
  in_progress: "bg-purple-500/20 text-purple-400",
  completed: "bg-green-500/20 text-green-400",
  cancelled: "bg-red-500/20 text-red-400",
};

const PAYMENT_LABELS: Record<string, string> = {
  unpaid: "Chưa thanh toán",
  partial: "Thanh toán một phần",
  paid: "Đã thanh toán",
  refunded: "Đã hoàn tiền",
};

const PAYMENT_COLORS: Record<string, string> = {
  unpaid: "bg-red-500/20 text-red-400",
  partial: "bg-yellow-500/20 text-yellow-400",
  paid: "bg-green-500/20 text-green-400",
  refunded: "bg-slate-500/20 text-slate-400",
};

export default function AdminOrdersPage() {
  const columns: ColumnDef<any>[] = [
    { key: "orderNumber", header: "Mã đơn" },
    { key: "customerName", header: "Khách hàng" },
    { key: "customerEmail", header: "Email" },
    {
      key: "status",
      header: "Trạng thái",
      cell: ({ value }) => {
        const s = String(value ?? "pending");
        return (
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[s] ?? "bg-slate-500/20 text-slate-400"}`}>
            {STATUS_LABELS[s] ?? s}
          </span>
        );
      },
    },
    {
      key: "paymentStatus",
      header: "Thanh toán",
      cell: ({ value }) => {
        const s = String(value ?? "unpaid");
        return (
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${PAYMENT_COLORS[s] ?? "bg-slate-500/20 text-slate-400"}`}>
            {PAYMENT_LABELS[s] ?? s}
          </span>
        );
      },
    },
    {
      key: "totalAmount",
      header: "Tổng tiền",
      cell: ({ value }) => (
        <span className="font-medium text-white">{formatPrice(Number(value ?? 0))}</span>
      ),
    },
    {
      key: "createdAt",
      header: "Ngày tạo",
      cell: ({ value }) =>
        value ? VI_DATE.format(new Date(value as string)) : "—",
    },
  ];

  const actions: Action<any>[] = [{ type: "view" }];

  const formFields: FormField[] = [
    { key: "orderNumber", label: "Mã đơn", type: "text" },
    { key: "customerName", label: "Tên khách hàng", type: "text" },
    { key: "customerEmail", label: "Email", type: "text" },
    { key: "customerPhone", label: "Số điện thoại", type: "text" },
    { key: "companyName", label: "Công ty", type: "text" },
    { key: "status", label: "Trạng thái", type: "text" },
    { key: "paymentStatus", label: "Thanh toán", type: "text" },
    { key: "totalAmount", label: "Tổng tiền", type: "text" },
    { key: "createdAt", label: "Ngày tạo", type: "text" },
  ];

  const filters: FilterConfig[] = [
    { key: "search", label: "Tìm kiếm", type: "search", placeholder: "Tìm theo tên, email..." },
    {
      key: "status",
      label: "Trạng thái",
      type: "select",
      options: [
        { value: "pending", label: "Chờ xử lý" },
        { value: "confirmed", label: "Đã xác nhận" },
        { value: "in_progress", label: "Đang thực hiện" },
        { value: "completed", label: "Hoàn thành" },
        { value: "cancelled", label: "Đã hủy" },
      ],
    },
    {
      key: "paymentStatus",
      label: "Thanh toán",
      type: "select",
      options: [
        { value: "unpaid", label: "Chưa thanh toán" },
        { value: "partial", label: "Thanh toán một phần" },
        { value: "paid", label: "Đã thanh toán" },
        { value: "refunded", label: "Đã hoàn tiền" },
      ],
    },
  ];

  return (
    <AdminCrudList<any>
      apiPath="/api/admin/orders"
      entityName="Đơn hàng"
      columns={columns}
      actions={actions}
      formFields={formFields}
      filters={filters}
      statusKey="status"
    />
  );
}
