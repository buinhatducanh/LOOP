"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronRight,
  Layers,
  X,
  Save,
  Loader2,
  Globe,
  Server,
  AtSign,
  Package,
  Check,
  Minus,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────

interface WebPackage {
  id: string;
  slug: string;
  name: string;
  nameVi: string;
  tagline: string;
  taglineVi: string;
  price: number;
  currency: string;
  period: string;
  periodVi: string;
  highlighted: boolean;
  cta: string;
  ctaVi: string;
  color: string;
  pages: string;
  pagesVi: string;
  sortOrder: number;
  isActive: boolean;
}

interface ComparisonFeature {
  id: string;
  categoryId: string;
  name: string;
  nameVi: string;
  tooltip: string | null;
  tooltipVi: string | null;
  values: Record<string, boolean | string>;
  sortOrder: number;
  isActive: boolean;
}

interface FeatureCategory {
  id: string;
  slug: string;
  name: string;
  nameVi: string;
  sortOrder: number;
  isActive: boolean;
  features: ComparisonFeature[];
}

interface HostingPlan {
  id: string;
  slug: string;
  name: string;
  nameVi: string;
  price: number;
  period: string;
  periodVi: string;
  features: string[];
  featuresVi: string[];
  highlighted: boolean;
  color: string;
  sortOrder: number;
  isActive: boolean;
}

interface DomainPrice {
  id: string;
  extension: string;
  registrationPrice: number;
  renewalPrice: number;
  period: string;
  periodVi: string;
  note: string | null;
  noteVi: string | null;
  sortOrder: number;
  isActive: boolean;
}

interface DeploymentItem {
  id: string;
  slug: string;
  title: string;
  titleVi: string;
  description: string;
  descriptionVi: string;
  handedToClient: boolean;
  icon: string;
  note: string | null;
  noteVi: string | null;
  sortOrder: number;
  isActive: boolean;
}

type TabKey = "web" | "comparison" | "hosting" | "domain" | "deployment";

const formatPrice = (price: number) =>
  new Intl.NumberFormat("vi-VN").format(price) + " ₫";

const tabs: { key: TabKey; label: string; icon: typeof Package }[] = [
  { key: "web", label: "Gói Web", icon: Package },
  { key: "comparison", label: "So sánh tính năng", icon: Layers },
  { key: "hosting", label: "Hosting", icon: Server },
  { key: "domain", label: "Domain", icon: Globe },
  { key: "deployment", label: "Bàn giao", icon: Check },
];

const autoSlug = (name: string) =>
  name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

// ─── Main Page ──────────────────────────────────────────────

export default function AdminPackagesPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("web");
  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const handleSeed = async () => {
    if (!confirm("Seed sẽ xóa toàn bộ dữ liệu hiện tại và thay bằng dữ liệu mặc định. Tiếp tục?")) return;
    setSeeding(true);
    try {
      const res = await fetch("/api/admin/packages/seed", { method: "POST" });
      if (res.ok) {
        alert("Seed thành công! Dữ liệu đã được ghi vào database.");
        window.location.reload();
      } else {
        const json = await res.json();
        alert("Lỗi: " + json.error);
      }
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Quản lý Gói dịch vụ</h1>
          <p className="text-sm text-slate-400">
            Quản lý gói web, so sánh tính năng, hosting, domain và bàn giao
          </p>
        </div>
        <button
          onClick={handleSeed}
          disabled={seeding}
          className="flex items-center gap-2 rounded-lg border border-amber-600/40 bg-amber-600/10 px-4 py-2 text-sm font-medium text-amber-400 hover:bg-amber-600/20 hover:border-amber-500/60 transition-colors disabled:opacity-50"
        >
          {seeding ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-amber-400/30 border-t-amber-400" />
              Đang seed...
            </>
          ) : (
            <>🌱 Seed Dữ Liệu Mặc Định</>
          )}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border border-slate-800 bg-slate-900/50 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "bg-blue-600/20 text-blue-400"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "web" && <WebPackagesTab loading={loading} setLoading={setLoading} />}
      {activeTab === "comparison" && <ComparisonTab loading={loading} setLoading={setLoading} />}
      {activeTab === "hosting" && <HostingTab loading={loading} setLoading={setLoading} />}
      {activeTab === "domain" && <DomainTab loading={loading} setLoading={setLoading} />}
      {activeTab === "deployment" && <DeploymentTab loading={loading} setLoading={setLoading} />}
    </div>
  );
}

// ─── Web Packages Tab ───────────────────────────────────────

