"use client";

import { Suspense, useEffect, useState, useCallback, useRef, useMemo } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { DataTable } from "../../components/data-table";
import { FilterBar, type FilterDef } from "@/app/[locale]/admin/components/filter-bar";
import { Plus, Pencil, Trash2, X, Star, Image } from "lucide-react";
import { toast } from "sonner";
import { ImageUploader } from "@/components/ui/image-uploader";

interface Expertise {
  id: string;
  name: string;
  nameVi: string;
  category: string;
  categoryVi: string;
  icon: string | null;
  logo: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
}

const EXPERTISE_CATEGORIES = [
  { value: "frontend", label: "Frontend", labelVi: "Frontend" },
  { value: "backend", label: "Backend", labelVi: "Backend" },
  { value: "design", label: "Design", labelVi: "Thiết kế" },
  { value: "management", label: "Management", labelVi: "Quản lý" },
  { value: "marketing", label: "Marketing", labelVi: "Marketing" },
  { value: "data", label: "Data/AI", labelVi: "Data/AI" },
  { value: "devops", label: "DevOps", labelVi: "DevOps" },
  { value: "mobile", label: "Mobile", labelVi: "Di động" },
  { value: "other", label: "Other", labelVi: "Khác" },
];

const ICONS = [
  { value: "Code", label: "Code" },
  { value: "Palette", label: "Design" },
  { value: "Database", label: "Database" },
  { value: "Cloud", label: "Cloud" },
  { value: "Smartphone", label: "Mobile" },
  { value: "Brain", label: "AI/ML" },
  { value: "GitBranch", label: "DevOps" },
  { value: "BarChart", label: "Analytics" },
  { value: "Users", label: "Management" },
  { value: "Megaphone", label: "Marketing" },
  { value: "Shield", label: "Security" },
  { value: "TestTube", label: "Testing" },
];

interface FormData {
  name: string;
  nameVi: string;
  category: string;
  categoryVi: string;
  icon: string;
  logo: string;
  sortOrder: number;
  isActive: boolean;
}

const emptyForm: FormData = {
  name: "",
  nameVi: "",
  category: "frontend",
  categoryVi: "Frontend",
  icon: "Code",
  logo: "",
  sortOrder: 0,
  isActive: true,
};

export default function ExpertisesPage() {
  return (
    <Suspense>
      <ExpertisesContent />
    </Suspense>
  );
}

