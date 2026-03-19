"use client";

import { useEffect, useState, useCallback } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { DataTable } from "../../components/data-table";
import { Plus, Pencil, Trash2, Shield, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

interface UserData {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
  userRoles: { role: { name: string; displayName: string } }[];
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [search, setSearch] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchData = useCallback(async (page = 1, searchQuery = "") => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (searchQuery) params.set("search", searchQuery);

      const res = await fetch(`/api/admin/users?${params}`);
      const data = await res.json();
      setUsers(data.data || []);
      setPagination(data.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 });
    } catch (e) {
      console.error(e);
      toast.error("Không thể tải danh sách người dùng");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function toggleActive(id: string, isActive: boolean) {
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Không thể cập nhật trạng thái");
        return;
      }
      toast.success(isActive ? "Đã vô hiệu hoá tài khoản" : "Đã kích hoạt tài khoản");
      fetchData(pagination.page, search);
    } catch {
      toast.error("Lỗi kết nối");
    }
  }

  async function deleteUser(id: string) {
    if (!confirm("Xoá người dùng này?")) return;
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Không thể xoá người dùng");
        return;
      }
      toast.success("Đã xoá người dùng");
      fetchData(pagination.page, search);
    } catch {
      toast.error("Lỗi kết nối");
    }
  }

  async function createUser(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fd.get("name"),
          email: fd.get("email"),
          password: fd.get("password"),
          role: fd.get("role"),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Không thể tạo người dùng");
        return;
      }
      toast.success("Đã tạo người dùng mới");
      setShowCreateModal(false);
      fetchData();
    } catch {
      toast.error("Lỗi kết nối");
    }
  }

  const columns: ColumnDef<UserData, unknown>[] = [
    {
      accessorKey: "name",
      header: "Người dùng",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-bold text-white">
            {row.original.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-white">{row.original.name}</p>
            <p className="text-xs text-slate-500">{row.original.email}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "role",
      header: "Vai trò",
      cell: ({ row }) => {
        const roles = row.original.userRoles;
        return (
          <div className="flex flex-wrap gap-1">
            {roles.length > 0 ? (
              roles.map((ur, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 rounded-full bg-blue-500/20 px-2 py-0.5 text-xs text-blue-400"
                >
                  <ShieldCheck size={10} />
                  {ur.role.displayName}
                </span>
              ))
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-700 px-2 py-0.5 text-xs text-slate-400">
                <Shield size={10} />
                {row.original.role}
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "isActive",
      header: "Trạng thái",
      cell: ({ row }) => (
        <button
          onClick={() => toggleActive(row.original.id, row.original.isActive)}
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            row.original.isActive
              ? "bg-green-500/20 text-green-400"
              : "bg-red-500/20 text-red-400"
          }`}
        >
          {row.original.isActive ? "Hoạt động" : "Vô hiệu"}
        </button>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Ngày tạo",
      cell: ({ row }) => (
        <span className="text-xs text-slate-400">
          {new Date(row.original.createdAt).toLocaleDateString("vi-VN")}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <button className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-blue-400">
            <Pencil size={14} />
          </button>
          <button
            onClick={() => deleteUser(row.original.id)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-red-400"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Quản lý Người dùng</h1>
          <p className="text-sm text-slate-400">Quản lý tài khoản và phân quyền</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus size={16} />
          Thêm người dùng
        </button>
      </div>

      <DataTable
        data={users}
        columns={columns}
        loading={loading}
        searchPlaceholder="Tìm người dùng..."
        pagination={pagination}
        onSearch={(s) => { setSearch(s); fetchData(1, s); }}
        onPageChange={(page) => fetchData(page, search)}
      />

      {/* Create User Modal */}
      {showCreateModal && (
        <>
          <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setShowCreateModal(false)} />
          <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-slate-700 bg-slate-900 p-6">
            <h2 className="mb-4 text-lg font-bold text-white">Thêm người dùng mới</h2>
            <form onSubmit={createUser} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm text-slate-300">Tên</label>
                <input
                  name="name"
                  required
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-slate-300">Email</label>
                <input
                  name="email"
                  type="email"
                  required
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-slate-300">Mật khẩu</label>
                <input
                  name="password"
                  type="password"
                  required
                  minLength={8}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-slate-300">Vai trò</label>
                <select
                  name="role"
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
                >
                  Huỷ
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Tạo
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
