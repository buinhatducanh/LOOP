"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { DataTable } from "../../../../components/data-table";
import { Plus, Pencil, Trash2, Eye, EyeOff, X, Loader2, Tag } from "lucide-react";
import { toast } from "sonner";

// ─── Types ──────────────────────────────────────────────────

interface ServiceAttribute {
  id: string;
  slug: string;
  name: string;
  nameVi: string;
  description: string | null;
  descriptionVi: string | null;
  category: string;
  categoryVi: string;
  icon: string | null;
  price: number;
  isRequired: boolean;
  sortOrder: number;
  isActive: boolean;
  tier: string;
  xpPoints: number;
  parentId: string | null;
  parent: { id: string; name: string; nameVi: string } | null;
  children: { id: string; name: string; nameVi: string; tier: string }[];
  createdAt: string;
  _count: { templateAttributes: number; orderAttributes: number };
}

interface FormData {
  slug: string;
  name: string;
  nameVi: string;
  description: string;
  descriptionVi: string;
  category: string;
  categoryVi: string;
  icon: string;
  price: number;
  isRequired: boolean;
  sortOrder: number;
  isActive: boolean;
  tier: string;
  xpPoints: number;
  parentId: string;
}

const emptyForm: FormData = {
  slug: "",
  name: "",
  nameVi: "",
  description: "",
  descriptionVi: "",
  category: "",
  categoryVi: "",
  icon: "",
  price: 0,
  isRequired: false,
  sortOrder: 0,
  isActive: true,
  tier: "basic",
  xpPoints: 0,
  parentId: "",
};

