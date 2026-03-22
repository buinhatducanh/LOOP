"use client";

import { AdminCrudList, type ColumnDef, type Action, type FormField, type FilterConfig } from "@/components/admin/admin-crud-list";

interface Service {
  id: string;
  slug: string;
  icon: string | null;
  title: string;
  shortDescription: string | null;
  category: string | null;
  startingPrice: number | null;
  deliveryTime: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  _count?: { projects: number };
}

const formatPrice = (n: number | null) =>
  n != null ? new Intl.NumberFormat("vi-VN").format(n) + " ₫" : "—";

const columns: ColumnDef<Service>[] = [
  { key: "title", header: "Dịch vụ" },
  { key: "category", header: "Danh mục" },
  {
    key: "startingPrice",
    header: "Giá từ",
    accessor: (row) => formatPrice(row.startingPrice),
  },
  { key: "deliveryTime", header: "Thời gian" },
  { key: "_count", header: "Dự án", accessor: (row) => row._count?.projects ?? 0 },
  { key: "isActive", header: "Trạng thái", accessor: (row) => row.isActive },
  { key: "sortOrder", header: "Thứ tự" },
];

const actions: Action<Service>[] = [{ type: "edit" }, { type: "delete" }];

const formFields: FormField[] = [
  { type: "text", key: "title", label: "Tiêu đề dịch vụ", required: true, placeholder: "Thiết kế Website" },
  { type: "slug", key: "slug", label: "Slug URL", sourceKey: "title" },
  { type: "text", key: "category", label: "Danh mục", placeholder: "web-design, app-dev..." },
  { type: "textarea", key: "shortDescription", label: "Mô tả ngắn", rows: 3 },
  { type: "textarea", key: "longDescription", label: "Mô tả chi tiết", rows: 6 },
  { type: "number", key: "startingPrice", label: "Giá khởi điểm (VNĐ)" },
  { type: "text", key: "deliveryTime", label: "Thời gian giao hàng", placeholder: "3-5 ngày làm việc" },
  { type: "text", key: "icon", label: "Icon (emoji)", placeholder: "🌐" },
  { type: "number", key: "sortOrder", label: "Thứ tự hiển thị" },
  { type: "boolean", key: "isActive", label: "Kích hoạt" },
];

const filters: FilterConfig[] = [
  { key: "search", label: "Tìm kiếm", type: "search", placeholder: "Tên dịch vụ..." } as FilterConfig,
  {
    key: "isActive",
    label: "Trạng thái",
    type: "select",
    placeholder: "— Chọn —",
    options: [
      { value: "true", label: "Hoạt động" },
      { value: "false", label: "Không hoạt động" },
    ],
  } as FilterConfig,
];

export default function ServicesPage() {
  return (
    <AdminCrudList<Service>
      apiPath="/api/admin/services"
      entityName="Dịch vụ"
      columns={columns}
      actions={actions}
      statusKey="isActive"
      formFields={formFields}
      filters={filters}
    />
  );
}