function ExpertisesContent() {
  const [data, setData] = useState<Expertise[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 0 });
  const [filterValues, setFilterValues] = useState<Record<string, string | string[]>>({});
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);

  const filterValuesRef = useRef(filterValues);
  useEffect(() => { filterValuesRef.current = filterValues; }, [filterValues]);

  const fetchData = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "50" });
      for (const [key, val] of Object.entries(filterValuesRef.current)) {
        if (val && val !== "all" && val !== "__all__") params.set(key, String(val));
      }
      const res = await fetch(`/api/admin/expertises?${params}`);
      const json = await res.json();
      setData(json.data || []);
      setPagination(json.pagination || { page: 1, limit: 50, total: 0, totalPages: 0 });
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

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (item: Expertise) => {
    setEditingId(item.id);
    setForm({
      name: item.name,
      nameVi: item.nameVi,
      category: item.category,
      categoryVi: item.categoryVi,
      icon: item.icon || "Code",
      logo: item.logo || "",
      sortOrder: item.sortOrder,
      isActive: item.isActive,
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!form.name || !form.nameVi) {
      toast.error("Vui lòng nhập tên");
      return;
    }

    setSaving(true);
    try {
      const url = editingId ? `/api/admin/expertises/${editingId}` : "/api/admin/expertises";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        toast.success(editingId ? "Cập nhật thành công" : "Thêm mới thành công");
        setShowModal(false);
        fetchData();
      } else {
        const err = await res.json();
        toast.error(err.error || "Có lỗi xảy ra");
      }
    } catch (e) {
      toast.error("Lỗi kết nối");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item: Expertise) => {
    if (!confirm(`Xóa "${item.name}"?`)) return;
    try {
      const res = await fetch(`/api/admin/expertises/${item.id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Xóa thành công");
        fetchData();
      } else {
        toast.error("Xóa thất bại");
      }
    } catch (e) {
      toast.error("Lỗi kết nối");
    }
  };

  const updateField = (field: keyof FormData, value: string | number | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const columns: ColumnDef<Expertise>[] = [
    {
      accessorKey: "name",
      header: "Skill",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          {row.original.logo ? (
            <img
              src={row.original.logo}
              alt={row.original.name}
              className="w-8 h-8 rounded object-contain bg-white"
            />
          ) : row.original.icon ? (
            <div className="w-8 h-8 rounded bg-slate-700 flex items-center justify-center text-xs font-medium text-white">
              {row.original.icon.substring(0, 3)}
            </div>
          ) : null}
          <div>
            <div className="text-white font-medium">{row.original.name}</div>
            <div className="text-xs text-slate-500">{row.original.nameVi}</div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "nameVi",
      header: "Tên (VN)",
    },
    {
      accessorKey: "category",
      header: "Danh mục",
      cell: ({ row }) => (
        <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded text-xs">
          {row.original.categoryVi}
        </span>
      ),
    },
    {
      accessorKey: "sortOrder",
      header: "Thứ tự",
    },
    {
      accessorKey: "isActive",
      header: "Trạng thái",
      cell: ({ row }) => (
        <span className={`px-2 py-1 rounded text-xs ${row.original.isActive ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
          {row.original.isActive ? "Hoạt động" : "Tắt"}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Thao tác",
      cell: ({ row }) => (
        <div className="flex gap-2">
          <button
            onClick={() => openEdit(row.original)}
            className="p-1.5 text-blue-400 hover:bg-blue-500/20 rounded"
          >
            <Pencil size={16} />
          </button>
          <button
            onClick={() => handleDelete(row.original)}
            className="p-1.5 text-red-400 hover:bg-red-500/20 rounded"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Quản lý Expertise</h1>
          <p className="text-slate-400 text-sm">Kỹ năng chuyên môn của team</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
        >
          <Plus size={18} />
          Thêm mới
        </button>
      </div>

      <FilterBar
        filters={[
          { key: "isActive", label: "Trạng thái", type: "boolean" },
          {
            key: "category",
            label: "Danh mục",
            type: "select",
            options: [
              { value: "frontend", label: "Frontend" },
              { value: "backend", label: "Backend" },
              { value: "design", label: "Design" },
              { value: "management", label: "Management" },
              { value: "marketing", label: "Marketing" },
              { value: "data", label: "Data/AI" },
              { value: "devops", label: "DevOps" },
              { value: "mobile", label: "Mobile" },
              { value: "other", label: "Other" },
            ],
          },
        ]}
        onChange={(vals) => {
          setFilterValues(vals);
          fetchData(1);
        }}
      />

      <DataTable columns={columns} data={data} loading={loading} />

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-xl border border-slate-700 bg-slate-900 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">
                {editingId ? "Chỉnh sửa" : "Thêm mới"}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Tên (EN) *</label>
                  <input
                    value={form.name}
                    onChange={(e) => updateField("name", e.target.value)}
                    placeholder="React"
                    className="w-full h-10 px-3 rounded-lg bg-slate-800 border border-slate-700 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Tên (VN) *</label>
                  <input
                    value={form.nameVi}
                    onChange={(e) => updateField("nameVi", e.target.value)}
                    placeholder="React"
                    className="w-full h-10 px-3 rounded-lg bg-slate-800 border border-slate-700 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Danh mục</label>
                  <select
                    value={form.category}
                    onChange={(e) => {
                      const cat = EXPERTISE_CATEGORIES.find(c => c.value === e.target.value);
                      updateField("category", e.target.value);
                      updateField("categoryVi", cat?.labelVi || e.target.value);
                    }}
                    className="w-full h-10 px-3 rounded-lg bg-slate-800 border border-slate-700 text-white"
                  >
                    {EXPERTISE_CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>{cat.labelVi}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Icon (fallback)</label>
                  <select
                    value={form.icon}
                    onChange={(e) => updateField("icon", e.target.value)}
                    className="w-full h-10 px-3 rounded-lg bg-slate-800 border border-slate-700 text-white"
                  >
                    {ICONS.map((icon) => (
                      <option key={icon.value} value={icon.value}>{icon.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">Logo hình ảnh</label>
                <ImageUploader
                  value={form.logo}
                  onChange={(url) => updateField("logo", url)}
                  folder="loop/expertises"
                  aspectRatio="square"
                  placeholder="Upload logo cho skill"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">Thứ tự</label>
                <input
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) => updateField("sortOrder", parseInt(e.target.value) || 0)}
                  className="w-full h-10 px-3 rounded-lg bg-slate-800 border border-slate-700 text-white"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => updateField("isActive", e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-white">Hoạt động</span>
              </label>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-2 border border-slate-700 text-slate-300 rounded-lg hover:bg-slate-800"
              >
                Hủy
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50"
              >
                {saving ? "Đang lưu..." : "Lưu"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
