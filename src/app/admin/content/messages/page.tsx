"use client";

import { AdminCrudList, type ColumnDef, type Action, type FormField } from "@/components/admin/admin-crud-list";

interface Message {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  service: string | null;
  message: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

const columns: ColumnDef<Message>[] = [
  { key: "name", header: "Khách hàng" },
  { key: "email", header: "Email" },
  { key: "service", header: "Dịch vụ quan tâm" },
  { key: "status", header: "Trạng thái" },
  { key: "createdAt", header: "Ngày gửi" },
];

const actions: Action<Message>[] = [
  { type: "view" },
  { type: "edit" },
  { type: "delete" },
];

const formFields: FormField[] = [
  { type: "text", key: "name", label: "Tên khách hàng", required: true },
  { type: "email", key: "email", label: "Email", required: true },
  { type: "text", key: "phone", label: "Điện thoại" },
  { type: "text", key: "service", label: "Dịch vụ quan tâm" },
  { type: "textarea", key: "message", label: "Nội dung", rows: 4 },
  {
    type: "select",
    key: "status",
    label: "Trạng thái",
    options: [
      { value: "new", label: "Mới" },
      { value: "read", label: "Đã đọc" },
      { value: "replied", label: "Đã trả lời" },
      { value: "archived", label: "Lưu trữ" },
    ],
  },
];

const detailFields = [
  { key: "name", label: "Tên" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Điện thoại" },
  { key: "service", label: "Dịch vụ quan tâm" },
  { key: "message", label: "Nội dung" },
  { key: "status", label: "Trạng thái" },
  { key: "createdAt", label: "Ngày gửi" },
  { key: "updatedAt", label: "Cập nhật" },
];

export default function MessagesPage() {
  return (
    <AdminCrudList<Message>
      apiPath="/api/admin/messages"
      entityName="Tin nhắn"
      columns={columns}
      actions={actions}
      statusKey="status"
      formFields={formFields}
      detailFields={detailFields}
      filters={[
        {
          key: "search",
          label: "Tìm kiếm",
          type: "search",
          placeholder: "Tên, email, nội dung...",
        },
        {
          key: "status",
          label: "Trạng thái",
          type: "select",
          options: [
            { value: "new", label: "Mới" },
            { value: "read", label: "Đã đọc" },
            { value: "replied", label: "Đã trả lời" },
            { value: "archived", label: "Lưu trữ" },
          ],
        },
      ]}
    />
  );
}
