"use client";

import { Suspense, useEffect, useState, useCallback, useMemo, useRef } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { DataTable } from "../../components/data-table";
import { FilterBar, type FilterDef } from "@/app/[locale]/admin/components/filter-bar";
import { Plus, Pencil, Trash2, Eye, EyeOff, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Service {
  id: string;
  slug: string;
  title: string;
  category: string;
  shortDescription: string;
  longDescription: string;
  icon: string;
  startingPrice: number;
  deliveryTime: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  _count: { projects: number };
}

interface ServiceFormData {
  title: string;
  slug: string;
  category: string;
  longDescription: string;
  shortDescription: string;
  icon: string;
  startingPrice: number;
  deliveryTime: string;
  isActive: boolean;
  sortOrder: number;
}

const emptyForm: ServiceFormData = {
  title: "",
  slug: "",
  category: "",
  longDescription: "",
  shortDescription: "",
  icon: "",
  startingPrice: 0,
  deliveryTime: "",
  isActive: true,
  sortOrder: 0,
};

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

const serviceFilters: FilterDef[] = [
  {
    key: "isActive",
    label: "Trạng thái",
    type: "boolean",
  },
  {
    key: "category",
    label: "Danh mục",
    type: "select",
    options: [
      { value: "website", label: "Website" },
      { value: "app", label: "App" },
      { value: "marketing", label: "Marketing" },
      { value: "branding", label: "Branding" },
    ],
  },
];

export default function AdminServicesPage() {
  return (
    <Suspense>
      <AdminServicesContent />
    </Suspense>
  );
}

function AdminServicesContent() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [filterValues, setFilterValues] = useState<Record<string, string | string[]>>({});

  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [deletingService, setDeletingService] = useState<Service | null>(null);
  const [formData, setFormData] = useState<ServiceFormData>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  const filterValuesRef = useRef(filterValues);
  useEffect(() => { filterValuesRef.current = filterValues; }, [filterValues]);

  const fetchData = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      for (const [key, val] of Object.entries(filterValuesRef.current)) {
        if (val && val !== "all" && val !== "__all__") params.set(key, String(val));
      }
      const res = await fetch(`/api/admin/services?${params}`);
      const data = await res.json();
      setServices(data.data || []);
      setPagination(data.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 });
    } catch (e) {
      toast.error("Lỗi kết nối");
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- Handlers ---

  const handleCreate = () => {
    setFormData(emptyForm);
    setFormError("");
    setShowCreateModal(true);
  };

  const handleEdit = async (service: Service) => {
    setFormError("");
    setEditLoading(true);
    setEditingService(service);
    try {
      const res = await fetch(`/api/admin/services/${service.id}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Lỗi tải dữ liệu");
      const s = json.data;
      setFormData({
        title: s.title || "",
        slug: s.slug || "",
        category: s.category || "",
        longDescription: s.longDescription || "",
        shortDescription: s.shortDescription || "",
        icon: s.icon || "",
        startingPrice: s.startingPrice || 0,
        deliveryTime: s.deliveryTime || "",
        isActive: s.isActive ?? true,
        sortOrder: s.sortOrder || 0,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Lỗi tải dữ liệu";
      setFormError(msg);
      toast.error(msg);
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = (service: Service) => {
    setDeletingService(service);
  };

  const handleToggleActive = async (service: Service) => {
    try {
      const res = await fetch(`/api/admin/services/${service.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !service.isActive }),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Lỗi cập nhật");
      }
      toast.success("Cập nhật trạng thái thành công");
      await fetchData(pagination.page);
    } catch (e) {
      toast.error("Lỗi kết nối");
    }
  };

  const submitCreate = async () => {
    setSubmitting(true);
    setFormError("");
    try {
      const res = await fetch("/api/admin/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          startingPrice: Number(formData.startingPrice),
          sortOrder: Number(formData.sortOrder),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Lỗi tạo dịch vụ");
      setShowCreateModal(false);
      toast.success("Tạo dịch vụ thành công");
      await fetchData(pagination.page);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Lỗi tạo dịch vụ";
      setFormError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const submitEdit = async () => {
    if (!editingService) return;
    setSubmitting(true);
    setFormError("");
    try {
      const res = await fetch(`/api/admin/services/${editingService.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          startingPrice: Number(formData.startingPrice),
          sortOrder: Number(formData.sortOrder),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Lỗi cập nhật dịch vụ");
      setEditingService(null);
      toast.success("Cập nhật dịch vụ thành công");
      await fetchData(pagination.page);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Lỗi cập nhật dịch vụ";
      setFormError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deletingService) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/services/${deletingService.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Lỗi xóa dịch vụ");
      }
      setDeletingService(null);
      toast.success("Xóa dịch vụ thành công");
      await fetchData(pagination.page);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi kết nối");
    } finally {
      setSubmitting(false);
    }
  };

  const updateField = (field: keyof ServiceFormData, value: string | number | boolean) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      // Auto-generate slug from title when creating (not editing)
      if (field === "title" && showCreateModal) {
        next.slug = slugify(value as string);
      }
      return next;
    });
  };

  // --- Columns (inside component to access handlers) ---

  const columns: ColumnDef<Service, unknown>[] = useMemo(
    () => [
      {
        accessorKey: "title",
        header: "Dịch vụ",
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-white">{row.original.title}</p>
            <p className="text-xs text-slate-500">/{row.original.slug}</p>
          </div>
        ),
      },
      {
        accessorKey: "category",
        header: "Danh mục",
        cell: ({ row }) => (
          <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-300">
            {row.original.category}
          </span>
        ),
      },
      {
        accessorKey: "startingPrice",
        header: "Giá từ",
        cell: ({ row }) => (
          <span className="text-green-400">
            ${row.original.startingPrice.toLocaleString()}
          </span>
        ),
      },
      {
        id: "projects",
        header: "Dự án",
        cell: ({ row }) => (
          <span className="text-slate-300">{row.original._count.projects}</span>
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
    [pagination.page],
  );

  // --- Form JSX ---

  const formFields = (
    <div className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
      {formError && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {formError}
        </div>
      )}

      <div>
        <label className="text-sm font-medium text-slate-300">Tên dịch vụ</label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => updateField("title", e.target.value)}
          placeholder="VD: Thiết kế Website"
          className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
        />
      </div>

      <div>
        <label className="text-sm font-medium text-slate-300">Slug</label>
        <input
          type="text"
          value={formData.slug}
          onChange={(e) => updateField("slug", e.target.value)}
          placeholder="thiet-ke-website"
          className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-slate-300">Danh mục</label>
          <input
            type="text"
            value={formData.category}
            onChange={(e) => updateField("category", e.target.value)}
            placeholder="VD: Design"
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-300">Icon</label>
          <input
            type="text"
            value={formData.icon}
            onChange={(e) => updateField("icon", e.target.value)}
            placeholder="VD: palette"
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-slate-300">Mô tả ngắn</label>
        <input
          type="text"
          value={formData.shortDescription}
          onChange={(e) => updateField("shortDescription", e.target.value)}
          placeholder="Mô tả ngắn gọn về dịch vụ"
          className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
        />
      </div>

      <div>
        <label className="text-sm font-medium text-slate-300">Mô tả chi tiết</label>
        <textarea
          value={formData.longDescription}
          onChange={(e) => updateField("longDescription", e.target.value)}
          placeholder="Mô tả chi tiết về dịch vụ"
          rows={4}
          className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-slate-300">Giá khởi điểm ($)</label>
          <input
            type="number"
            value={formData.startingPrice}
            onChange={(e) => updateField("startingPrice", e.target.value === "" ? 0 : Number(e.target.value))}
            placeholder="0"
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-300">Thời gian giao hàng</label>
          <input
            type="text"
            value={formData.deliveryTime}
            onChange={(e) => updateField("deliveryTime", e.target.value)}
            placeholder="VD: 2-4 tuần"
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-slate-300">Thứ tự sắp xếp</label>
          <input
            type="number"
            value={formData.sortOrder}
            onChange={(e) => updateField("sortOrder", e.target.value === "" ? 0 : Number(e.target.value))}
            placeholder="0"
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
          />
        </div>
        <div className="flex items-end">
          <label className="flex cursor-pointer items-center gap-2 pb-2">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => updateField("isActive", e.target.checked)}
              className="h-4 w-4 rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-slate-300">Hiển thị</span>
          </label>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Quản lý Dịch vụ</h1>
          <p className="text-sm text-slate-400">Quản lý tất cả dịch vụ của LOOP</p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus size={16} />
          Thêm dịch vụ
        </button>
      </div>

      <FilterBar
        filters={serviceFilters}
        onChange={(vals) => {
          setFilterValues(vals);
          fetchData(1);
        }}
      />

      <DataTable
        data={services}
        columns={columns}
        loading={loading}
        searchPlaceholder="Tìm dịch vụ..."
        pagination={pagination}
        onSearch={() => {}}
        onPageChange={(page) => fetchData(page)}
      />

      {/* Create Modal */}
      {showCreateModal && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/50"
            onClick={() => setShowCreateModal(false)}
          />
          <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl border border-slate-700 bg-slate-900 p-6">
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
      {editingService && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/50"
            onClick={() => setEditingService(null)}
          />
          <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl border border-slate-700 bg-slate-900 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Chỉnh sửa dịch vụ</h2>
              <button
                onClick={() => setEditingService(null)}
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
                onClick={() => setEditingService(null)}
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
      {deletingService && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/50"
            onClick={() => setDeletingService(null)}
          />
          <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl border border-slate-700 bg-slate-900 p-6">
            <h2 className="text-lg font-semibold text-white">Xác nhận xóa</h2>
            <p className="mt-2 text-sm text-slate-400">
              Bạn có chắc chắn muốn xóa dịch vụ{" "}
              <span className="font-medium text-white">{deletingService.title}</span>? Hành
              động này không thể hoàn tác.
            </p>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setDeletingService(null)}
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