const CATEGORY_OPTIONS = [
  { value: "security", label: "Bảo mật", labelEn: "Security" },
  { value: "performance", label: "Hiệu năng", labelEn: "Performance" },
  { value: "ecommerce", label: "Thương mại điện tử", labelEn: "E-Commerce" },
  { value: "seo", label: "SEO & Marketing", labelEn: "SEO & Marketing" },
  { value: "design", label: "Thiết kế & UX", labelEn: "Design & UX" },
  { value: "integration", label: "Tích hợp", labelEn: "Integration" },
  { value: "support", label: "Hỗ trợ", labelEn: "Support" },
  { value: "other", label: "Khác", labelEn: "Other" },
];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export default function ServiceAttributesPage() {
  const [data, setData] = useState<ServiceAttribute[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 0 });
  const [search, setSearch] = useState("");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ServiceAttribute | null>(null);
  const [deletingItem, setDeletingItem] = useState<ServiceAttribute | null>(null);
  const [formData, setFormData] = useState<FormData>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  const fetchData = useCallback(async (page = 1, searchQuery = "") => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "50" });
      if (searchQuery) params.set("search", searchQuery);
      const res = await fetch(`/api/admin/service-attributes?${params}`);
      const json = await res.json();
      setData(json.data || []);
      setPagination(json.pagination || { page: 1, limit: 50, total: 0, totalPages: 0 });
    } catch {
      toast.error("Lỗi kết nối");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreate = () => {
    setFormData(emptyForm);
    setFormError("");
    setShowCreateModal(true);
  };

  const handleEdit = async (item: ServiceAttribute) => {
    setFormError("");
    setEditLoading(true);
    setEditingItem(item);
    try {
      const res = await fetch(`/api/admin/service-attributes/${item.id}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Lỗi tải dữ liệu");
      const s = json.data;
      setFormData({
        slug: s.slug || "",
        name: s.name || "",
        nameVi: s.nameVi || "",
        description: s.description || "",
        descriptionVi: s.descriptionVi || "",
        category: s.category || "",
        categoryVi: s.categoryVi || "",
        icon: s.icon || "",
        price: s.price || 0,
        isRequired: s.isRequired ?? false,
        sortOrder: s.sortOrder || 0,
        isActive: s.isActive ?? true,
        tier: s.tier || "basic",
        xpPoints: s.xpPoints || 0,
        parentId: s.parentId || "",
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Lỗi tải dữ liệu";
      setFormError(msg);
      toast.error(msg);
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = (item: ServiceAttribute) => {
    setDeletingItem(item);
  };

  const handleToggleActive = async (item: ServiceAttribute) => {
    try {
      const res = await fetch(`/api/admin/service-attributes/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...item, isActive: !item.isActive }),
      });
      if (!res.ok) throw new Error("Lỗi cập nhật");
      toast.success("Cập nhật trạng thái thành công");
      await fetchData(pagination.page, search);
    } catch {
      toast.error("Lỗi kết nối");
    }
  };

  const submitCreate = async () => {
    setSubmitting(true);
    setFormError("");
    try {
      const res = await fetch("/api/admin/service-attributes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          price: Number(formData.price),
          sortOrder: Number(formData.sortOrder),
          xpPoints: Number(formData.xpPoints),
          parentId: formData.parentId || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Lỗi tạo thuộc tính");
      setShowCreateModal(false);
      toast.success("Tạo thuộc tính thành công");
      await fetchData(pagination.page, search);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Lỗi tạo thuộc tính";
      setFormError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const submitEdit = async () => {
    if (!editingItem) return;
    setSubmitting(true);
    setFormError("");
    try {
      const res = await fetch(`/api/admin/service-attributes/${editingItem.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          price: Number(formData.price),
          sortOrder: Number(formData.sortOrder),
          xpPoints: Number(formData.xpPoints),
          parentId: formData.parentId || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Lỗi cập nhật");
      setEditingItem(null);
      toast.success("Cập nhật thuộc tính thành công");
      await fetchData(pagination.page, search);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Lỗi cập nhật";
      setFormError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deletingItem) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/service-attributes/${deletingItem.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Lỗi xóa");
      }
      setDeletingItem(null);
      toast.success("Xóa thuộc tính thành công");
      await fetchData(pagination.page, search);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi kết nối");
    } finally {
      setSubmitting(false);
    }
  };

  const updateField = (field: keyof FormData, value: string | number | boolean) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "nameVi" && showCreateModal) {
        next.slug = slugify(value as string);
      }
      if (field === "category" && showCreateModal) {
        const cat = CATEGORY_OPTIONS.find((c) => c.value === value);
        if (cat) {
          next.categoryVi = cat.label;
        }
      }
      return next;
    });
  };

  // ─── Columns ──────────────────────────────────────────────────

  const columns: ColumnDef<ServiceAttribute, unknown>[] = useMemo(
    () => [
      {
        accessorKey: "nameVi",
        header: "Tính năng",
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-white">{row.original.nameVi}</p>
            <p className="text-xs text-slate-500">{row.original.name}</p>
          </div>
        ),
      },
      {
        accessorKey: "categoryVi",
        header: "Danh mục",
        cell: ({ row }) => (
          <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-300">
            {row.original.categoryVi}
          </span>
        ),
      },
      {
        accessorKey: "tier",
        header: "Cấp độ",
        cell: ({ row }) => (
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              row.original.tier === "advanced"
                ? "bg-purple-500/20 text-purple-400"
                : "bg-slate-700 text-slate-300"
            }`}
          >
            {row.original.tier === "advanced" ? "Nâng cao" : "Cơ bản"}
          </span>
        ),
      },
      {
        accessorKey: "price",
        header: "Giá / XP",
        cell: ({ row }) => (
          <div>
            <span className="text-green-400">
              {row.original.price > 0
                ? row.original.price.toLocaleString("vi-VN") + "đ"
                : "Miễn phí"}
            </span>
            {row.original.xpPoints > 0 && (
              <span className="ml-2 text-xs text-amber-400">{row.original.xpPoints} XP</span>
            )}
          </div>
        ),
      },
      {
        id: "usage",
        header: "Sử dụng",
        cell: ({ row }) => (
          <div className="text-xs text-slate-400">
            <span>{row.original._count.templateAttributes} gói</span>
            <span className="mx-1">·</span>
            <span>{row.original._count.orderAttributes} đơn</span>
          </div>
        ),
      },
      {
        accessorKey: "isActive",
        header: "Trạng thái",
        cell: ({ row }) => (
          <button
            type="button"
            onClick={() => handleToggleActive(row.original)}
            className={`inline-flex cursor-pointer items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium transition-colors ${
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
              onClick={() => handleEdit(row.original)}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-blue-400"
            >
              <Pencil size={14} />
            </button>
            <button
              onClick={() => handleDelete(row.original)}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-red-400"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pagination.page, search],
  );

  // ─── Form Fields ──────────────────────────────────────────────

  const formFields = (
    <div className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
      {formError && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {formError}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-slate-300">Tên (Tiếng Việt)</label>
          <input
            type="text"
            value={formData.nameVi}
            onChange={(e) => updateField("nameVi", e.target.value)}
            placeholder="VD: Chứng chỉ SSL"
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-300">Tên (English)</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => updateField("name", e.target.value)}
            placeholder="VD: SSL Certificate"
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-slate-300">Slug</label>
        <input
          type="text"
          value={formData.slug}
          onChange={(e) => updateField("slug", e.target.value)}
          placeholder="ssl-certificate"
          className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-slate-300">Danh mục</label>
          <select
            value={formData.category}
            onChange={(e) => updateField("category", e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
          >
            <option value="">-- Chọn danh mục --</option>
            {CATEGORY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label} ({opt.labelEn})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-slate-300">Icon (Lucide)</label>
          <input
            type="text"
            value={formData.icon}
            onChange={(e) => updateField("icon", e.target.value)}
            placeholder="VD: shield-check"
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-slate-300">Mô tả (Tiếng Việt)</label>
          <textarea
            value={formData.descriptionVi}
            onChange={(e) => updateField("descriptionVi", e.target.value)}
            placeholder="Mô tả ngắn về tính năng"
            rows={2}
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-300">Mô tả (English)</label>
          <textarea
            value={formData.description}
            onChange={(e) => updateField("description", e.target.value)}
            placeholder="Short feature description"
            rows={2}
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Tier & XP */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="text-sm font-medium text-slate-300">Cấp độ (Tier)</label>
          <select
            value={formData.tier}
            onChange={(e) => updateField("tier", e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
          >
            <option value="basic">Cơ bản (Basic)</option>
            <option value="advanced">Nâng cao (Advanced)</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-slate-300">Giá (VNĐ)</label>
          <input
            type="number"
            value={formData.price}
            onChange={(e) => updateField("price", e.target.value === "" ? 0 : Number(e.target.value))}
            placeholder="0"
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-300">Điểm XP</label>
          <input
            type="number"
            value={formData.xpPoints}
            onChange={(e) => updateField("xpPoints", e.target.value === "" ? 0 : Number(e.target.value))}
            placeholder="0"
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
          />
          <p className="mt-0.5 text-xs text-slate-500">Chỉ dùng cho tier Advanced</p>
        </div>
      </div>

      {/* Parent (Mutual Exclusion) */}
      <div>
        <label className="text-sm font-medium text-slate-300">Tính năng cha (Mutual Exclusion)</label>
        <select
          value={formData.parentId}
          onChange={(e) => updateField("parentId", e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
        >
          <option value="">-- Không có (độc lập) --</option>
          {data.filter((d) => d.tier === "basic" && d.id !== editingItem?.id).map((d) => (
            <option key={d.id} value={d.id}>
              {d.nameVi} ({d.name})
            </option>
          ))}
        </select>
        <p className="mt-0.5 text-xs text-slate-500">
          Chọn cha nếu tính năng này thay thế tính năng cơ bản khi khách nâng cấp
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="text-sm font-medium text-slate-300">Thứ tự</label>
          <input
            type="number"
            value={formData.sortOrder}
            onChange={(e) => updateField("sortOrder", e.target.value === "" ? 0 : Number(e.target.value))}
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
          />
        </div>
        <div className="flex items-end gap-4 pb-1">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={formData.isRequired}
              onChange={(e) => updateField("isRequired", e.target.checked)}
              className="h-4 w-4 rounded border-slate-700 bg-slate-800 text-blue-600"
            />
            <span className="text-sm text-slate-300">Bắt buộc</span>
          </label>
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => updateField("isActive", e.target.checked)}
              className="h-4 w-4 rounded border-slate-700 bg-slate-800 text-blue-600"
            />
            <span className="text-sm text-slate-300">Hiển thị</span>
          </label>
        </div>
      </div>
    </div>
  );

  // ─── Render ──────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Kho Tính Năng</h1>
          <p className="text-sm text-slate-400">
            Quản lý các thuộc tính / tính năng dịch vụ web (dùng cho cả Web Gói & Web Thiết Kế)
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus size={16} />
          Thêm tính năng
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
          <div className="flex items-center gap-2 text-slate-400">
            <Tag size={16} />
            <span className="text-sm">Tổng tính năng</span>
          </div>
          <p className="mt-1 text-2xl font-bold text-white">{pagination.total}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
          <div className="text-sm text-slate-400">Đang hoạt động</div>
          <p className="mt-1 text-2xl font-bold text-green-400">
            {data.filter((d) => d.isActive).length}
          </p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
          <div className="text-sm text-slate-400">Cơ bản</div>
          <p className="mt-1 text-2xl font-bold text-slate-300">
            {data.filter((d) => d.tier === "basic").length}
          </p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
          <div className="text-sm text-slate-400">Nâng cao</div>
          <p className="mt-1 text-2xl font-bold text-purple-400">
            {data.filter((d) => d.tier === "advanced").length}
          </p>
        </div>
      </div>

      <DataTable
        data={data}
        columns={columns}
        loading={loading}
        searchPlaceholder="Tìm tính năng..."
        pagination={pagination}
        onSearch={(s) => {
          setSearch(s);
          fetchData(1, s);
        }}
        onPageChange={(page) => fetchData(page, search)}
      />

      {/* Create Modal */}
      {showCreateModal && (
        <>
          <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setShowCreateModal(false)} />
          <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-xl border border-slate-700 bg-slate-900 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Thêm tính năng mới</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>
            {formFields}
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setShowCreateModal(false)}
                className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-600"
              >
                Hủy
              </button>
              <button
                onClick={submitCreate}
                disabled={submitting}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting && <Loader2 size={14} className="animate-spin" />}
                Tạo tính năng
              </button>
            </div>
          </div>
        </>
      )}

      {/* Edit Modal */}
      {editingItem && (
        <>
          <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setEditingItem(null)} />
          <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-xl border border-slate-700 bg-slate-900 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Chỉnh sửa tính năng</h2>
              <button
                onClick={() => setEditingItem(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>
            {editLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={24} className="animate-spin text-blue-500" />
              </div>
            ) : (
              formFields
            )}
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setEditingItem(null)}
                className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-600"
              >
                Hủy
              </button>
              <button
                onClick={submitEdit}
                disabled={submitting || editLoading}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting && <Loader2 size={14} className="animate-spin" />}
                Cập nhật
              </button>
            </div>
          </div>
        </>
      )}

      {/* Delete Confirmation */}
      {deletingItem && (
        <>
          <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setDeletingItem(null)} />
          <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl border border-slate-700 bg-slate-900 p-6">
            <h2 className="text-lg font-semibold text-white">Xác nhận xóa</h2>
            <p className="mt-2 text-sm text-slate-400">
              Bạn có chắc chắn muốn xóa tính năng{" "}
              <span className="font-medium text-white">{deletingItem.nameVi}</span>? Hành động
              này không thể hoàn tác.
            </p>
            {(deletingItem._count.templateAttributes > 0 || deletingItem._count.orderAttributes > 0) && (
              <div className="mt-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-400">
                Tính năng này đang được sử dụng bởi {deletingItem._count.templateAttributes} gói và{" "}
                {deletingItem._count.orderAttributes} đơn hàng.
              </div>
            )}
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setDeletingItem(null)}
                className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-600"
              >
                Hủy
              </button>
              <button
                onClick={confirmDelete}
                disabled={submitting}
                className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {submitting && <Loader2 size={14} className="animate-spin" />}
                Xóa tính năng
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
