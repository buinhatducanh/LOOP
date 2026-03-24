"use client";
import {
  AdminCrudList,
  type ColumnDef,
  type Action,
  type FormField,
  type FilterConfig,
} from "@/components/admin/admin-crud-list";

const formatPrice = (n: number) =>
  n > 0 ? new Intl.NumberFormat("vi-VN").format(n) + " ₫" : "—";

export default function AdminDomainPricesPage() {
  const columns: ColumnDef<any>[] = [
    { key: "extension", header: "Đuôi" },
    {
      key: "registrationPrice",
      header: "Giá đăng ký",
      cell: ({ value }) => <span className="font-medium text-white">{formatPrice(Number(value ?? 0))}</span>,
    },
    {
      key: "renewalPrice",
      header: "Giá gia hạn",
      cell: ({ value }) => <span className="text-slate-300">{formatPrice(Number(value ?? 0))}</span>,
    },
    { key: "period", header: "Chu kỳ" },
    { key: "periodVi", header: "Chu kỳ (VI)" },
    { key: "note", header: "Ghi chú" },
    {
      key: "isActive",
      header: "Trạng thái",
      cell: ({ value }) => (
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${value ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
          {value ? "Đang bật" : "Đã tắt"}
        </span>
      ),
    },
    { key: "sortOrder", header: "Thứ tự" },
  ];

  const actions: Action<any>[] = [{ type: "edit" }, { type: "delete" }];

  const formFields: FormField[] = [
    { key: "extension", label: "Đuôi (VD: .com)", type: "text" },
    { key: "registrationPrice", label: "Giá đăng ký (VND)", type: "number" },
    { key: "renewalPrice", label: "Giá gia hạn (VND)", type: "number" },
    { key: "period", label: "Chu kỳ", type: "text" },
    { key: "periodVi", label: "Chu kỳ (Tiếng Việt)", type: "text" },
    { key: "note", label: "Ghi chú", type: "text" },
    { key: "noteVi", label: "Ghi chú (Tiếng Việt)", type: "text" },
    { key: "sortOrder", label: "Thứ tự", type: "number" },
    { key: "isActive", label: "Kích hoạt", type: "boolean" },
  ];

  const filters: FilterConfig[] = [
    { key: "search", label: "Tìm kiếm", type: "search", placeholder: "Tìm theo đuôi..." },
    {
      key: "isActive",
      label: "Trạng thái",
      type: "select",
      options: [
        { value: "true", label: "Đang bật" },
        { value: "false", label: "Đã tắt" },
      ],
    },
  ];

  return (
    <AdminCrudList<any>
      apiPath="/api/admin/packages/domain-prices"
      entityName="Domain Prices"
      columns={columns}
      actions={actions}
      formFields={formFields}
      filters={filters}
    />
  );
}
