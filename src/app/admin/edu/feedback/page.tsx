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

function StarRating({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={`text-sm ${star <= value ? "text-amber-400" : "text-slate-600"}`}
        >
          ★
        </span>
      ))}
      <span className="ml-1 text-xs text-slate-400">({value}/5)</span>
    </div>
  );
}

export default function AdminFeedbackPage() {
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
          {!row.user?.name && !row.member?.name && (
            <span className="text-slate-500">—</span>
          )}
        </div>
      ),
    },
    {
      key: "courseTitle",
      header: "Khóa học",
      cell: ({ row }) =>
        row.course?.titleVi ? (
          <p className="text-sm text-white">{row.course.titleVi}</p>
        ) : (
          <span className="text-slate-500">—</span>
        ),
    },
    {
      key: "rating",
      header: "Đánh giá",
      cell: ({ value }) =>
        value ? <StarRating value={Number(value)} /> : <span className="text-slate-500">—</span>,
    },
    {
      key: "comment",
      header: "Bình luận",
      cell: ({ value }) =>
        value ? (
          <p className="max-w-xs truncate text-sm text-slate-300">{String(value)}</p>
        ) : (
          <span className="text-slate-500">Không có</span>
        ),
    },
    {
      key: "createdAt",
      header: "Ngày gửi",
      cell: ({ value }) =>
        value ? VI_DATE.format(new Date(value as string)) : "—",
    },
  ];

  const actions: Action<any>[] = [
    { type: "edit", title: "Sửa" },
    { type: "delete", title: "Xóa" },
  ];

  const formFields: FormField[] = [
    { key: "userId", label: "User ID", type: "text" },
    { key: "memberId", label: "Member ID", type: "text" },
    { key: "courseId", label: "Khóa học ID", type: "text" },
    { key: "lessonId", label: "Bài học ID", type: "text" },
    { key: "rating", label: "Đánh giá (1-5)", type: "number" },
    { key: "comment", label: "Bình luận", type: "textarea" },
  ];

  const filters: FilterConfig[] = [
    { key: "search", label: "Tìm kiếm", type: "search", placeholder: "Tìm học viên, khóa học..." },
    {
      key: "rating",
      label: "Số sao",
      type: "select",
      options: [
        { value: "5", label: "★★★★★ (5 sao)" },
        { value: "4", label: "★★★★☆ (4 sao)" },
        { value: "3", label: "★★★☆☆ (3 sao)" },
        { value: "2", label: "★★☆☆☆ (2 sao)" },
        { value: "1", label: "★☆☆☆☆ (1 sao)" },
      ],
    },
  ];

  return (
    <AdminCrudList<any>
      apiPath="/api/admin/edu/feedback"
      entityName="Phản hồi"
      columns={columns}
      actions={actions}
      formFields={formFields}
      filters={filters}
    />
  );
}
