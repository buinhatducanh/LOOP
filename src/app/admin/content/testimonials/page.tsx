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

export default function AdminTestimonialsPage() {
  const columns: ColumnDef<any>[] = [
    { key: "name", header: "Tên" },
    { key: "role", header: "Vai trò" },
    { key: "company", header: "Công ty" },
    {
      key: "avatar",
      header: "Ảnh đại diện",
      cell: ({ value }) =>
        value ? (
          <img src={String(value)} alt="" className="h-8 w-8 rounded-full object-cover" />
        ) : (
          <span className="text-slate-500">—</span>
        ),
    },
    {
      key: "rating",
      header: "Đánh giá",
      cell: ({ value }) => (
        <div className="flex items-center gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <span
              key={i}
              className={i < (Number(value) || 0) ? "text-yellow-400" : "text-slate-600"}
            >★</span>
          ))}
        </div>
      ),
    },
    {
      key: "isActive",
      header: "Trạng thái",
      cell: ({ value }) =>
        value ? (
          <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-xs font-medium text-green-400">Hoạt động</span>
        ) : (
          <span className="rounded-full bg-slate-500/20 px-2 py-0.5 text-xs font-medium text-slate-400">Tắt</span>
        ),
    },
    { key: "sortOrder", header: "Thứ tự" },
    {
      key: "createdAt",
      header: "Ngày tạo",
      cell: ({ value }) =>
        value ? VI_DATE.format(new Date(value as string)) : "—",
    },
  ];

  const actions: Action<any>[] = [
    { type: "edit", title: "Sửa" },
    { type: "delete", title: "Xóa" },
  ];

  const formFields: FormField[] = [
    { key: "name", label: "Tên", type: "text", required: true },
    { key: "role", label: "Vai trò", type: "text" },
    { key: "company", label: "Công ty", type: "text" },
    { key: "avatar", label: "Ảnh đại diện", type: "image" },
    { key: "rating", label: "Đánh giá (1-5)", type: "number" },
    { key: "content", label: "Nội dung", type: "textarea" },
    { key: "sortOrder", label: "Thứ tự", type: "number" },
    { key: "isActive", label: "Hoạt động", type: "boolean" },
  ];

  const filters: FilterConfig[] = [
    { key: "search", label: "Tìm kiếm", type: "search", placeholder: "Tìm theo tên, công ty..." },
    {
      key: "isActive",
      label: "Trạng thái",
      type: "select",
      options: [
        { value: "true", label: "Hoạt động" },
        { value: "false", label: "Tắt" },
      ],
    },
  ];

  return (
    <AdminCrudList<any>
      apiPath="/api/admin/testimonials"
      entityName="Đánh giá"
      columns={columns}
      actions={actions}
      formFields={formFields}
      filters={filters}
      statusKey="isActive"
    />
  );
}
