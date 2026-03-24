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
  new Intl.NumberFormat("vi-VN").format(n ?? 0) + " ₫";

const STATUS_LABELS: Record<string, string> = {
  draft: "Nháp",
  published: "Đã xuất bản",
  archived: "Lưu trữ",
};

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-slate-500/20 text-slate-400",
  published: "bg-green-500/20 text-green-400",
  archived: "bg-red-500/20 text-red-400",
};

export default function AdminCoursesPage() {
  const columns: ColumnDef<any>[] = [
    {
      key: "titleVi",
      header: "Tên khóa học",
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-white">{row.titleVi ?? "—"}</p>
          {row.title && row.title !== row.titleVi && (
            <p className="text-xs text-slate-500">{row.title}</p>
          )}
        </div>
      ),
    },
    {
      key: "instructorId",
      header: "Giảng viên",
      cell: ({ value }) =>
        value ? (
          <span className="text-sm text-purple-400">Đã gán</span>
        ) : (
          <span className="text-xs text-red-400">Chưa gán</span>
        ),
    },
    {
      key: "price",
      header: "Học phí",
      cell: ({ value }) => (
        <span className="font-medium text-white">{formatPrice(value as number)}</span>
      ),
    },
    {
      key: "lpReward",
      header: "LP thưởng",
      cell: ({ value }) => (
        <span className="text-sm text-amber-400">
          {value != null ? `${Number(value)} LP` : "—"}
        </span>
      ),
    },
    {
      key: "isPublished",
      header: "Trạng thái",
      cell: ({ value }) => {
        const s = value ? "published" : "draft";
        return (
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[s] ?? "bg-slate-500/20 text-slate-400"}`}>
            {STATUS_LABELS[s] ?? s}
          </span>
        );
      },
    },
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
    { key: "title", label: "Tên (EN)", type: "text", required: true },
    { key: "titleVi", label: "Tên (VI)", type: "text", required: true },
    { key: "description", label: "Mô tả", type: "textarea" },
    { key: "descriptionVi", label: "Mô tả (VI)", type: "textarea" },
    { key: "instructorId", label: "Giảng viên", type: "text" },
    { key: "price", label: "Học phí (VND)", type: "number" },
    { key: "lpReward", label: "LP thưởng", type: "number" },
    { key: "thumbnail", label: "Hình thumbnail", type: "image" },
    { key: "isPublished", label: "Xuất bản", type: "boolean" },
  ];

  const filters: FilterConfig[] = [
    { key: "search", label: "Tìm kiếm", type: "search", placeholder: "Tìm theo tên..." },
    {
      key: "isPublished",
      label: "Trạng thái",
      type: "select",
      options: [
        { value: "true", label: "Đã xuất bản" },
        { value: "false", label: "Nháp" },
      ],
    },
  ];

  return (
    <AdminCrudList<any>
      apiPath="/api/admin/edu/courses"
      entityName="Khóa học"
      columns={columns}
      actions={actions}
      formFields={formFields}
      filters={filters}
      statusKey="isPublished"
    />
  );
}
