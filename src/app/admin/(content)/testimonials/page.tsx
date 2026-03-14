"use client";

import { useEffect, useState, useCallback } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { DataTable } from "../../components/data-table";
import { Plus, Star, Pencil, Trash2, Eye, EyeOff, X } from "lucide-react";
import { toast } from "sonner";

interface Testimonial {
  id: string;
  name: string;
  role: string;
  company: string;
  avatar: string;
  rating: number;
  text: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

interface TestimonialForm {
  name: string;
  role: string;
  company: string;
  avatar: string;
  rating: number;
  text: string;
  isActive: boolean;
  sortOrder: number;
}

const defaultForm: TestimonialForm = {
  name: "",
  role: "",
  company: "",
  avatar: "",
  rating: 5,
  text: "",
  isActive: true,
  sortOrder: 0,
};

export default function AdminTestimonialsPage() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editItem, setEditItem] = useState<Testimonial | null>(null);
  const [form, setForm] = useState<TestimonialForm>(defaultForm);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async (page = 1, searchQuery = "") => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (searchQuery) params.set("search", searchQuery);

      const res = await fetch(`/api/admin/testimonials?${params}`);
      const data = await res.json();
      setTestimonials(data.data || []);
      setPagination(data.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 });
    } catch (e) {
      toast.error("Lỗi kết nối");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreate = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/testimonials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Lỗi tạo đánh giá");
        return;
      }
      setShowCreate(false);
      setForm(defaultForm);
      toast.success("Tạo đánh giá thành công");
      fetchData(pagination.page, search);
    } catch (e) {
      toast.error("Lỗi kết nối");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!editItem) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/testimonials/${editItem.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Lỗi cập nhật đánh giá");
        return;
      }
      setEditItem(null);
      setForm(defaultForm);
      toast.success("Cập nhật đánh giá thành công");
      fetchData(pagination.page, search);
    } catch (e) {
      toast.error("Lỗi kết nối");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xóa đánh giá này?")) return;
    try {
      const res = await fetch(`/api/admin/testimonials/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Xóa thất bại");
        return;
      }
      toast.success("Xóa đánh giá thành công");
      fetchData(pagination.page, search);
    } catch (e) {
      toast.error("Lỗi kết nối");
    }
  };

  const handleToggleActive = async (item: Testimonial) => {
    try {
      const res = await fetch(`/api/admin/testimonials/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !item.isActive }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Cập nhật thất bại");
        return;
      }
      toast.success("Cập nhật trạng thái thành công");
      fetchData(pagination.page, search);
    } catch (e) {
      toast.error("Lỗi kết nối");
    }
  };

  const openEdit = (item: Testimonial) => {
    setForm({
      name: item.name,
      role: item.role,
      company: item.company,
      avatar: item.avatar,
      rating: item.rating,
      text: item.text,
      isActive: item.isActive,
      sortOrder: item.sortOrder,
    });
    setEditItem(item);
  };

  const openCreate = () => {
    setForm(defaultForm);
    setShowCreate(true);
  };

  const columns: ColumnDef<Testimonial, unknown>[] = [
    {
      accessorKey: "name",
      header: "Khách hàng",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          {row.original.avatar ? (
            <img
              src={row.original.avatar}
              alt={row.original.name}
              className="h-9 w-9 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-sm font-bold text-white">
              {row.original.name.charAt(0)}
            </div>
          )}
          <div>
            <p className="font-medium text-white">{row.original.name}</p>
            <p className="text-xs text-slate-500">
              {row.original.role} - {row.original.company}
            </p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "rating",
      header: "Đánh giá",
      cell: ({ row }) => (
        <div className="flex gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              size={12}
              className={
                i < row.original.rating
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-slate-700"
              }
            />
          ))}
        </div>
      ),
    },
    {
      accessorKey: "text",
      header: "Nội dung",
      cell: ({ row }) => (
        <p className="max-w-xs truncate text-sm text-slate-300">
          {row.original.text}
        </p>
      ),
    },
    {
      accessorKey: "sortOrder",
      header: "Thứ tự",
      cell: ({ row }) => (
        <span className="text-slate-400">{row.original.sortOrder}</span>
      ),
    },
    {
      accessorKey: "isActive",
      header: "Trạng thái",
      cell: ({ row }) => (
        <button
          onClick={() => handleToggleActive(row.original)}
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium transition-colors ${
            row.original.isActive
              ? "bg-green-500/20 text-green-400 hover:bg-green-500/30"
              : "bg-red-500/20 text-red-400 hover:bg-red-500/30"
          }`}
        >
          {row.original.isActive ? (
            <>
              <Eye size={12} /> Hiển thị
            </>
          ) : (
            <>
              <EyeOff size={12} /> Ẩn
            </>
          )}
        </button>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => openEdit(row.original)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-blue-400"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={() => handleDelete(row.original.id)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-red-400"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  const renderForm = (onSubmit: () => void, submitLabel: string) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg rounded-xl border border-slate-700 bg-slate-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-700 px-6 py-4">
          <h2 className="text-lg font-semibold text-white">
            {editItem ? "Chỉnh sửa đánh giá" : "Thêm đánh giá mới"}
          </h2>
          <button
            onClick={() => {
              setShowCreate(false);
              setEditItem(null);
              setForm(defaultForm);
            }}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>
        <div className="max-h-[70vh] space-y-4 overflow-y-auto px-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-300">
                Tên khách hàng
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500"
                placeholder="Nguyễn Văn A"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-300">
                Chức vụ
              </label>
              <input
                type="text"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500"
                placeholder="CEO"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-300">
                Công ty
              </label>
              <input
                type="text"
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500"
                placeholder="Công ty ABC"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-300">
                Avatar URL
              </label>
              <input
                type="text"
                value={form.avatar}
                onChange={(e) => setForm({ ...form, avatar: e.target.value })}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500"
                placeholder="https://example.com/avatar.jpg"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-300">
                Đánh giá (sao)
              </label>
              <select
                value={form.rating}
                onChange={(e) => setForm({ ...form, rating: parseInt(e.target.value) })}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
              >
                {[1, 2, 3, 4, 5].map((v) => (
                  <option key={v} value={v}>
                    {v} sao
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-300">
                Thứ tự hiển thị
              </label>
              <input
                type="number"
                value={form.sortOrder}
                onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500"
                placeholder="0"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-300">
              Nội dung đánh giá
            </label>
            <textarea
              value={form.text}
              onChange={(e) => setForm({ ...form, text: e.target.value })}
              rows={4}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500"
              placeholder="Nhập nội dung đánh giá..."
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              className="h-4 w-4 rounded border-slate-700 bg-slate-800 text-blue-600"
            />
            <label htmlFor="isActive" className="text-sm text-slate-300">
              Hiển thị trên website
            </label>
          </div>
        </div>
        <div className="flex justify-end gap-3 border-t border-slate-700 px-6 py-4">
          <button
            onClick={() => {
              setShowCreate(false);
              setEditItem(null);
              setForm(defaultForm);
            }}
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
          >
            Hủy
          </button>
          <button
            onClick={onSubmit}
            disabled={saving || !form.name || !form.text}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Đang lưu..." : submitLabel}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Đánh giá khách hàng</h1>
          <p className="text-sm text-slate-400">
            Quản lý testimonials hiển thị trên website
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus size={16} /> Thêm đánh giá
        </button>
      </div>

      <DataTable
        data={testimonials}
        columns={columns}
        loading={loading}
        searchPlaceholder="Tìm theo tên, công ty..."
        pagination={pagination}
        onSearch={(s) => {
          setSearch(s);
          fetchData(1, s);
        }}
        onPageChange={(page) => fetchData(page, search)}
      />

      {showCreate && renderForm(handleCreate, "Tạo mới")}
      {editItem && renderForm(handleUpdate, "Cập nhật")}
    </div>
  );
}