function WebPackagesTab({ loading: _l, setLoading }: { loading: boolean; setLoading: (v: boolean) => void }) {
  const [packages, setPackages] = useState<WebPackage[]>([]);
  const [loading, setLocalLoading] = useState(true);
  const [modal, setModal] = useState<{ open: boolean; editing?: WebPackage }>({ open: false });

  const fetchData = useCallback(async () => {
    setLocalLoading(true);
    try {
      const res = await fetch("/api/admin/packages/web-packages");
      const json = await res.json();
      setPackages(json.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLocalLoading(false);
      setLoading(false);
    }
  }, [setLoading]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDelete = async (id: string) => {
    if (!confirm("Xóa gói web này?")) return;
    await fetch(`/api/admin/packages/web-packages/${id}`, { method: "DELETE" });
    fetchData();
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <AddButton label="Thêm gói" onClick={() => setModal({ open: true })} />
      </div>

      {packages.length === 0 ? (
        <EmptyState message="Chưa có gói web nào" onAdd={() => setModal({ open: true })} />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/80 text-left text-[11px] uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3">Tên (EN / VI)</th>
                <th className="px-4 py-3">Giá</th>
                <th className="px-4 py-3">Số trang</th>
                <th className="px-4 py-3 text-center">Nổi bật</th>
                <th className="px-4 py-3 text-center">Active</th>
                <th className="px-4 py-3 w-20"></th>
              </tr>
            </thead>
            <tbody>
              {packages.map((pkg) => (
                <tr key={pkg.id} className="border-b border-slate-800/50 text-slate-300 hover:bg-slate-800/30">
                  <td className="px-4 py-3">
                    <div className="font-medium text-white">{pkg.name}</div>
                    <div className="text-xs text-slate-500">{pkg.nameVi}</div>
                  </td>
                  <td className="px-4 py-3 font-mono text-green-400">{formatPrice(pkg.price)}</td>
                  <td className="px-4 py-3 text-slate-400">{pkg.pages}</td>
                  <td className="px-4 py-3 text-center">
                    {pkg.highlighted && (
                      <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-[10px] text-indigo-400">Popular</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <StatusBadge active={pkg.isActive} />
                  </td>
                  <td className="px-4 py-3">
                    <ActionButtons
                      onEdit={() => setModal({ open: true, editing: pkg })}
                      onDelete={() => handleDelete(pkg.id)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal.open && (
        <WebPackageModal
          editing={modal.editing}
          onClose={() => setModal({ open: false })}
          onSaved={fetchData}
        />
      )}
    </div>
  );
}

function WebPackageModal({ editing, onClose, onSaved }: { editing?: WebPackage; onClose: () => void; onSaved: () => void }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    slug: editing?.slug || "",
    name: editing?.name || "",
    nameVi: editing?.nameVi || "",
    tagline: editing?.tagline || "",
    taglineVi: editing?.taglineVi || "",
    price: editing?.price || 0,
    currency: editing?.currency || "VND",
    period: editing?.period || "one-time",
    periodVi: editing?.periodVi || "trọn gói",
    highlighted: editing?.highlighted || false,
    cta: editing?.cta || "Get Started",
    ctaVi: editing?.ctaVi || "Bắt Đầu",
    color: editing?.color || "#3B82F6",
    pages: editing?.pages || "",
    pagesVi: editing?.pagesVi || "",
    sortOrder: editing?.sortOrder || 0,
    isActive: editing?.isActive ?? true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = editing ? `/api/admin/packages/web-packages/${editing.id}` : "/api/admin/packages/web-packages";
      await fetch(url, {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={editing ? "Sửa gói web" : "Thêm gói web"} onClose={onClose} wide>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input label="Tên (EN)" value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v, slug: editing ? f.slug : autoSlug(v) }))} required />
          <Input label="Tên (VI)" value={form.nameVi} onChange={(v) => setForm((f) => ({ ...f, nameVi: v }))} required />
        </div>
        <Input label="Slug" value={form.slug} onChange={(v) => setForm((f) => ({ ...f, slug: v }))} />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Tagline (EN)" value={form.tagline} onChange={(v) => setForm((f) => ({ ...f, tagline: v }))} />
          <Input label="Tagline (VI)" value={form.taglineVi} onChange={(v) => setForm((f) => ({ ...f, taglineVi: v }))} />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <Input label="Giá (VNĐ)" type="number" value={form.price} onChange={(v) => setForm((f) => ({ ...f, price: parseInt(v) || 0 }))} required />
          <Input label="Số trang (EN)" value={form.pages} onChange={(v) => setForm((f) => ({ ...f, pages: v }))} />
          <Input label="Số trang (VI)" value={form.pagesVi} onChange={(v) => setForm((f) => ({ ...f, pagesVi: v }))} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="CTA (EN)" value={form.cta} onChange={(v) => setForm((f) => ({ ...f, cta: v }))} />
          <Input label="CTA (VI)" value={form.ctaVi} onChange={(v) => setForm((f) => ({ ...f, ctaVi: v }))} />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <Input label="Màu sắc" value={form.color} onChange={(v) => setForm((f) => ({ ...f, color: v }))} />
          <Input label="Thứ tự" type="number" value={form.sortOrder} onChange={(v) => setForm((f) => ({ ...f, sortOrder: parseInt(v) || 0 }))} />
          <div className="flex items-end gap-4">
            <Checkbox label="Nổi bật" checked={form.highlighted} onChange={(v) => setForm((f) => ({ ...f, highlighted: v }))} />
            <Checkbox label="Hiển thị" checked={form.isActive} onChange={(v) => setForm((f) => ({ ...f, isActive: v }))} />
          </div>
        </div>
        <ModalActions onClose={onClose} saving={saving} label={editing ? "Cập nhật" : "Tạo gói"} />
      </form>
    </Modal>
  );
}

// ─── Comparison Tab ─────────────────────────────────────────

function ComparisonTab({ setLoading }: { loading: boolean; setLoading: (v: boolean) => void }) {
  const [categories, setCategories] = useState<FeatureCategory[]>([]);
  const [packages, setPackages] = useState<WebPackage[]>([]);
  const [loading, setLocalLoading] = useState(true);
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());
  const [catModal, setCatModal] = useState<{ open: boolean; editing?: FeatureCategory }>({ open: false });
  const [featureModal, setFeatureModal] = useState<{ open: boolean; categoryId?: string; editing?: ComparisonFeature }>({ open: false });

  const fetchData = useCallback(async () => {
    setLocalLoading(true);
    try {
      const [catRes, pkgRes] = await Promise.all([
        fetch("/api/admin/packages/feature-categories"),
        fetch("/api/admin/packages/web-packages"),
      ]);
      const catJson = await catRes.json();
      const pkgJson = await pkgRes.json();
      setCategories(catJson.data || []);
      setPackages(pkgJson.data || []);
      setExpandedCats(new Set((catJson.data || []).map((c: FeatureCategory) => c.id)));
    } catch (e) {
      console.error(e);
    } finally {
      setLocalLoading(false);
      setLoading(false);
    }
  }, [setLoading]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const toggleCat = (id: string) => {
    setExpandedCats((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleDeleteCat = async (id: string) => {
    if (!confirm("Xóa nhóm tính năng này? Tất cả features bên trong sẽ bị xóa.")) return;
    await fetch(`/api/admin/packages/feature-categories/${id}`, { method: "DELETE" });
    fetchData();
  };

  const handleDeleteFeature = async (id: string) => {
    if (!confirm("Xóa tính năng so sánh này?")) return;
    await fetch(`/api/admin/packages/comparison-features/${id}`, { method: "DELETE" });
    fetchData();
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <AddButton label="Thêm nhóm" onClick={() => setCatModal({ open: true })} />
      </div>

      {categories.length === 0 ? (
        <EmptyState message="Chưa có nhóm tính năng so sánh" onAdd={() => setCatModal({ open: true })} />
      ) : (
        <div className="space-y-3">
          {categories.map((cat) => (
            <div key={cat.id} className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
              <div className="flex items-center gap-3 border-b border-slate-800/50 px-4 py-3">
                <button onClick={() => toggleCat(cat.id)} className="text-slate-400 hover:text-white transition-colors">
                  {expandedCats.has(cat.id) ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                </button>
                <Layers size={18} className="text-blue-400" />
                <span className="font-semibold text-white flex-1">{cat.name} / {cat.nameVi}</span>
                <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-400">
                  {cat.features.length} tính năng
                </span>
                <ActionButtons
                  onEdit={() => setCatModal({ open: true, editing: cat })}
                  onDelete={() => handleDeleteCat(cat.id)}
                />
              </div>

              {expandedCats.has(cat.id) && (
                <div className="p-3 space-y-2">
                  {cat.features.map((f) => (
                    <div key={f.id} className="flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-900/80 px-4 py-2.5">
                      <span className="font-medium text-slate-200 flex-1">
                        {f.name} <span className="text-slate-500">/ {f.nameVi}</span>
                      </span>
                      <div className="flex gap-1.5">
                        {packages.map((pkg) => {
                          const val = (f.values as Record<string, boolean | string>)[pkg.slug];
                          const isFree = typeof val === "string" && /^mi[ễe]n\s*ph[ií]/i.test(val.trim());
                          return (
                            <span
                              key={pkg.slug}
                              className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                                val === true
                                  ? "bg-green-500/20 text-green-400"
                                  : val === false
                                  ? "bg-slate-700 text-slate-500"
                                  : isFree
                                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                  : "bg-blue-500/10 text-blue-400"
                              }`}
                              title={pkg.name}
                            >
                              {val === true ? "✓" : val === false ? "✗" : isFree ? "🆓 " + val : val || "—"}
                            </span>
                          );
                        })}
                      </div>
                      <ActionButtons
                        onEdit={() => setFeatureModal({ open: true, categoryId: cat.id, editing: f })}
                        onDelete={() => handleDeleteFeature(f.id)}
                        small
                      />
                    </div>
                  ))}
                  <button
                    onClick={() => setFeatureModal({ open: true, categoryId: cat.id })}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-slate-700 py-2.5 text-sm text-slate-500 hover:border-blue-500/50 hover:text-blue-400 transition-colors"
                  >
                    <Plus size={14} />
                    Thêm tính năng
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {catModal.open && (
        <CategoryModal editing={catModal.editing} onClose={() => setCatModal({ open: false })} onSaved={fetchData} />
      )}
      {featureModal.open && (
        <ComparisonFeatureModal
          categoryId={featureModal.categoryId!}
          editing={featureModal.editing}
          packages={packages}
          onClose={() => setFeatureModal({ open: false })}
          onSaved={fetchData}
        />
      )}
    </div>
  );
}

function CategoryModal({ editing, onClose, onSaved }: { editing?: FeatureCategory; onClose: () => void; onSaved: () => void }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    slug: editing?.slug || "",
    name: editing?.name || "",
    nameVi: editing?.nameVi || "",
    sortOrder: editing?.sortOrder || 0,
    isActive: editing?.isActive ?? true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = editing ? `/api/admin/packages/feature-categories/${editing.id}` : "/api/admin/packages/feature-categories";
      await fetch(url, { method: editing ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      onSaved();
      onClose();
    } finally { setSaving(false); }
  };

  return (
    <Modal title={editing ? "Sửa nhóm" : "Thêm nhóm tính năng"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input label="Tên (EN)" value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v, slug: editing ? f.slug : autoSlug(v) }))} required />
          <Input label="Tên (VI)" value={form.nameVi} onChange={(v) => setForm((f) => ({ ...f, nameVi: v }))} required />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Slug" value={form.slug} onChange={(v) => setForm((f) => ({ ...f, slug: v }))} />
          <Input label="Thứ tự" type="number" value={form.sortOrder} onChange={(v) => setForm((f) => ({ ...f, sortOrder: parseInt(v) || 0 }))} />
        </div>
        <Checkbox label="Hiển thị" checked={form.isActive} onChange={(v) => setForm((f) => ({ ...f, isActive: v }))} />
        <ModalActions onClose={onClose} saving={saving} label={editing ? "Cập nhật" : "Tạo nhóm"} />
      </form>
    </Modal>
  );
}

function ComparisonFeatureModal({
  categoryId, editing, packages, onClose, onSaved,
}: { categoryId: string; editing?: ComparisonFeature; packages: WebPackage[]; onClose: () => void; onSaved: () => void }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    categoryId: editing?.categoryId || categoryId,
    name: editing?.name || "",
    nameVi: editing?.nameVi || "",
    tooltip: editing?.tooltip || "",
    tooltipVi: editing?.tooltipVi || "",
    sortOrder: editing?.sortOrder || 0,
    isActive: editing?.isActive ?? true,
  });
  const [values, setValues] = useState<Record<string, { type: "boolean" | "text" | "free"; value: boolean | string }>>(
    () => {
      const result: Record<string, { type: "boolean" | "text" | "free"; value: boolean | string }> = {};
      for (const pkg of packages) {
        const existingVal = editing?.values ? (editing.values as Record<string, boolean | string>)[pkg.slug] : undefined;
        if (typeof existingVal === "string") {
          result[pkg.slug] = { type: "text", value: existingVal };
        } else {
          result[pkg.slug] = { type: "boolean", value: existingVal ?? false };
        }
      }
      return result;
    }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const finalValues: Record<string, boolean | string> = {};
      for (const [key, v] of Object.entries(values)) {
        finalValues[key] = v.type === "boolean" ? (v.value as boolean) : (v.value as string);
      }
      const payload = { ...form, values: finalValues };
      const url = editing ? `/api/admin/packages/comparison-features/${editing.id}` : "/api/admin/packages/comparison-features";
      await fetch(url, { method: editing ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      onSaved();
      onClose();
    } finally { setSaving(false); }
  };

  return (
    <Modal title={editing ? "Sửa tính năng so sánh" : "Thêm tính năng so sánh"} onClose={onClose} wide>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input label="Tên (EN)" value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} required />
          <Input label="Tên (VI)" value={form.nameVi} onChange={(v) => setForm((f) => ({ ...f, nameVi: v }))} required />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Tooltip (EN)" value={form.tooltip} onChange={(v) => setForm((f) => ({ ...f, tooltip: v }))} />
          <Input label="Tooltip (VI)" value={form.tooltipVi} onChange={(v) => setForm((f) => ({ ...f, tooltipVi: v }))} />
        </div>

        {/* Values per package */}
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-300">Giá trị theo gói</label>
          <div className="space-y-2 rounded-lg border border-slate-800 bg-slate-800/50 p-3">
            {packages.map((pkg) => {
              const v = values[pkg.slug] || { type: "boolean" as const, value: false };
              return (
                <div key={pkg.slug} className="flex items-center gap-3">
                  <span className="w-28 text-sm font-medium text-slate-300">{pkg.name}</span>
                  <select
                    value={v.type}
                    onChange={(e) => {
                      const type = e.target.value as "boolean" | "text" | "free";
                      setValues((prev) => ({
                        ...prev,
                        [pkg.slug]: {
                          type,
                          value: type === "boolean" ? false : type === "free" ? "Miễn phí" : "",
                        },
                      }));
                    }}
                    className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-white"
                  >
                    <option value="boolean">Có/Không</option>
                    <option value="text">Tùy chỉnh</option>
                    <option value="free">Miễn phí</option>
                  </select>
                  {v.type === "boolean" ? (
                    <button
                      type="button"
                      onClick={() => setValues((prev) => ({ ...prev, [pkg.slug]: { type: "boolean", value: !v.value } }))}
                      className={`flex h-7 w-7 items-center justify-center rounded ${v.value ? "bg-green-500/20 text-green-400" : "bg-slate-700 text-slate-500"}`}
                    >
                      {v.value ? <Check size={14} /> : <Minus size={14} />}
                    </button>
                  ) : v.type === "free" ? (
                    <input
                      value={v.value as string}
                      onChange={(e) => setValues((prev) => ({ ...prev, [pkg.slug]: { type: "free", value: e.target.value } }))}
                      className="flex-1 rounded border border-amber-600/40 bg-slate-900 px-2 py-1 text-sm text-amber-300 placeholder:text-amber-900"
                      placeholder="VD: Miễn phí, Không giới hạn..."
                    />
                  ) : (
                    <input
                      value={v.value as string}
                      onChange={(e) => setValues((prev) => ({ ...prev, [pkg.slug]: { type: "text", value: e.target.value } }))}
                      className="flex-1 rounded border border-slate-700 bg-slate-900 px-2 py-1 text-sm text-white"
                      placeholder="VD: 1-3 trang, Cơ bản..."
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input label="Thứ tự" type="number" value={form.sortOrder} onChange={(v) => setForm((f) => ({ ...f, sortOrder: parseInt(v) || 0 }))} />
          <div className="flex items-end">
            <Checkbox label="Hiển thị" checked={form.isActive} onChange={(v) => setForm((f) => ({ ...f, isActive: v }))} />
          </div>
        </div>
        <ModalActions onClose={onClose} saving={saving} label={editing ? "Cập nhật" : "Tạo tính năng"} />
      </form>
    </Modal>
  );
}

// ─── Hosting Tab ────────────────────────────────────────────

function HostingTab({ setLoading }: { loading: boolean; setLoading: (v: boolean) => void }) {
  const [plans, setPlans] = useState<HostingPlan[]>([]);
  const [loading, setLocalLoading] = useState(true);
  const [modal, setModal] = useState<{ open: boolean; editing?: HostingPlan }>({ open: false });

  const fetchData = useCallback(async () => {
    setLocalLoading(true);
    try {
      const res = await fetch("/api/admin/packages/hosting-plans");
      const json = await res.json();
      setPlans(json.data || []);
    } catch (e) { console.error(e); }
    finally { setLocalLoading(false); setLoading(false); }
  }, [setLoading]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDelete = async (id: string) => {
    if (!confirm("Xóa gói hosting này?")) return;
    await fetch(`/api/admin/packages/hosting-plans/${id}`, { method: "DELETE" });
    fetchData();
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <AddButton label="Thêm hosting" onClick={() => setModal({ open: true })} />
      </div>

      {plans.length === 0 ? (
        <EmptyState message="Chưa có gói hosting" onAdd={() => setModal({ open: true })} />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/80 text-left text-[11px] uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3">Tên (EN / VI)</th>
                <th className="px-4 py-3">Giá</th>
                <th className="px-4 py-3">Tính năng</th>
                <th className="px-4 py-3 text-center">Active</th>
                <th className="px-4 py-3 w-20"></th>
              </tr>
            </thead>
            <tbody>
              {plans.map((plan) => (
                <tr key={plan.id} className="border-b border-slate-800/50 text-slate-300 hover:bg-slate-800/30">
                  <td className="px-4 py-3">
                    <div className="font-medium text-white">{plan.name}</div>
                    <div className="text-xs text-slate-500">{plan.nameVi}</div>
                  </td>
                  <td className="px-4 py-3 font-mono text-green-400">{formatPrice(plan.price)}/{plan.periodVi}</td>
                  <td className="px-4 py-3 text-xs text-slate-400">{plan.features.length} features</td>
                  <td className="px-4 py-3 text-center"><StatusBadge active={plan.isActive} /></td>
                  <td className="px-4 py-3"><ActionButtons onEdit={() => setModal({ open: true, editing: plan })} onDelete={() => handleDelete(plan.id)} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal.open && <HostingModal editing={modal.editing} onClose={() => setModal({ open: false })} onSaved={fetchData} />}
    </div>
  );
}

function HostingModal({ editing, onClose, onSaved }: { editing?: HostingPlan; onClose: () => void; onSaved: () => void }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    slug: editing?.slug || "",
    name: editing?.name || "",
    nameVi: editing?.nameVi || "",
    price: editing?.price || 0,
    period: editing?.period || "month",
    periodVi: editing?.periodVi || "tháng",
    highlighted: editing?.highlighted || false,
    color: editing?.color || "#3B82F6",
    sortOrder: editing?.sortOrder || 0,
    isActive: editing?.isActive ?? true,
  });
  const [featuresText, setFeaturesText] = useState((editing?.features || []).join("\n"));
  const [featuresViText, setFeaturesViText] = useState((editing?.featuresVi || []).join("\n"));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        features: featuresText.split("\n").filter((l) => l.trim()),
        featuresVi: featuresViText.split("\n").filter((l) => l.trim()),
      };
      const url = editing ? `/api/admin/packages/hosting-plans/${editing.id}` : "/api/admin/packages/hosting-plans";
      await fetch(url, { method: editing ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      onSaved();
      onClose();
    } finally { setSaving(false); }
  };

  return (
    <Modal title={editing ? "Sửa hosting" : "Thêm gói hosting"} onClose={onClose} wide>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input label="Tên (EN)" value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v, slug: editing ? f.slug : autoSlug(v) }))} required />
          <Input label="Tên (VI)" value={form.nameVi} onChange={(v) => setForm((f) => ({ ...f, nameVi: v }))} required />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <Input label="Giá (VNĐ)" type="number" value={form.price} onChange={(v) => setForm((f) => ({ ...f, price: parseInt(v) || 0 }))} required />
          <Input label="Chu kỳ (EN)" value={form.period} onChange={(v) => setForm((f) => ({ ...f, period: v }))} />
          <Input label="Chu kỳ (VI)" value={form.periodVi} onChange={(v) => setForm((f) => ({ ...f, periodVi: v }))} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">Features (EN) - mỗi dòng 1 feature</label>
            <textarea value={featuresText} onChange={(e) => setFeaturesText(e.target.value)} rows={5}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">Features (VI) - mỗi dòng 1 feature</label>
            <textarea value={featuresViText} onChange={(e) => setFeaturesViText(e.target.value)} rows={5}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none focus:border-blue-500" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <Input label="Màu sắc" value={form.color} onChange={(v) => setForm((f) => ({ ...f, color: v }))} />
          <Input label="Thứ tự" type="number" value={form.sortOrder} onChange={(v) => setForm((f) => ({ ...f, sortOrder: parseInt(v) || 0 }))} />
          <div className="flex items-end gap-4">
            <Checkbox label="Nổi bật" checked={form.highlighted} onChange={(v) => setForm((f) => ({ ...f, highlighted: v }))} />
            <Checkbox label="Active" checked={form.isActive} onChange={(v) => setForm((f) => ({ ...f, isActive: v }))} />
          </div>
        </div>
        <ModalActions onClose={onClose} saving={saving} label={editing ? "Cập nhật" : "Tạo hosting"} />
      </form>
    </Modal>
  );
}

// ─── Domain Tab ─────────────────────────────────────────────

function DomainTab({ setLoading }: { loading: boolean; setLoading: (v: boolean) => void }) {
  const [prices, setPrices] = useState<DomainPrice[]>([]);
  const [loading, setLocalLoading] = useState(true);
  const [modal, setModal] = useState<{ open: boolean; editing?: DomainPrice }>({ open: false });

  const fetchData = useCallback(async () => {
    setLocalLoading(true);
    try {
      const res = await fetch("/api/admin/packages/domain-prices");
      const json = await res.json();
      setPrices(json.data || []);
    } catch (e) { console.error(e); }
    finally { setLocalLoading(false); setLoading(false); }
  }, [setLoading]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDelete = async (id: string) => {
    if (!confirm("Xóa domain này?")) return;
    await fetch(`/api/admin/packages/domain-prices/${id}`, { method: "DELETE" });
    fetchData();
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <AddButton label="Thêm domain" onClick={() => setModal({ open: true })} />
      </div>

      {prices.length === 0 ? (
        <EmptyState message="Chưa có giá domain" onAdd={() => setModal({ open: true })} />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/80 text-left text-[11px] uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3">Extension</th>
                <th className="px-4 py-3">Đăng ký</th>
                <th className="px-4 py-3">Gia hạn</th>
                <th className="px-4 py-3">Ghi chú</th>
                <th className="px-4 py-3 text-center">Active</th>
                <th className="px-4 py-3 w-20"></th>
              </tr>
            </thead>
            <tbody>
              {prices.map((d) => (
                <tr key={d.id} className="border-b border-slate-800/50 text-slate-300 hover:bg-slate-800/30">
                  <td className="px-4 py-3 font-mono font-medium text-white">{d.extension}</td>
                  <td className="px-4 py-3 font-mono text-green-400">{formatPrice(d.registrationPrice)}/{d.periodVi}</td>
                  <td className="px-4 py-3 font-mono text-green-400">{formatPrice(d.renewalPrice)}/{d.periodVi}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{d.noteVi || d.note || "—"}</td>
                  <td className="px-4 py-3 text-center"><StatusBadge active={d.isActive} /></td>
                  <td className="px-4 py-3"><ActionButtons onEdit={() => setModal({ open: true, editing: d })} onDelete={() => handleDelete(d.id)} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal.open && <DomainModal editing={modal.editing} onClose={() => setModal({ open: false })} onSaved={fetchData} />}
    </div>
  );
}

function DomainModal({ editing, onClose, onSaved }: { editing?: DomainPrice; onClose: () => void; onSaved: () => void }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    extension: editing?.extension || "",
    registrationPrice: editing?.registrationPrice || 0,
    renewalPrice: editing?.renewalPrice || 0,
    period: editing?.period || "year",
    periodVi: editing?.periodVi || "năm",
    note: editing?.note || "",
    noteVi: editing?.noteVi || "",
    sortOrder: editing?.sortOrder || 0,
    isActive: editing?.isActive ?? true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = editing ? `/api/admin/packages/domain-prices/${editing.id}` : "/api/admin/packages/domain-prices";
      await fetch(url, { method: editing ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      onSaved();
      onClose();
    } finally { setSaving(false); }
  };

  return (
    <Modal title={editing ? "Sửa domain" : "Thêm domain"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Extension" value={form.extension} onChange={(v) => setForm((f) => ({ ...f, extension: v }))} required placeholder=".com, .vn, .com.vn" />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Giá đăng ký (VNĐ)" type="number" value={form.registrationPrice} onChange={(v) => setForm((f) => ({ ...f, registrationPrice: parseInt(v) || 0 }))} required />
          <Input label="Giá gia hạn (VNĐ)" type="number" value={form.renewalPrice} onChange={(v) => setForm((f) => ({ ...f, renewalPrice: parseInt(v) || 0 }))} required />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Ghi chú (EN)" value={form.note} onChange={(v) => setForm((f) => ({ ...f, note: v }))} />
          <Input label="Ghi chú (VI)" value={form.noteVi} onChange={(v) => setForm((f) => ({ ...f, noteVi: v }))} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Thứ tự" type="number" value={form.sortOrder} onChange={(v) => setForm((f) => ({ ...f, sortOrder: parseInt(v) || 0 }))} />
          <div className="flex items-end">
            <Checkbox label="Hiển thị" checked={form.isActive} onChange={(v) => setForm((f) => ({ ...f, isActive: v }))} />
          </div>
        </div>
        <ModalActions onClose={onClose} saving={saving} label={editing ? "Cập nhật" : "Tạo domain"} />
      </form>
    </Modal>
  );
}

// ─── Deployment Tab ─────────────────────────────────────────

function DeploymentTab({ setLoading }: { loading: boolean; setLoading: (v: boolean) => void }) {
  const [items, setItems] = useState<DeploymentItem[]>([]);
  const [loading, setLocalLoading] = useState(true);
  const [modal, setModal] = useState<{ open: boolean; editing?: DeploymentItem }>({ open: false });

  const fetchData = useCallback(async () => {
    setLocalLoading(true);
    try {
      const res = await fetch("/api/admin/packages/deployment-items");
      const json = await res.json();
      setItems(json.data || []);
    } catch (e) { console.error(e); }
    finally { setLocalLoading(false); setLoading(false); }
  }, [setLoading]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDelete = async (id: string) => {
    if (!confirm("Xóa mục bàn giao này?")) return;
    await fetch(`/api/admin/packages/deployment-items/${id}`, { method: "DELETE" });
    fetchData();
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <AddButton label="Thêm mục" onClick={() => setModal({ open: true })} />
      </div>

      {items.length === 0 ? (
        <EmptyState message="Chưa có mục bàn giao" onAdd={() => setModal({ open: true })} />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/80 text-left text-[11px] uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3">Title (EN / VI)</th>
                <th className="px-4 py-3">Icon</th>
                <th className="px-4 py-3 text-center">Bàn giao?</th>
                <th className="px-4 py-3 text-center">Active</th>
                <th className="px-4 py-3 w-20"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-slate-800/50 text-slate-300 hover:bg-slate-800/30">
                  <td className="px-4 py-3">
                    <div className="font-medium text-white">{item.title}</div>
                    <div className="text-xs text-slate-500">{item.titleVi}</div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400">{item.icon}</td>
                  <td className="px-4 py-3 text-center">
                    {item.handedToClient ? (
                      <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-[10px] text-green-400">Có</span>
                    ) : (
                      <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] text-amber-400">Không</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center"><StatusBadge active={item.isActive} /></td>
                  <td className="px-4 py-3"><ActionButtons onEdit={() => setModal({ open: true, editing: item })} onDelete={() => handleDelete(item.id)} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal.open && <DeploymentModal editing={modal.editing} onClose={() => setModal({ open: false })} onSaved={fetchData} />}
    </div>
  );
}

function DeploymentModal({ editing, onClose, onSaved }: { editing?: DeploymentItem; onClose: () => void; onSaved: () => void }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    slug: editing?.slug || "",
    title: editing?.title || "",
    titleVi: editing?.titleVi || "",
    description: editing?.description || "",
    descriptionVi: editing?.descriptionVi || "",
    handedToClient: editing?.handedToClient ?? true,
    icon: editing?.icon || "Package",
    note: editing?.note || "",
    noteVi: editing?.noteVi || "",
    sortOrder: editing?.sortOrder || 0,
    isActive: editing?.isActive ?? true,
  });

  const iconOptions = [
    "GitBranch", "LayoutDashboard", "Server", "BarChart3", "ShieldCheck",
    "FileText", "Globe", "GraduationCap", "AlertTriangle", "Package",
    "Code", "Database", "Lock", "Mail", "Settings",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = editing ? `/api/admin/packages/deployment-items/${editing.id}` : "/api/admin/packages/deployment-items";
      await fetch(url, { method: editing ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      onSaved();
      onClose();
    } finally { setSaving(false); }
  };

  return (
    <Modal title={editing ? "Sửa mục bàn giao" : "Thêm mục bàn giao"} onClose={onClose} wide>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input label="Title (EN)" value={form.title} onChange={(v) => setForm((f) => ({ ...f, title: v, slug: editing ? f.slug : autoSlug(v) }))} required />
          <Input label="Title (VI)" value={form.titleVi} onChange={(v) => setForm((f) => ({ ...f, titleVi: v }))} required />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Mô tả (EN)" value={form.description} onChange={(v) => setForm((f) => ({ ...f, description: v }))} required />
          <Input label="Mô tả (VI)" value={form.descriptionVi} onChange={(v) => setForm((f) => ({ ...f, descriptionVi: v }))} required />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">Icon</label>
            <select value={form.icon} onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500">
              {iconOptions.map((ic) => <option key={ic} value={ic}>{ic}</option>)}
            </select>
          </div>
          <Input label="Thứ tự" type="number" value={form.sortOrder} onChange={(v) => setForm((f) => ({ ...f, sortOrder: parseInt(v) || 0 }))} />
          <div className="flex items-end gap-4">
            <Checkbox label="Bàn giao" checked={form.handedToClient} onChange={(v) => setForm((f) => ({ ...f, handedToClient: v }))} />
            <Checkbox label="Active" checked={form.isActive} onChange={(v) => setForm((f) => ({ ...f, isActive: v }))} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Ghi chú (EN)" value={form.note} onChange={(v) => setForm((f) => ({ ...f, note: v }))} />
          <Input label="Ghi chú (VI)" value={form.noteVi} onChange={(v) => setForm((f) => ({ ...f, noteVi: v }))} />
        </div>
        <ModalActions onClose={onClose} saving={saving} label={editing ? "Cập nhật" : "Tạo mục"} />
      </form>
    </Modal>
  );
}

// ─── Shared UI Components ───────────────────────────────────

function LoadingSpinner() {
  return (
    <div className="flex h-64 items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
    </div>
  );
}

function EmptyState({ message, onAdd }: { message: string; onAdd: () => void }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-700 p-12 text-center">
      <Package className="mx-auto mb-3 h-10 w-10 text-slate-600" />
      <p className="text-slate-400">{message}</p>
      <button onClick={onAdd} className="mt-3 text-sm text-blue-400 hover:text-blue-300">
        Tạo mới →
      </button>
    </div>
  );
}

function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
    >
      <Plus size={16} />
      {label}
    </button>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return active ? (
    <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-[10px] text-green-400">On</span>
  ) : (
    <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] text-red-400">Off</span>
  );
}

function ActionButtons({ onEdit, onDelete, small }: { onEdit: () => void; onDelete: () => void; small?: boolean }) {
  const size = small ? 13 : 14;
  const padding = small ? "p-1" : "p-1.5";
  return (
    <div className="flex items-center gap-1">
      <button onClick={onEdit} className={`rounded-lg ${padding} text-slate-400 hover:bg-slate-800 hover:text-blue-400 transition-colors`}>
        <Pencil size={size} />
      </button>
      <button onClick={onDelete} className={`rounded-lg ${padding} text-slate-400 hover:bg-slate-800 hover:text-red-400 transition-colors`}>
        <Trash2 size={size} />
      </button>
    </div>
  );
}

function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 backdrop-blur-sm pt-12 pb-12">
      <div className={`w-full ${wide ? "max-w-2xl" : "max-w-md"} rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-2xl`}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-white">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={20} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ModalActions({ onClose, saving, label }: { onClose: () => void; saving: boolean; label: string }) {
  return (
    <div className="flex justify-end gap-3 pt-2">
      <button type="button" onClick={onClose}
        className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 transition-colors">
        Hủy
      </button>
      <button type="submit" disabled={saving}
        className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors">
        {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
        {label}
      </button>
    </div>
  );
}

function Input({ label, value, onChange, type = "text", required, placeholder }: {
  label: string; value: string | number; onChange: (v: string) => void; type?: string; required?: boolean; placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-300">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
      />
    </div>
  );
}

function Checkbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-blue-500"
      />
      {label}
    </label>
  );
}
