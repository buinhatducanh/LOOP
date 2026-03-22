"use client";

import { AdminCrudList, type ColumnDef, type Action, type FormField } from "@/components/admin/admin-crud-list";

// ─── Types ────────────────────────────────────────────────────────────────────────

interface User {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
  role: string;
  isActive: boolean;
  accountType: string;
  createdAt: string;
  updatedAt: string;
  userRoles?: Array<{ role: { name: string; displayName: string } }>;
  teamMember?: { id: string; name: string; role: string; image: string } | null;
}

// ─── Columns ─────────────────────────────────────────────────────────────────────

const columns: ColumnDef<User>[] = [
  { key: "name", header: "Tên" },
  { key: "email", header: "Email" },
  { key: "accountType", header: "Loại tài khoản" },
  { key: "userRoles", header: "Vai trò", accessor: (row) =>
    row.userRoles?.map((ur) => ur.role.displayName).join(", ") || "—" },
  { key: "isActive", header: "Trạng thái", accessor: (row) => row.isActive },
  { key: "createdAt", header: "Ngày tạo" },
];

const actions: Action<User>[] = [
  { type: "edit" },
  { type: "delete" },
];

// ─── Form Fields ────────────────────────────────────────────────────────────────

const formFields: FormField[] = [
  { type: "text", key: "name", label: "Tên", required: true, placeholder: "Nguyễn Văn A" },
  { type: "email", key: "email", label: "Email", required: true, placeholder: "email@loop.vn" },
  { type: "password", key: "password", label: "Mật khẩu" },
  {
    type: "select",
    key: "accountType",
    label: "Loại tài khoản",
    options: [
      { value: "staff", label: "Nhân viên" },
      { value: "customer", label: "Khách hàng" },
    ],
  },
  {
    type: "boolean",
    key: "isActive",
    label: "Kích hoạt",
  },
];

// ─── Detail fields ────────────────────────────────────────────────────────────

const detailFields = [
  { key: "email", label: "Email" },
  { key: "name", label: "Tên" },
  { key: "accountType", label: "Loại tài khoản" },
  { key: "role", label: "Vai trò" },
  { key: "isActive", label: "Trạng thái" },
  { key: "createdAt", label: "Ngày tạo" },
  { key: "updatedAt", label: "Cập nhật cuối" },
  { key: "teamMember", label: "Team Member", render: (v: unknown) => v ? String(v) : "—" },
];

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function StaffUsersPage() {
  return (
    <AdminCrudList<User>
      apiPath="/api/admin/users"
      entityName="Tài khoản"
      columns={columns}
      actions={actions}
      statusKey="isActive"
      formFields={formFields}
      detailFields={detailFields}
      filters={[
        {
          key: "search",
          label: "Tìm kiếm",
          type: "search",
          placeholder: "Tên, email...",
        },
        {
          key: "accountType",
          label: "Loại",
          type: "select",
          options: [
            { value: "staff", label: "Nhân viên" },
            { value: "customer", label: "Khách hàng" },
          ],
        },
      ]}
    />
  );
}
