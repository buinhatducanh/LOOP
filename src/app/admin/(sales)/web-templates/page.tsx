"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { DataTable } from "../../components/data-table";
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  X,
  Loader2,
  ExternalLink,
  Star,
  Layout,
} from "lucide-react";
import { toast } from "sonner";

// ─── Types ──────────────────────────────────────────────────

interface BundledAttribute {
  id: string;
  attribute: { id: string; name: string; nameVi: string; icon: string | null };
}

interface WebTemplate {
  id: string;
  slug: string;
  name: string;
  nameVi: string;
  description: string | null;
  descriptionVi: string | null;
  category: string;
  categoryVi: string;
  thumbnail: string;
  screenshots: string[];
  demoUrl: string;
  price: number;
  originalPrice: number | null;
  currency: string;
  technologies: string[];
  deliveryTime: string;
  highlighted: boolean;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  bundledAttributes: BundledAttribute[];
  _count: { orders: number };
}

interface ServiceAttributeOption {
  id: string;
  name: string;
  nameVi: string;
  category: string;
  categoryVi: string;
}

interface FormData {
  slug: string;
  name: string;
  nameVi: string;
  description: string;
  descriptionVi: string;
  category: string;
  categoryVi: string;
  thumbnail: string;
  screenshots: string;
  demoUrl: string;
  price: number;
  originalPrice: number | string;
  currency: string;
  technologies: string;
  deliveryTime: string;
  highlighted: boolean;
  sortOrder: number;
  isActive: boolean;
  attributeIds: string[];
}

const emptyForm: FormData = {
  slug: "",
  name: "",
  nameVi: "",
  description: "",
  descriptionVi: "",
  category: "",
  categoryVi: "",
  thumbnail: "",
  screenshots: "",
  demoUrl: "",
  price: 0,
  originalPrice: "",
  currency: "VND",
  technologies: "",
  deliveryTime: "",
  highlighted: false,
  sortOrder: 0,
  isActive: true,
  attributeIds: [],
};

