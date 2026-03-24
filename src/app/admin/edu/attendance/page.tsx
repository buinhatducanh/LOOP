"use client";
import React from "react";
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
  hour: "2-digit",
  minute: "2-digit",
});

const STATUS_LABELS: Record<string, string> = {
  present: "Có mặt",
  absent: "Vắng",
  late: "Muộn",
};

const STATUS_COLORS: Record<string, string> = {
  present: "bg-green-500/20 text-green-400",
  absent: "bg-red-500/20 text-red-400",
  late: "bg-yellow-500/20 text-yellow-400",
};

export default function AdminAttendancePage() {
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
          {row.enrollment?.user?.name && (
            <p className="font-medium text-white">{row.enrollment.user.name}</p>
          )}
          {row.enrollment?.member?.name && (
            <p className="text-sm text-slate-400">{row.enrollment.member.name}</p>
          )}
          {!row.enrollment?.user?.name && !row.enrollment?.member?.name && (
            <span className="text-slate-500">—</span>
          )}
        </div>
      ),
    },
    {
      key: "lessonTitle",
      header: "Bài học",
      cell: ({ row }) => (
        <div>
          {row.lesson?.titleVi && <p className="text-sm text-white">{row.lesson.titleVi}</p>}
          {row.lesson?.title && row.lesson.title !== row.lesson.titleVi && (
            <p className="text-xs text-slate-500">{row.lesson.title}</p>
          )}
        </div>
      ),
    },
    {
      key: "status",
      header: "Trạng thái",
      cell: ({ value }) => {
        const s = String(value ?? "absent");
        return (
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[s] ?? "bg-slate-500/20 text-slate-400"}`}>
            {STATUS_LABELS[s] ?? s}
          </span>
        );
      },
    },
    {
      key: "note",
      header: "Ghi chú",
      cell: ({ value }): React.ReactNode => String(value ?? ""),
    },
    {
      key: "checkedInAt",
      header: "Giờ điểm danh",
      cell: ({ value }) =>
        value ? VI_DATE.format(new Date(value as string)) : "—",
    },
  ];

  const actions: Action<any>[] = [
    { type: "edit", title: "Sửa" },
  ];

  const formFields: FormField[] = [
    { key: "enrollmentId", label: "Enrollment ID", type: "text", required: true },
    { key: "lessonId", label: "Lesson ID", type: "text", required: true },
    {
      key: "status",
      label: "Trạng thái",
      type: "select",
      required: true,
      options: [
        { value: "present", label: "Có mặt" },
        { value: "absent", label: "Vắng" },
        { value: "late", label: "Muộn" },
      ],
    },
    { key: "note", label: "Ghi chú", type: "textarea" },
  ];

  const filters: FilterConfig[] = [
    { key: "search", label: "Tìm kiếm", type: "search", placeholder: "Tìm học viên, bài học..." },
    {
      key: "status",
      label: "Trạng thái",
      type: "select",
      options: [
        { value: "present", label: "Có mặt" },
        { value: "absent", label: "Vắng" },
        { value: "late", label: "Muộn" },
      ],
    },
  ];

  return (
    <AdminCrudList<any>
      apiPath="/api/admin/edu/attendance"
      entityName="Điểm danh"
      columns={columns}
      actions={actions}
      formFields={formFields}
      filters={filters}
      statusKey="status"
    />
  );
}
