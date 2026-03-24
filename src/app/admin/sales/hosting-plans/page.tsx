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

const IS_ACTIVE = [
  { value: "true", label: "Đang bật" },
  { value: "false", label: "Đã tắt" },
];

export default function AdminHostingPlansPage() {
  const columns: ColumnDef<any>[] = [
    { key: "name", header: "Tên gói" },
    { key: "period", header: "Chu kỳ" },
    { key: "price", header: "Giá", cell: ({ value }) => <span className="font-medium text-white">{formatPrice(Number(value ?? 0))}</span> },
    { key: "storage", header: "Lưu trữ" },
    { key: "bandwidth", header: "Băng thông" },
    {
      key: "isActive",
      header: "Trạng thái",
      cell: ({ value }) => (
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${value ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
          {value ? "Đang bật" : "Đã tắt"}
        </span>
      ),
    },
  ];

  const actions: Action<any>[] = [{ type: "edit" }, { type: "delete" }];

  const formFields: FormField[] = [
    { key: "name", label: "Tên gói", type: "text" },
    { key: "period", label: "Chu kỳ", type: "text" },
    { key: "price", label: "Giá (VND)", type: "number" },
    { key: "storage", label: "Lưu trữ", type: "text" },
    { key: "bandwidth", label: "Băng thông", type: "text" },
    { key: "features", label: "Tính năng", type: "textarea" },
    { key: "isActive", label: "Kích hoạt", type: "boolean" },
  ];

  const filters: FilterConfig[] = [
    { key: "search", label: "Tìm kiếm", type: "search", placeholder: "Tìm theo tên..." },
    { key: "isActive", label: "Trạng thái", type: "select", options: IS_ACTIVE },
  ];

  return (
    <AdminCrudList<any>
      apiPath="/api/admin/packages/hosting-plans"
      entityName="Hosting Plans"
      columns={columns}
      actions={actions}
      formFields={formFields}
      filters={filters}
    />
  );
}
