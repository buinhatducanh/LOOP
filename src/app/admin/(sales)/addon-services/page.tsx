"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { DataTable } from "../../components/data-table";
import { Plus, Pencil, Trash2, Eye, EyeOff, X, Loader2, Puzzle } from "lucide-react";
import { toast } from "sonner";

// ─── Types ──────────────────────────────────────────────────

interface AddonService {
  id: string;
  slug: string;
  name: string;
  nameVi: string;
  description: string | null;
  descriptionVi: string | null;
  icon: string | null;
  type: string;
  price: number;
  billingPeriod: string | null;
  metadata: any;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count: { rewardTierItems: number; orderRewards: number };
}

interface FormData {
  slug: string;
  name: string;
  nameVi: string;
  description: string;
  descriptionVi: string;
  icon: string;
  type: string;
  price: number;
  billingPeriod: string;
  metadata: string;
  sortOrder: number;
  isActive: boolean;
}

const emptyForm: FormData = {
  slug: "",
  name: "",
  nameVi: "",
  description: "",
  descriptionVi: "",
  icon: "",
  type: "one_time",
  price: 0,
  billingPeriod: "",
  metadata: "",
  sortOrder: 0,
  isActive: true,
};

const TYPE_OPTIONS = [
  { value: "one_time", label: "Một lần", labelEn: "One-time" },
  { value: "recurring", label: "Định kỳ", labelEn: "Recurring" },
];

