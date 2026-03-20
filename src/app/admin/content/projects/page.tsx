"use client";

import { Suspense, useEffect, useState, useCallback, useRef } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { DataTable } from "../../components/data-table";
import { FilterBar, type FilterDef } from "../components/filter-bar";
import { Plus, Pencil, Trash2, Eye, EyeOff, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ImageUploader } from "@/components/ui/image-uploader";

interface Project {
  id: string;
  slug: string;
  title: string;
  category: string;
  client: string;
  year: string;
  image: string;
  description: string;
  techStack: string[];
  features: string[];
  results: string;
  screenshots: string[];
  isPublished: boolean;
  sortOrder: number;
  createdAt: string;
  serviceId: string | null;
  service: { title: string } | null;
}

interface ServiceOption {
  id: string;
  title: string;
}

interface ProjectFormData {
  title: string;
  slug: string;
  category: string;
  client: string;
  year: string;
  image: string;
  description: string;
  techStack: string;
  features: string;
  results: string;
  screenshots: string;
  serviceId: string;
  isPublished: boolean;
  sortOrder: number;
}

const emptyForm: ProjectFormData = {
  title: "",
  slug: "",
  category: "",
  client: "",
  year: new Date().getFullYear().toString(),
  image: "",
  description: "",
  techStack: "",
  features: "",
  results: "",
  screenshots: "",
  serviceId: "",
  isPublished: false,
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

export default function AdminProjectsPage() {
  return (
    <Suspense>
      <AdminProjectsContent />
    </Suspense>
  );
}

function AdminProjectsContent() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [filterValues, setFilterValues] = useState<Record<string, string | string[]>>({});

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProjectFormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [slugManual, setSlugManual] = useState(false);

  const filterValuesRef = useRef(filterValues);
  useEffect(() => { filterValuesRef.current = filterValues; }, [filterValues]);

  const fetchData = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      for (const [key, val] of Object.entries(filterValuesRef.current)) {
        if (val && val !== "all" && val !== "__all__") params.set(key, String(val));
      }
      const res = await fetch(`/api/admin/projects?${params}`);
      const data = await res.json();
      setProjects(data.data || []);
      setPagination(data.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 });
    } catch (e) {
      toast.error("Lỗi kết nối");
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchServices = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/services?limit=100");
      const data = await res.json();
      setServices((data.data || []).map((s: { id: string; title: string }) => ({ id: s.id, title: s.title })));
    } catch (e) {
      toast.error("Lỗi kết nết nối");
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { fetchServices(); }, [fetchServices]);

  // --- Handlers ---

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setSlugManual(false);
    setModalOpen(true);
  };

  const openEdit = async (project: Project) => {
    setEditingId(project.id);
    setForm({
      title: project.title,
      slug: project.slug,
      category: project.category,
      client: project.client,
      year: project.year,
      image: project.image || "",
      description: project.description || "",
      techStack: (project.techStack || []).join(", "),
      features: (project.features || []).join(", "),
      results: project.results || "",
      screenshots: (project.screenshots || []).join(", "),
      serviceId: project.serviceId || "",
      isPublished: project.isPublished,
      sortOrder: project.sortOrder,
    });
    setSlugManual(true);
    setModalOpen(true);
  };

  const handleDelete = async (project: Project) => {
    if (!confirm(`Bạn có chắc muốn xóa dự án "${project.title}"?`)) return;
    try {
      const res = await fetch(`/api/admin/projects/${project.id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Xóa thất bại");
        return;
      }
      toast.success("Xóa dự án thành công");
      fetchData(pagination.page);
    } catch (e) {
      toast.error("Lỗi kết nối");
    }
  };

  const togglePublish = async (project: Project) => {
    try {
      const res = await fetch(`/api/admin/projects/${project.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: !project.isPublished }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Cập nhật thất bại");
        return;
      }
      toast.success("Cập nhật trạng thái thành công");
      fetchData(pagination.page);
    } catch (e) {
      toast.error("Lỗi kết nối");
    }
  };

  const handleSave = async () => {
    if (!form.title.trim()) { alert("Vui lòng nhập tên dự án"); return; }
    if (!form.slug.trim()) { alert("Vui lòng nhập slug"); return; }

    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        title: form.title.trim(),
        slug: form.slug.trim(),
        category: form.category.trim(),
        client: form.client.trim(),
        year: form.year.trim(),
        image: form.image.trim(),
        description: form.description.trim(),
        techStack: form.techStack ? form.techStack.split(",").map((s) => s.trim()).filter(Boolean) : [],
        features: form.features ? form.features.split(",").map((s) => s.trim()).filter(Boolean) : [],
        results: form.results.trim(),
        screenshots: form.screenshots ? form.screenshots.split(",").map((s) => s.trim()).filter(Boolean) : [],
        isPublished: form.isPublished,
        sortOrder: form.sortOrder,
        serviceId: form.serviceId || null,
      };

      const url = editingId ? `/api/admin/projects/${editingId}` : "/api/admin/projects";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Lưu thất bại");
        return;
      }

      setModalOpen(false);
      toast.success(editingId ? "Cập nhật dự án thành công" : "Tạo dự án thành công");
      fetchData(pagination.page);
    } catch (e) {
      toast.error("Lỗi kết nối");
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: keyof ProjectFormData, value: string | boolean | number) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "title" && !slugManual) {
        next.slug = slugify(value as string);
      }
      return next;
    });
  };

  // --- Columns (inside component to access handlers) ---

  const columns: ColumnDef<Project, unknown>[] = [
    {
      accessorKey: "title",
      header: "Dự án",
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-white">{row.original.title}</p>
          <p className="text-xs text-slate-500">{row.original.client} - {row.original.year}</p>
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
      id: "service",
      header: "Dịch vụ",
      cell: ({ row }) => (
        <span className="text-slate-300">{row.original.service?.title || "—"}</span>
      ),
    },
    {
      accessorKey: "isPublished",
      header: "Trạng thái",
      cell: ({ row }) => (
        <button
          type="button"
          onClick={() => togglePublish(row.original)}
          className={`inline-flex cursor-pointer items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium transition-colors ${
            row.original.isPublished
              ? "bg-green-500/20 text-green-400 hover:bg-green-500/30"
              : "bg-red-500/20 text-red-400 hover:bg-red-500/30"
          }`}
        >
          {row.original.isPublished ? <><Eye size={12} /> Published</> : <><EyeOff size={12} /> Draft</>}
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
            onClick={() => handleDelete(row.original)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-red-400"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  // --- Render ---

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Quản lý Dự án</h1>
          <p className="text-sm text-slate-400">Portfolio và case studies</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus size={16} />
          Thêm dự án
        </button>
      </div>

      <FilterBar
        filters={[
          {
            key: "isPublished",
            label: "Trạng thái",
            type: "boolean",
          },
          {
            key: "createdAt",
            label: "Ngày tạo",
            type: "date-range",
          },
        ]}
        onChange={(vals) => {
          setFilterValues(vals);
          fetchData(1);
        }}
      />

      <DataTable
        data={projects}
        columns={columns}
        loading={loading}
        searchPlaceholder="Tìm dự án..."
        pagination={pagination}
        onSearch={() => {}}
        onPageChange={(page) => fetchData(page)}
      />

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-slate-700 bg-slate-900 p-6">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">
                {editingId ? "Chỉnh sửa dự án" : "Thêm dự án mới"}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Title & Slug */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-300">Tên dự án *</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => updateField("title", e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                    placeholder="Tên dự án"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-300">Slug *</label>
                  <input
                    type="text"
                    value={form.slug}
                    onChange={(e) => { setSlugManual(true); updateField("slug", e.target.value); }}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                    placeholder="du-an-slug"
                  />
                </div>
              </div>

              {/* Category, Client, Year */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-300">Danh mục</label>
                  <input
                    type="text"
                    value={form.category}
                    onChange={(e) => updateField("category", e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                    placeholder="Web App"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-300">Khách hàng</label>
                  <input
                    type="text"
                    value={form.client}
                    onChange={(e) => updateField("client", e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                    placeholder="Tên khách hàng"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-300">Năm</label>
                  <input
                    type="text"
                    value={form.year}
                    onChange={(e) => updateField("year", e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                    placeholder="2024"
                  />
                </div>
              </div>

              {/* Image URL */}
              <div>
                <ImageUploader
                  label="Ảnh đại diện"
                  value={form.image}
                  onChange={(url) => updateField("image", url)}
                  folder="loop/projects"
                  aspectRatio="landscape"
                />
              </div>

              {/* Description */}
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-300">Mô tả</label>
                <textarea
                  value={form.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                  placeholder="Mô tả chi tiết dự án..."
                />
              </div>

              {/* Results */}
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-300">Kết quả</label>
                <textarea
                  value={form.results}
                  onChange={(e) => updateField("results", e.target.value)}
                  rows={2}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                  placeholder="Kết quả đạt được..."
                />
              </div>

              {/* Tech Stack */}
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-300">Tech Stack (phân cách bằng dấu phẩy)</label>
                <input
                  type="text"
                  value={form.techStack}
                  onChange={(e) => updateField("techStack", e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                  placeholder="React, Next.js, TypeScript"
                />
              </div>

              {/* Features */}
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-300">Tính năng (phân cách bằng dấu phẩy)</label>
                <input
                  type="text"
                  value={form.features}
                  onChange={(e) => updateField("features", e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                  placeholder="SSR, Auth, Dashboard"
                />
              </div>

              {/* Screenshots */}
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-300">Screenshots (URLs phân cách bằng dấu phẩy)</label>
                <input
                  type="text"
                  value={form.screenshots}
                  onChange={(e) => updateField("screenshots", e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                  placeholder="https://example.com/ss1.jpg, https://example.com/ss2.jpg"
                />
              </div>

              {/* Service dropdown */}
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-300">Dịch vụ liên kết</label>
                <select
                  value={form.serviceId}
                  onChange={(e) => updateField("serviceId", e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="">— Không chọn —</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>{s.title}</option>
                  ))}
                </select>
              </div>

              {/* isPublished & sortOrder */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 pt-5">
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      checked={form.isPublished}
                      onChange={(e) => updateField("isPublished", e.target.checked)}
                      className="peer sr-only"
                    />
                    <div className="h-5 w-9 rounded-full bg-slate-700 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-slate-400 after:transition-all peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:bg-white" />
                  </label>
                  <span className="text-sm text-slate-300">Xuất bản</span>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-300">Thứ tự sắp xếp</label>
                  <input
                    type="number"
                    value={form.sortOrder}
                    onChange={(e) => updateField("sortOrder", parseInt(e.target.value) || 0)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
              >
                Hủy
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {saving && <Loader2 size={14} className="animate-spin" />}
                {editingId ? "Cập nhật" : "Tạo mới"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
