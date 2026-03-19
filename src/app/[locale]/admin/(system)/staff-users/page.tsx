"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Pencil, Trash2, UsersRound, Link2, Unlink, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  image: string | null;
}

interface StaffUser {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
  role: string;
  isActive: boolean;
  accountType: string;
  teamMemberId: string | null;
  createdAt: string;
  userRoles: { role: { name: string; displayName: string } }[];
  teamMember: { id: string; name: string; role: string; image: string | null } | null;
}

export default function AdminStaffUsersPage() {
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<StaffUser | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [usersRes, membersRes] = await Promise.all([
        fetch("/api/admin/users?accountType=staff&limit=100"),
        fetch("/api/admin/team"),
      ]);
      const usersData = await usersRes.json();
      const membersData = await membersRes.json();
      setUsers(usersData.data || []);
      setTeamMembers(membersData.data || []);
    } catch (e) {
      console.error(e);
      toast.error("Không thể tải dữ liệu");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Unlink team member from user
  async function unlinkTeamMember(userId: string) {
    if (!confirm("Bỏ liên kết nhân sự khỏi tài khoản này?")) return;
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamMemberId: null, accountType: "customer" }),
      });
      if (!res.ok) { const d = await res.json(); toast.error(d.error); return; }
      toast.success("Đã bỏ liên kết nhân sự");
      fetchData();
    } catch { toast.error("Lỗi kết nối"); }
  }

  // Link team member to user
  async function linkTeamMember(userId: string, teamMemberId: string) {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamMemberId, accountType: "staff" }),
      });
      if (!res.ok) { const d = await res.json(); toast.error(d.error); return; }
      toast.success("Đã liên kết nhân sự");
      fetchData();
    } catch { toast.error("Lỗi kết nối"); }
  }

  // Toggle active
  async function toggleActive(id: string, isActive: boolean) {
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      });
      if (!res.ok) { const d = await res.json(); toast.error(d.error); return; }
      toast.success(isActive ? "Đã vô hiệu hoá" : "Đã kích hoạt");
      fetchData();
    } catch { toast.error("Lỗi kết nối"); }
  }

  // Delete
  async function deleteUser(id: string) {
    if (!confirm("Xoá tài khoản này?")) return;
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
      if (!res.ok) { const d = await res.json(); toast.error(d.error); return; }
      toast.success("Đã xoá tài khoản");
      fetchData();
    } catch { toast.error("Lỗi kết nối"); }
  }

  // Create or update
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const isEdit = !!editingUser;
    const payload = {
      name: fd.get("name") as string,
      email: fd.get("email") as string,
      password: fd.get("password") as string || undefined,
      role: fd.get("role") as string,
      accountType: "staff",
      teamMemberId: fd.get("teamMemberId") as string || null,
    };
    if (!payload.password && !isEdit) {
      toast.error("Mật khẩu là bắt buộc");
      setSaving(false); return;
    }
    try {
      const url = isEdit ? `/api/admin/users/${editingUser!.id}` : "/api/admin/users";
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isEdit ? { ...payload, password: undefined } : payload),
      });
      if (!res.ok) { const d = await res.json(); toast.error(d.error); setSaving(false); return; }
      toast.success(isEdit ? "Đã cập nhật tài khoản" : "Đã tạo tài khoản");
      setShowCreateModal(false);
      setEditingUser(null);
      fetchData();
    } catch { toast.error("Lỗi kết nối"); }
    finally { setSaving(false); }
  }

  // Team members not yet linked to any user
  const linkedMemberIds = users.map(u => u.teamMemberId).filter(Boolean) as string[];
  const availableMembers = teamMembers.filter(m => !linkedMemberIds.includes(m.id));

  // Users with team member info sorted: linked first
  const sortedUsers = [...users].sort((a, b) => {
    if (a.teamMemberId && !b.teamMemberId) return -1;
    if (!a.teamMemberId && b.teamMemberId) return 1;
    return 0;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Tài Khoản Nhân Viên</h1>
          <p className="mt-1 text-sm text-slate-400">
            Quản lý tài khoản nhân sự và liên kết với hồ sơ đội ngũ trên website
          </p>
        </div>
        <button
          onClick={() => { setEditingUser(null); setShowCreateModal(true); }}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
        >
          <Plus size={16} />
          Thêm Tài Khoản NV
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
          <div className="text-2xl font-bold text-white">{users.length}</div>
          <div className="text-sm text-slate-400">Tài khoản nhân viên</div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
          <div className="text-2xl font-bold text-emerald-400">{users.filter(u => u.teamMemberId).length}</div>
          <div className="text-sm text-slate-400">Đã liên kết đội ngũ</div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
          <div className="text-2xl font-bold text-slate-400">{users.filter(u => !u.teamMemberId).length}</div>
          <div className="text-sm text-slate-400">Chưa liên kết</div>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500/30 border-t-indigo-500" />
        </div>
      ) : sortedUsers.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-slate-800 bg-slate-900/50 py-16">
          <UsersRound size={40} className="text-slate-600 mb-3" />
          <p className="text-slate-400">Chưa có tài khoản nhân viên nào</p>
          <button onClick={() => setShowCreateModal(true)} className="mt-3 text-sm text-indigo-400 hover:text-indigo-300">
            + Thêm tài khoản đầu tiên
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/80 text-left text-[11px] uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3">Tài khoản</th>
                <th className="px-4 py-3">Liên kết đội ngũ</th>
                <th className="px-4 py-3">Vai trò</th>
                <th className="px-4 py-3 text-center">Trạng thái</th>
                <th className="px-4 py-3 w-24"></th>
              </tr>
            </thead>
            <tbody>
              {sortedUsers.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-slate-800/50 text-slate-300 hover:bg-slate-800/20"
                >
                  {/* Avatar + name + email */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.name} className="h-9 w-9 rounded-full object-cover" />
                      ) : (
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500 text-sm font-bold text-white">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-white">{user.name}</p>
                        <p className="text-xs text-slate-500">{user.email}</p>
                      </div>
                    </div>
                  </td>

                  {/* Team member linked */}
                  <td className="px-4 py-3">
                    {user.teamMember ? (
                      <div className="flex items-center gap-2">
                        {user.teamMember.image ? (
                          <img src={user.teamMember.image} alt="" className="h-7 w-7 rounded-full object-cover" />
                        ) : (
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-500/20 text-xs font-bold text-indigo-400">
                            {user.teamMember.name.charAt(0)}
                          </div>
                        )}
                        <div>
                          <p className="text-sm text-white">{user.teamMember.name}</p>
                          <p className="text-xs text-slate-500">{user.teamMember.role}</p>
                        </div>
                        <button
                          onClick={() => unlinkTeamMember(user.id)}
                          title="Bỏ liên kết"
                          className="ml-1 rounded p-1 text-slate-600 hover:bg-red-500/10 hover:text-red-400"
                        >
                          <Unlink size={13} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <select
                          className="rounded border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-slate-300"
                          value=""
                          onChange={(e) => {
                            if (e.target.value) linkTeamMember(user.id, e.target.value);
                          }}
                        >
                          <option value="">— Chưa liên kết —</option>
                          {availableMembers.map(m => (
                            <option key={m.id} value={m.id}>{m.name} ({m.role})</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </td>

                  {/* Roles */}
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {user.userRoles.length > 0 ? (
                        user.userRoles.map((ur, i) => (
                          <span key={i} className="inline-flex items-center gap-1 rounded-full bg-indigo-500/20 px-2 py-0.5 text-xs text-indigo-400">
                            <ShieldCheck size={10} />
                            {ur.role.displayName}
                          </span>
                        ))
                      ) : (
                        <span className="rounded-full bg-slate-700 px-2 py-0.5 text-xs text-slate-400">
                          {user.role}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => toggleActive(user.id, user.isActive)}
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        user.isActive ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {user.isActive ? "Hoạt động" : "Vô hiệu"}
                    </button>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => { setEditingUser(user); setShowCreateModal(true); }}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-indigo-400"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => deleteUser(user.id)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-red-400"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create / Edit Modal */}
      {showCreateModal && (
        <>
          <div className="fixed inset-0 z-50 bg-black/60" onClick={() => { setShowCreateModal(false); setEditingUser(null); }} />
          <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
            <h2 className="mb-5 text-lg font-bold text-white">
              {editingUser ? "Sửa Tài Khoản Nhân Viên" : "Thêm Tài Khoản Nhân Viên"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-300">Tên nhân viên</label>
                  <input
                    name="name"
                    defaultValue={editingUser?.name}
                    required
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-300">Email</label>
                  <input
                    name="email"
                    type="email"
                    defaultValue={editingUser?.email}
                    required
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-300">
                    Mật khẩu {editingUser && <span className="text-slate-500 font-normal">(để trống = giữ nguyên)</span>}
                  </label>
                  <input
                    name="password"
                    type="password"
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
                    placeholder={editingUser ? "Không đổi" : "Bắt buộc"}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-300">Vai trò</label>
                  <select
                    name="role"
                    defaultValue={editingUser?.role || "admin"}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
                  >
                    <option value="admin">Admin</option>
                    <option value="user">User</option>
                  </select>
                </div>
              </div>

              {/* Team member selector */}
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <UsersRound size={14} />
                    Liên kết hồ sơ đội ngũ
                  </span>
                </label>
                <select
                  name="teamMemberId"
                  defaultValue={editingUser?.teamMemberId || ""}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
                >
                  <option value="">— Chưa liên kết —</option>
                  {teamMembers
                    .filter(m => !linkedMemberIds.includes(m.id) || m.id === editingUser?.teamMemberId)
                    .map(m => (
                      <option key={m.id} value={m.id}>
                        {m.name} — {m.role}
                      </option>
                    ))}
                </select>
                <p className="mt-1 text-xs text-slate-500">
                  Chọn hồ sơ nhân sự tương ứng để hiển thị trên trang{" "}
                  <span className="text-indigo-400">/team-list</span>
                </p>
              </div>

              {/* Linked member preview */}
              {editingUser?.teamMember && (
                <div className="flex items-center gap-3 rounded-lg border border-indigo-500/30 bg-indigo-500/5 p-3">
                  {editingUser.teamMember.image ? (
                    <img src={editingUser.teamMember.image} alt="" className="h-10 w-10 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500/20 text-sm font-bold text-indigo-400">
                      {editingUser.teamMember.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-white">{editingUser.teamMember.name}</p>
                    <p className="text-xs text-slate-400">{editingUser.teamMember.role}</p>
                  </div>
                  <span className="ml-auto rounded-full bg-indigo-500/20 px-2 py-0.5 text-xs text-indigo-400">
                    Đã liên kết
                  </span>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowCreateModal(false); setEditingUser(null); }}
                  className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
                >
                  Huỷ
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {saving && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />}
                  {editingUser ? "Cập nhật" : "Tạo Tài Khoản"}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