const BILLING_PERIOD_OPTIONS = [
  { value: "monthly", label: "Hàng tháng" },
  { value: "quarterly", label: "Hàng quý" },
  { value: "yearly", label: "Hàng năm" },
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

function formatBillingPeriod(period: string | null): string {
  if (!period) return "";
  const map: Record<string, string> = {
    monthly: "/tháng",
    quarterly: "/quý",
    yearly: "/năm",
  };
  return map[period] || "";
}

export default function AddonServicesPage() {
  const [data, setData] = useState<AddonService[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 0 });
  const [search, setSearch] = useState("");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingItem, setEditingItem] = useState<AddonService | null>(null);
  const [deletingItem, setDeletingItem] = useState<AddonService | null>(null);
  const [formData, setFormData] = useState<FormData>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  const fetchData = useCallback(async (page = 1, searchQuery = "") => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "50" });
      if (searchQuery) params.set("search", searchQuery);
      const res = await fetch(`/api/admin/addon-services?${params}`);
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

  const handleEdit = async (item: AddonService) => {
    setFormError("");
    setEditLoading(true);
    setEditingItem(item);
    try {
      const res = await fetch(`/api/admin/addon-services/${item.id}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Lỗi tải dữ liệu");
      const s = json.data;
      setFormData({
        slug: s.slug || "",
        name: s.name || "",
        nameVi: s.nameVi || "",
        description: s.description || "",
        descriptionVi: s.descriptionVi || "",
        icon: s.icon || "",
        type: s.type || "one_time",
        price: s.price || 0,
        billingPeriod: s.billingPeriod || "",
        metadata: s.metadata ? JSON.stringify(s.metadata, null, 2) : "",
        sortOrder: s.sortOrder || 0,
        isActive: s.isActive ?? true,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Lỗi tải dữ liệu";
      setFormError(msg);
      toast.error(msg);
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = (item: AddonService) => {
    setDeletingItem(item);
  };

  const handleToggleActive = async (item: AddonService) => {
    try {
      const res = await fetch(`/api/admin/addon-services/${item.id}`, {
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
      let parsedMetadata = null;
      if (formData.metadata.trim()) {
        try {
          parsedMetadata = JSON.parse(formData.metadata);
        } catch {
          throw new Error("Metadata phải là JSON hợp lệ");
        }
      }
      const res = await fetch("/api/admin/addon-services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          price: Number(formData.price),
          sortOrder: Number(formData.sortOrder),
          billingPeriod: formData.type === "recurring" ? formData.billingPeriod || null : null,
          metadata: parsedMetadata,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Lỗi tạo dịch vụ");
      setShowCreateModal(false);
      toast.success("Tạo dịch vụ thành công");
      await fetchData(pagination.page, search);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Lỗi tạo dịch vụ";
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
      let parsedMetadata = null;
      if (formData.metadata.trim()) {
        try {
          parsedMetadata = JSON.parse(formData.metadata);
        } catch {
          throw new Error("Metadata phải là JSON hợp lệ");
        }
      }
      const res = await fetch(`/api/admin/addon-services/${editingItem.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          price: Number(formData.price),
          sortOrder: Number(formData.sortOrder),
          billingPeriod: formData.type === "recurring" ? formData.billingPeriod || null : null,
          metadata: parsedMetadata,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Lỗi cập nhật");
      setEditingItem(null);
      toast.success("Cập nhật dịch vụ thành công");
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
      const res = await fetch(`/api/admin/addon-services/${deletingItem.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Lỗi xóa");
      }
      setDeletingItem(null);
      toast.success("Xóa dịch vụ thành công");
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
      if (field === "type" && value === "one_time") {
        next.billingPeriod = "";
      }
      return next;
    });
  };

  // ─── Columns ──────────────────────────────────────────────────

  const columns: ColumnDef<AddonService, unknown>[] = useMemo(
    () => [
      {
        accessorKey: "nameVi",
        header: "Tên dịch vụ",
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-white">{row.original.nameVi}</p>
            <p className="text-xs text-slate-500">{row.original.name}</p>
          </div>
        ),
      },
      {
        accessorKey: "type",
        header: "Loại",
        cell: ({ row }) => (
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              row.original.type === "recurring"
                ? "bg-blue-500/20 text-blue-400"
                : "bg-slate-700 text-slate-300"
            }`}
          >
            {row.original.type === "recurring" ? "Định kỳ" : "Một lần"}
          </span>
        ),
      },
      {
        accessorKey: "price",
        header: "Giá",
        cell: ({ row }) => (
          <div>
            <span className="text-green-400">
              {row.original.price > 0
                ? row.original.price.toLocaleString("vi-VN") + "đ"
                : "Miễn phí"}
            </span>
            {row.original.type === "recurring" && row.original.billingPeriod && (
              <span className="text-xs text-slate-400">
                {formatBillingPeriod(row.original.billingPeriod)}
              </span>
            )}
          </div>
        ),
      },
      {
        id: "usage",
        header: "Sử dụng",
        cell: ({ row }) => (
          <div className="text-xs text-slate-400">
            <span>{row.original._count.rewardTierItems} rewards</span>
            <span className="mx-1">·</span>
            <span>{row.original._count.orderRewards} đơn</span>
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
            placeholder="VD: Nhập liệu sản phẩm"
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-300">Tên (English)</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => updateField("name", e.target.value)}
            placeholder="VD: Product Data Entry"
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
          placeholder="nhap-lieu-san-pham"
          className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-slate-300">Mô tả (Tiếng Việt)</label>
          <textarea
            value={formData.descriptionVi}
            onChange={(e) => updateField("descriptionVi", e.target.value)}
            placeholder="Mô tả ngắn về dịch vụ"
            rows={2}
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-300">Mô tả (English)</label>
          <textarea
            value={formData.description}
            onChange={(e) => updateField("description", e.target.value)}
            placeholder="Short service description"
            rows={2}
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-slate-300">Icon (Lucide)</label>
          <input
            type="text"
            value={formData.icon}
            onChange={(e) => updateField("icon", e.target.value)}
            placeholder="VD: file-text"
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-300">Loại dịch vụ</label>
          <select
            value={formData.type}
            onChange={(e) => updateField("type", e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
          >
            {TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label} ({opt.labelEn})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
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
        {formData.type === "recurring" && (
          <div>
            <label className="text-sm font-medium text-slate-300">Chu kỳ thanh toán</label>
            <select
              value={formData.billingPeriod}
              onChange={(e) => updateField("billingPeriod", e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
            >
              <option value="">-- Chọn chu kỳ --</option>
              {BILLING_PERIOD_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div>
        <label className="text-sm font-medium text-slate-300">Metadata (JSON)</label>
        <textarea
          value={formData.metadata}
          onChange={(e) => updateField("metadata", e.target.value)}
          placeholder='{"key": "value"}'
          rows={3}
          className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 font-mono text-sm text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
        />
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
          <h1 className="text-2xl font-bold text-white">Dịch vụ Rời</h1>
          <p className="text-sm text-slate-400">
            Quản lý các dịch vụ bổ sung (SEO, nhập liệu, bảo trì...)
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus size={16} />
          Thêm dịch vụ
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
          <div className="flex items-center gap-2 text-slate-400">
            <Puzzle size={16} />
            <span className="text-sm">Tổng dịch vụ</span>
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
          <div className="text-sm text-slate-400">Một lần</div>
          <p className="mt-1 text-2xl font-bold text-slate-300">
            {data.filter((d) => d.type === "one_time").length}
          </p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
          <div className="text-sm text-slate-400">Định kỳ</div>
          <p className="mt-1 text-2xl font-bold text-blue-400">
            {data.filter((d) => d.type === "recurring").length}
          </p>
        </div>
      </div>

      <DataTable
        data={data}
        columns={columns}
        loading={loading}
        searchPlaceholder="Tìm dịch vụ..."
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
              <h2 className="text-lg font-semibold text-white">Thêm dịch vụ mới</h2>
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
                Tạo dịch vụ
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
              <h2 className="text-lg font-semibold text-white">Chỉnh sửa dịch vụ</h2>
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
              Bạn có chắc chắn muốn xóa dịch vụ{" "}
              <span className="font-medium text-white">{deletingItem.nameVi}</span>? Hành động
              này không thể hoàn tác.
            </p>
            {(deletingItem._count.rewardTierItems > 0 || deletingItem._count.orderRewards > 0) && (
              <div className="mt-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-400">
                Dịch vụ này đang được sử dụng bởi {deletingItem._count.rewardTierItems} rewards và{" "}
                {deletingItem._count.orderRewards} đơn hàng.
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
                Xóa dịch vụ
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
