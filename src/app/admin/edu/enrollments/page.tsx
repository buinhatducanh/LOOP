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
  enrolled: "Đã ghi danh",
  in_progress: "Đang học",
  completed: "Hoàn thành",
  cancelled: "Đã hủy",
};

const STATUS_COLORS: Record<string, string> = {
  enrolled: "bg-blue-500/20 text-blue-400",
  in_progress: "bg-purple-500/20 text-purple-400",
  completed: "bg-green-500/20 text-green-400",
  cancelled: "bg-red-500/20 text-red-400",
};

export default function AdminEnrollmentsPage() {
  const columns: ColumnDef<any>[] = [
    {
      key: "id",
      header: "ID",
      cell: ({ value }) => (
        <span className="font-mono text-xs text-slate-500">{String(value).slice(0, 8)}...</span>
      ),
    },
    {
      key: "studentName",
      header: "Học viên",
      cell: ({ row }) => (
        <div>
          {row.user?.name && <p className="font-medium text-white">{row.user.name}</p>}
          {row.member?.name && <p className="text-sm text-slate-400">{row.member.name}</p>}
          {!row.user?.name && !row.member?.name && <span className="text-slate-500">—</span>}
        </div>
      ),
    },
    {
      key: "courseId",
      header: "Khóa học",
      cell: ({ row }) => (
        <div>
          {row.course?.titleVi && <p className="text-sm text-white">{row.course.titleVi}</p>}
          {row.course?.title && row.course.title !== row.course.titleVi && (
            <p className="text-xs text-slate-500">{row.course.title}</p>
          )}
          {!row.course && <span className="text-slate-500">—</span>}
        </div>
      ),
    },
    {
      key: "status",
      header: "Trạng thái",
      cell: ({ value }) => {
        const s = String(value ?? "enrolled");
        return (
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[s] ?? "bg-slate-500/20 text-slate-400"}`}>
            {STATUS_LABELS[s] ?? s}
          </span>
        );
      },
    },
    {
      key: "paidAmount",
      header: "Đã thanh toán",
      cell: ({ value }) => (
        <span className="font-medium text-green-400">{formatPrice(value as number)}</span>
      ),
    },
    {
      key: "progress",
      header: "Tiến độ",
      cell: ({ value }) => {
        const pct = Number(value ?? 0);
        return (
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-700">
              <div
                className="h-full rounded-full bg-purple-500"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-xs text-slate-400">{pct}%</span>
          </div>
        );
      },
    },
    {
      key: "enrolledAt",
      header: "Ngày ghi danh",
      cell: ({ value }) =>
        value ? VI_DATE.format(new Date(value as string)) : "—",
    },
  ];

  const actions: Action<any>[] = [
    { type: "edit", title: "Sửa" },
    { type: "delete", title: "Xóa" },
  ];

  const formFields: FormField[] = [
    { key: "courseId", label: "Khóa học", type: "text", required: true },
    { key: "userId", label: "User ID", type: "text" },
    { key: "memberId", label: "Member ID", type: "text" },
    { key: "status", label: "Trạng thái", type: "text" },
    { key: "progress", label: "Tiến độ (%)", type: "number" },
    { key: "completedLessons", label: "Số buổi hoàn thành", type: "number" },
    { key: "assigneeLpPercent", label: "% LP cho giảng viên", type: "number" },
  ];

  const filters: FilterConfig[] = [
    { key: "search", label: "Tìm kiếm", type: "search", placeholder: "Tìm theo tên học viên..." },
    {
      key: "status",
      label: "Trạng thái",
      type: "select",
      options: [
        { value: "enrolled", label: "Đã ghi danh" },
        { value: "in_progress", label: "Đang học" },
        { value: "completed", label: "Hoàn thành" },
        { value: "cancelled", label: "Đã hủy" },
      ],
    },
  ];

  return (
    <AdminCrudList<any>
      apiPath="/api/admin/edu/enrollments"
      entityName="Ghi danh"
      columns={columns}
      actions={actions}
      formFields={formFields}
      filters={filters}
      statusKey="status"
    />
  );
}