const TEMPLATE_CATEGORIES = [
  { value: "landing-page", label: "Landing Page" },
  { value: "ecommerce", label: "Thương mại điện tử" },
  { value: "portfolio", label: "Portfolio" },
  { value: "corporate", label: "Doanh nghiệp" },
  { value: "blog", label: "Blog" },
  { value: "saas", label: "SaaS" },
  { value: "other", label: "Khác" },
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

export default function WebTemplatesPage() {
  const [data, setData] = useState<WebTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [search, setSearch] = useState("");

  const [allAttributes, setAllAttributes] = useState<ServiceAttributeOption[]>([]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingItem, setEditingItem] = useState<WebTemplate | null>(null);
  const [deletingItem, setDeletingItem] = useState<WebTemplate | null>(null);
  const [formData, setFormData] = useState<FormData>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  const fetchData = useCallback(async (page = 1, searchQuery = "") => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (searchQuery) params.set("search", searchQuery);
      const res = await fetch(`/api/admin/web-templates?${params}`);
      const json = await res.json();
      setData(json.data || []);
      setPagination(json.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 });
    } catch {
      toast.error("Lỗi kết nối");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAttributes = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/service-attributes?limit=200");
      const json = await res.json();
      setAllAttributes(json.data || []);
    } catch {
      /* silent */
    }
  }, []);

  useEffect(() => {
    fetchData();
    fetchAttributes();
  }, [fetchData, fetchAttributes]);

  const handleCreate = () => {
    setFormData(emptyForm);
    setFormError("");
    setShowCreateModal(true);
  };

  const handleEdit = async (item: WebTemplate) => {
    setFormError("");
    setEditLoading(true);
    setEditingItem(item);
    try {
      const res = await fetch(`/api/admin/web-templates/${item.id}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Lỗi tải dữ liệu");
      const t = json.data;
      setFormData({
        slug: t.slug || "",
        name: t.name || "",
        nameVi: t.nameVi || "",
        description: t.description || "",
        descriptionVi: t.descriptionVi || "",
        category: t.category || "",
        categoryVi: t.categoryVi || "",
        thumbnail: t.thumbnail || "",
        screenshots: (t.screenshots || []).join("\n"),
        demoUrl: t.demoUrl || "",
        price: t.price || 0,
        originalPrice: t.originalPrice || "",
        currency: t.currency || "VND",
        technologies: (t.technologies || []).join(", "),
        deliveryTime: t.deliveryTime || "",
        highlighted: t.highlighted ?? false,
        sortOrder: t.sortOrder || 0,
        isActive: t.isActive ?? true,
        attributeIds: (t.bundledAttributes || []).map(
          (ba: BundledAttribute) => ba.attribute.id
        ),
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Lỗi tải dữ liệu";
      setFormError(msg);
      toast.error(msg);
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = (item: WebTemplate) => {
    setDeletingItem(item);
  };

  const handleToggleActive = async (item: WebTemplate) => {
    try {
      const res = await fetch(`/api/admin/web-templates/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: item.slug,
          name: item.name,
          nameVi: item.nameVi,
          category: item.category,
          categoryVi: item.categoryVi,
          thumbnail: item.thumbnail,
          demoUrl: item.demoUrl,
          price: item.price,
          deliveryTime: item.deliveryTime,
          isActive: !item.isActive,
        }),
      });
      if (!res.ok) throw new Error("Lỗi cập nhật");
      toast.success("Cập nhật trạng thái thành công");
      await fetchData(pagination.page, search);
    } catch {
      toast.error("Lỗi kết nối");
    }
  };

  const buildPayload = () => ({
    slug: formData.slug,
    name: formData.name,
    nameVi: formData.nameVi,
    description: formData.description || null,
    descriptionVi: formData.descriptionVi || null,
    category: formData.category,
    categoryVi: formData.categoryVi,
    thumbnail: formData.thumbnail,
    screenshots: formData.screenshots
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean),
    demoUrl: formData.demoUrl,
    price: Number(formData.price),
    originalPrice: formData.originalPrice ? Number(formData.originalPrice) : null,
    currency: formData.currency,
    technologies: formData.technologies
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    deliveryTime: formData.deliveryTime,
    highlighted: formData.highlighted,
    sortOrder: Number(formData.sortOrder),
    isActive: formData.isActive,
    attributeIds: formData.attributeIds,
  });

  const submitCreate = async () => {
    setSubmitting(true);
    setFormError("");
    try {
      const res = await fetch("/api/admin/web-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload()),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Lỗi tạo giao diện");
      setShowCreateModal(false);
      toast.success("Tạo giao diện thành công");
      await fetchData(pagination.page, search);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Lỗi tạo giao diện";
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
      const res = await fetch(`/api/admin/web-templates/${editingItem.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload()),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Lỗi cập nhật");
      setEditingItem(null);
      toast.success("Cập nhật giao diện thành công");
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
      const res = await fetch(`/api/admin/web-templates/${deletingItem.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Lỗi xóa");
      }
      setDeletingItem(null);
      toast.success("Xóa giao diện thành công");
      await fetchData(pagination.page, search);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi kết nối");
    } finally {
      setSubmitting(false);
    }
  };

  const updateField = (field: keyof FormData, value: string | number | boolean | string[]) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "nameVi" && showCreateModal) {
        next.slug = slugify(value as string);
      }
      if (field === "category") {
        const cat = TEMPLATE_CATEGORIES.find((c) => c.value === value);
        if (cat) next.categoryVi = cat.label;
      }
      return next;
    });
  };

  const toggleAttribute = (attrId: string) => {
    setFormData((prev) => {
      const ids = prev.attributeIds.includes(attrId)
        ? prev.attributeIds.filter((id) => id !== attrId)
        : [...prev.attributeIds, attrId];
      return { ...prev, attributeIds: ids };
    });
  };

  // ─── Columns ──────────────────────────────────────────────────

  const columns: ColumnDef<WebTemplate, unknown>[] = useMemo(
    () => [
      {
        accessorKey: "nameVi",
        header: "Giao diện",
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            {row.original.thumbnail ? (
              <img
                src={row.original.thumbnail}
                alt={row.original.nameVi}
                className="h-10 w-16 rounded border border-slate-700 object-cover"
              />
            ) : (
              <div className="flex h-10 w-16 items-center justify-center rounded border border-slate-700 bg-slate-800">
                <Layout size={16} className="text-slate-500" />
              </div>
            )}
            <div>
              <p className="font-medium text-white">
                {row.original.nameVi}
                {row.original.highlighted && (
                  <Star size={12} className="ml-1 inline text-amber-400" />
                )}
              </p>
              <p className="text-xs text-slate-500">{row.original.name}</p>
            </div>
          </div>
        ),
      },
      {
        accessorKey: "categoryVi",
        header: "Loại",
        cell: ({ row }) => (
          <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-300">
            {row.original.categoryVi}
          </span>
        ),
      },
      {
        accessorKey: "price",
        header: "Giá",
        cell: ({ row }) => (
          <div>
            <span className="font-medium text-green-400">
              {row.original.price.toLocaleString("vi-VN")}đ
            </span>
            {row.original.originalPrice && (
              <span className="ml-1 text-xs text-slate-500 line-through">
                {row.original.originalPrice.toLocaleString("vi-VN")}đ
              </span>
            )}
          </div>
        ),
      },
      {
        id: "features",
        header: "Tính năng",
        cell: ({ row }) => (
          <span className="text-sm text-slate-300">
            {row.original.bundledAttributes.length} tính năng
          </span>
        ),
      },
      {
        id: "demo",
        header: "Demo",
        cell: ({ row }) =>
          row.original.demoUrl ? (
            <a
              href={row.original.demoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
            >
              <ExternalLink size={12} />
              Xem demo
            </a>
          ) : (
            <span className="text-xs text-slate-500">-</span>
          ),
      },
      {
        id: "orders",
        header: "Đơn hàng",
        cell: ({ row }) => (
          <span className="text-slate-300">{row.original._count.orders}</span>
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

  // ─── Grouped attributes for checkbox list ────────────────────

  const groupedAttributes = useMemo(() => {
    const groups: Record<string, { categoryVi: string; items: ServiceAttributeOption[] }> = {};
    for (const attr of allAttributes) {
      if (!groups[attr.category]) {
        groups[attr.category] = { categoryVi: attr.categoryVi, items: [] };
      }
      groups[attr.category].items.push(attr);
    }
    return groups;
  }, [allAttributes]);

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
            placeholder="VD: Mẫu Web Bán Hàng Pro"
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-300">Tên (English)</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => updateField("name", e.target.value)}
            placeholder="VD: Pro E-Commerce Template"
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-slate-300">Slug</label>
          <input
            type="text"
            value={formData.slug}
            onChange={(e) => updateField("slug", e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-300">Loại giao diện</label>
          <select
            value={formData.category}
            onChange={(e) => updateField("category", e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
          >
            <option value="">-- Chọn loại --</option>
            {TEMPLATE_CATEGORIES.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-slate-300">Mô tả (Tiếng Việt)</label>
          <textarea
            value={formData.descriptionVi}
            onChange={(e) => updateField("descriptionVi", e.target.value)}
            rows={2}
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-300">Mô tả (English)</label>
          <textarea
            value={formData.description}
            onChange={(e) => updateField("description", e.target.value)}
            rows={2}
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-slate-300">Thumbnail URL</label>
        <input
          type="text"
          value={formData.thumbnail}
          onChange={(e) => updateField("thumbnail", e.target.value)}
          placeholder="https://..."
          className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
        />
      </div>

      <div>
        <label className="text-sm font-medium text-slate-300">Demo URL</label>
        <input
          type="text"
          value={formData.demoUrl}
          onChange={(e) => updateField("demoUrl", e.target.value)}
          placeholder="https://demo.vercel.app"
          className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
        />
      </div>

      <div>
        <label className="text-sm font-medium text-slate-300">
          Screenshots (mỗi URL một dòng)
        </label>
        <textarea
          value={formData.screenshots}
          onChange={(e) => updateField("screenshots", e.target.value)}
          rows={3}
          placeholder={"https://img1.jpg\nhttps://img2.jpg"}
          className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="text-sm font-medium text-slate-300">Giá (VNĐ)</label>
          <input
            type="number"
            value={formData.price}
            onChange={(e) =>
              updateField("price", e.target.value === "" ? 0 : Number(e.target.value))
            }
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-300">Giá gốc (tùy chọn)</label>
          <input
            type="number"
            value={formData.originalPrice}
            onChange={(e) => updateField("originalPrice", e.target.value)}
            placeholder="Để trống nếu không giảm giá"
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-300">Thời gian giao</label>
          <input
            type="text"
            value={formData.deliveryTime}
            onChange={(e) => updateField("deliveryTime", e.target.value)}
            placeholder="VD: 3-5 ngày"
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-slate-300">
          Công nghệ (phân cách bằng dấu phẩy)
        </label>
        <input
          type="text"
          value={formData.technologies}
          onChange={(e) => updateField("technologies", e.target.value)}
          placeholder="Next.js, TailwindCSS, PostgreSQL"
          className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="text-sm font-medium text-slate-300">Thứ tự</label>
          <input
            type="number"
            value={formData.sortOrder}
            onChange={(e) =>
              updateField("sortOrder", e.target.value === "" ? 0 : Number(e.target.value))
            }
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
          />
        </div>
        <div className="flex items-end gap-4 pb-1">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={formData.highlighted}
              onChange={(e) => updateField("highlighted", e.target.checked)}
              className="h-4 w-4 rounded border-slate-700 bg-slate-800 text-amber-500"
            />
            <span className="text-sm text-slate-300">Nổi bật</span>
          </label>
        </div>
        <div className="flex items-end pb-1">
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

      {/* Bundled Attributes (Tính năng đi kèm) */}
      <div>
        <label className="text-sm font-medium text-slate-300">
          Tính năng đi kèm (gắn cứng vào gói)
        </label>
        <p className="mb-2 text-xs text-slate-500">
          Tick chọn các tính năng sẽ được bao gồm khi khách mua mẫu này
        </p>
        <div className="max-h-48 space-y-3 overflow-y-auto rounded-lg border border-slate-700 bg-slate-800/50 p-3">
          {Object.entries(groupedAttributes).map(([category, group]) => (
            <div key={category}>
              <p className="mb-1 text-xs font-semibold uppercase text-slate-400">
                {group.categoryVi}
              </p>
              <div className="grid grid-cols-2 gap-1">
                {group.items.map((attr) => (
                  <label
                    key={attr.id}
                    className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-sm text-slate-300 hover:bg-slate-700"
                  >
                    <input
                      type="checkbox"
                      checked={formData.attributeIds.includes(attr.id)}
                      onChange={() => toggleAttribute(attr.id)}
                      className="h-3.5 w-3.5 rounded border-slate-600 bg-slate-700 text-blue-500"
                    />
                    {attr.nameVi}
                  </label>
                ))}
              </div>
            </div>
          ))}
          {allAttributes.length === 0 && (
            <p className="text-center text-sm text-slate-500">
              Chưa có tính năng nào. Hãy tạo tính năng trong &quot;Kho Tính Năng&quot; trước.
            </p>
          )}
        </div>
        <p className="mt-1 text-xs text-slate-500">
          Đã chọn: {formData.attributeIds.length} tính năng
        </p>
      </div>
    </div>
  );

  // ─── Render ──────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Kho Giao Diện</h1>
          <p className="text-sm text-slate-400">
            Quản lý mẫu website sẵn có (Web Gói — Ready-to-use Template)
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus size={16} />
          Thêm giao diện
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
          <div className="flex items-center gap-2 text-slate-400">
            <Layout size={16} />
            <span className="text-sm">Tổng mẫu</span>
          </div>
          <p className="mt-1 text-2xl font-bold text-white">{pagination.total}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
          <div className="text-sm text-slate-400">Đang hiển thị</div>
          <p className="mt-1 text-2xl font-bold text-green-400">
            {data.filter((d) => d.isActive).length}
          </p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
          <div className="text-sm text-slate-400">Nổi bật</div>
          <p className="mt-1 text-2xl font-bold text-amber-400">
            {data.filter((d) => d.highlighted).length}
          </p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
          <div className="text-sm text-slate-400">Tổng đơn</div>
          <p className="mt-1 text-2xl font-bold text-blue-400">
            {data.reduce((sum, d) => sum + d._count.orders, 0)}
          </p>
        </div>
      </div>

      <DataTable
        data={data}
        columns={columns}
        loading={loading}
        searchPlaceholder="Tìm giao diện..."
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
          <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-3xl -translate-x-1/2 -translate-y-1/2 rounded-xl border border-slate-700 bg-slate-900 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Thêm giao diện mới</h2>
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
                Tạo giao diện
              </button>
            </div>
          </div>
        </>
      )}

      {/* Edit Modal */}
      {editingItem && (
        <>
          <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setEditingItem(null)} />
          <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-3xl -translate-x-1/2 -translate-y-1/2 rounded-xl border border-slate-700 bg-slate-900 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Chỉnh sửa giao diện</h2>
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
              Bạn có chắc chắn muốn xóa giao diện{" "}
              <span className="font-medium text-white">{deletingItem.nameVi}</span>? Hành động
              này không thể hoàn tác.
            </p>
            {deletingItem._count.orders > 0 && (
              <div className="mt-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-400">
                Giao diện này đang có {deletingItem._count.orders} đơn hàng liên quan.
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
                Xóa giao diện
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
