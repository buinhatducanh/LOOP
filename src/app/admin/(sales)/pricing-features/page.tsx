"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronRight,
  GripVertical,
  Layers,
  Zap,
  X,
  Save,
  Loader2,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────

interface Variant {
  id?: string;
  variantName: string;
  description: string;
  price: number;
  resourceUsage?: unknown;
  sortOrder: number;
  isActive: boolean;
}

interface Feature {
  id: string;
  featureName: string;
  description: string | null;
  logicLevel: string;
  isRequired: boolean;
  sortOrder: number;
  isActive: boolean;
  groupId: string;
  variants: Variant[];
}

interface FeatureGroup {
  id: string;
  groupName: string;
  slug: string;
  sortOrder: number;
  isActive: boolean;
  features: Feature[];
}

const formatPrice = (price: number) =>
  new Intl.NumberFormat("vi-VN").format(price) + " ₫";

// ─── Main Page ──────────────────────────────────────────────────

export default function AdminPricingFeaturesPage() {
  const [groups, setGroups] = useState<FeatureGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [expandedFeatures, setExpandedFeatures] = useState<Set<string>>(new Set());

  // Modal states
  const [groupModal, setGroupModal] = useState<{
    open: boolean;
    editing?: FeatureGroup;
  }>({ open: false });
  const [featureModal, setFeatureModal] = useState<{
    open: boolean;
    groupId?: string;
    editing?: Feature;
  }>({ open: false });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/feature-groups?limit=100");
      const json = await res.json();
      setGroups(json.data || []);
      // Auto-expand all groups
      const ids = new Set<string>((json.data || []).map((g: FeatureGroup) => g.id));
      setExpandedGroups(ids);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleGroup = (id: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleFeature = (id: string) => {
    setExpandedFeatures((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleDeleteGroup = async (id: string) => {
    if (!confirm("Xóa nhóm tính năng này? Tất cả tính năng và cấp độ bên trong sẽ bị xóa.")) return;
    try {
      await fetch(`/api/admin/feature-groups/${id}`, { method: "DELETE" });
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteFeature = async (id: string) => {
    if (!confirm("Xóa tính năng này? Tất cả cấp độ bên trong sẽ bị xóa.")) return;
    try {
      await fetch(`/api/admin/features/${id}`, { method: "DELETE" });
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Quản lý Tính năng Báo giá</h1>
          <p className="text-sm text-slate-400">
            Quản lý nhóm tính năng, tính năng, và cấp độ giá cho hệ thống báo giá động
          </p>
        </div>
        <button
          onClick={() => setGroupModal({ open: true })}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} />
          Thêm nhóm
        </button>
      </div>

      {/* Groups Tree */}
      {groups.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-700 p-12 text-center">
          <Layers className="mx-auto mb-3 h-10 w-10 text-slate-600" />
          <p className="text-slate-400">Chưa có nhóm tính năng nào</p>
          <button
            onClick={() => setGroupModal({ open: true })}
            className="mt-3 text-sm text-blue-400 hover:text-blue-300"
          >
            Tạo nhóm đầu tiên →
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {groups.map((group) => (
            <div
              key={group.id}
              className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden"
            >
              {/* Group Header */}
              <div className="flex items-center gap-3 border-b border-slate-800/50 px-4 py-3">
                <button
                  onClick={() => toggleGroup(group.id)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  {expandedGroups.has(group.id) ? (
                    <ChevronDown size={18} />
                  ) : (
                    <ChevronRight size={18} />
                  )}
                </button>
                <Layers size={18} className="text-blue-400" />
                <span className="font-semibold text-white flex-1">
                  {group.groupName}
                </span>
                <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-400">
                  {group.features.length} tính năng
                </span>
                {!group.isActive && (
                  <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-xs text-red-400">
                    Ẩn
                  </span>
                )}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setGroupModal({ open: true, editing: group })}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-blue-400 transition-colors"
                    title="Sửa nhóm"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => handleDeleteGroup(group.id)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-red-400 transition-colors"
                    title="Xóa nhóm"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Features List */}
              {expandedGroups.has(group.id) && (
                <div className="p-3 space-y-2">
                  {group.features.map((feature) => (
                    <div
                      key={feature.id}
                      className="rounded-lg border border-slate-800 bg-slate-900/80"
                    >
                      {/* Feature Header */}
                      <div className="flex items-center gap-3 px-4 py-2.5">
                        <button
                          onClick={() => toggleFeature(feature.id)}
                          className="text-slate-500 hover:text-white transition-colors"
                        >
                          {expandedFeatures.has(feature.id) ? (
                            <ChevronDown size={16} />
                          ) : (
                            <ChevronRight size={16} />
                          )}
                        </button>
                        <Zap size={16} className="text-amber-400" />
                        <span className="font-medium text-slate-200 flex-1">
                          {feature.featureName}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                            feature.logicLevel === "High"
                              ? "bg-red-500/20 text-red-400"
                              : feature.logicLevel === "Medium"
                              ? "bg-amber-500/20 text-amber-400"
                              : "bg-green-500/20 text-green-400"
                          }`}
                        >
                          {feature.logicLevel}
                        </span>
                        {feature.isRequired && (
                          <span className="rounded-full bg-purple-500/20 px-2 py-0.5 text-[10px] font-medium text-purple-400">
                            Bắt buộc
                          </span>
                        )}
                        <span className="text-xs text-slate-500">
                          {feature.variants.length} cấp độ
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() =>
                              setFeatureModal({
                                open: true,
                                groupId: group.id,
                                editing: feature,
                              })
                            }
                            className="rounded-lg p-1 text-slate-500 hover:bg-slate-800 hover:text-blue-400 transition-colors"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={() => handleDeleteFeature(feature.id)}
                            className="rounded-lg p-1 text-slate-500 hover:bg-slate-800 hover:text-red-400 transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      {/* Variants Table */}
                      {expandedFeatures.has(feature.id) && feature.variants.length > 0 && (
                        <div className="border-t border-slate-800/50 mx-4 mb-3">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="text-left text-[11px] uppercase tracking-wider text-slate-500">
                                <th className="py-2 pr-4">Tên cấp độ</th>
                                <th className="py-2 pr-4">Mô tả</th>
                                <th className="py-2 pr-4 text-right">Giá (VNĐ)</th>
                                <th className="py-2 w-16"></th>
                              </tr>
                            </thead>
                            <tbody>
                              {feature.variants.map((variant) => (
                                <tr
                                  key={variant.id}
                                  className="border-t border-slate-800/30 text-slate-300"
                                >
                                  <td className="py-2 pr-4 font-medium">{variant.variantName}</td>
                                  <td className="py-2 pr-4 text-slate-500 text-xs max-w-[300px] truncate">
                                    {variant.description || "—"}
                                  </td>
                                  <td className="py-2 pr-4 text-right text-green-400 font-mono">
                                    {formatPrice(variant.price)}
                                  </td>
                                  <td className="py-2">
                                    {!variant.isActive && (
                                      <span className="text-[10px] text-red-400">Ẩn</span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Add Feature Button */}
                  <button
                    onClick={() => setFeatureModal({ open: true, groupId: group.id })}
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

      {/* Modals */}
      {groupModal.open && (
        <GroupModal
          editing={groupModal.editing}
          onClose={() => setGroupModal({ open: false })}
          onSaved={fetchData}
        />
      )}
      {featureModal.open && (
        <FeatureModal
          groupId={featureModal.groupId!}
          editing={featureModal.editing}
          onClose={() => setFeatureModal({ open: false })}
          onSaved={fetchData}
        />
      )}
    </div>
  );
}

// ─── Group Modal ────────────────────────────────────────────────

function GroupModal({
  editing,
  onClose,
  onSaved,
}: {
  editing?: FeatureGroup;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    groupName: editing?.groupName || "",
    slug: editing?.slug || "",
    sortOrder: editing?.sortOrder || 0,
    isActive: editing?.isActive ?? true,
  });

  const autoSlug = (name: string) =>
    name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = editing
        ? `/api/admin/feature-groups/${editing.id}`
        : "/api/admin/feature-groups";
      const method = editing ? "PUT" : "POST";
      await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      onSaved();
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-white">
            {editing ? "Sửa nhóm tính năng" : "Thêm nhóm tính năng"}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">
              Tên nhóm <span className="text-red-400">*</span>
            </label>
            <input
              value={form.groupName}
              onChange={(e) => {
                const name = e.target.value;
                setForm((f) => ({
                  ...f,
                  groupName: name,
                  slug: editing ? f.slug : autoSlug(name),
                }));
              }}
              required
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="VD: Giỏ hàng & Thanh toán"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">Slug</label>
            <input
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="gio-hang-thanh-toan"
            />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Thứ tự</label>
              <input
                type="number"
                value={form.sortOrder}
                onChange={(e) => setForm((f) => ({ ...f, sortOrder: parseInt(e.target.value) || 0 }))}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="flex-1">
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Trạng thái</label>
              <select
                value={form.isActive ? "true" : "false"}
                onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.value === "true" }))}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="true">Hiển thị</option>
                <option value="false">Ẩn</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {editing ? "Cập nhật" : "Tạo nhóm"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Feature + Variants Modal ───────────────────────────────────

function FeatureModal({
  groupId,
  editing,
  onClose,
  onSaved,
}: {
  groupId: string;
  editing?: Feature;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    featureName: editing?.featureName || "",
    description: editing?.description || "",
    logicLevel: editing?.logicLevel || "Medium",
    isRequired: editing?.isRequired || false,
    sortOrder: editing?.sortOrder || 0,
    isActive: editing?.isActive ?? true,
  });
  const [variants, setVariants] = useState<Variant[]>(
    editing?.variants?.length
      ? editing.variants
      : [{ variantName: "", description: "", price: 0, sortOrder: 0, isActive: true }]
  );

  const addVariant = () => {
    setVariants((prev) => [
      ...prev,
      { variantName: "", description: "", price: 0, sortOrder: prev.length, isActive: true },
    ]);
  };

  const removeVariant = (index: number) => {
    setVariants((prev) => prev.filter((_, i) => i !== index));
  };

  const updateVariant = (index: number, field: keyof Variant, value: string | number | boolean) => {
    setVariants((prev) =>
      prev.map((v, i) => (i === index ? { ...v, [field]: value } : v))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        ...form,
        groupId,
        variants: variants.map((v, i) => ({
          ...v,
          sortOrder: i,
          price: Number(v.price) || 0,
        })),
      };

      const url = editing
        ? `/api/admin/features/${editing.id}`
        : "/api/admin/features";
      const method = editing ? "PUT" : "POST";
      await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      onSaved();
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 backdrop-blur-sm pt-12 pb-12">
      <div className="w-full max-w-2xl rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-white">
            {editing ? "Sửa tính năng" : "Thêm tính năng mới"}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Feature Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-slate-300">
                Tên tính năng <span className="text-red-400">*</span>
              </label>
              <input
                value={form.featureName}
                onChange={(e) => setForm((f) => ({ ...f, featureName: e.target.value }))}
                required
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="VD: Cấu hình Sản phẩm"
              />
            </div>
            <div className="col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Mô tả</label>
              <input
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="Mô tả ngắn..."
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Độ nặng</label>
              <select
                value={form.logicLevel}
                onChange={(e) => setForm((f) => ({ ...f, logicLevel: e.target.value }))}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
            <div className="flex items-end gap-6">
              <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isRequired}
                  onChange={(e) => setForm((f) => ({ ...f, isRequired: e.target.checked }))}
                  className="rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-blue-500"
                />
                Bắt buộc chọn
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                  className="rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-blue-500"
                />
                Hiển thị
              </label>
            </div>
          </div>

          {/* Variants Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-300">
                Các cấp độ giá ({variants.length})
              </h3>
              <button
                type="button"
                onClick={addVariant}
                className="flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-medium text-blue-400 hover:bg-slate-700 transition-colors"
              >
                <Plus size={12} />
                Thêm cấp độ
              </button>
            </div>

            <div className="space-y-3">
              {variants.map((variant, index) => (
                <div
                  key={index}
                  className="rounded-lg border border-slate-800 bg-slate-800/50 p-4"
                >
                  <div className="flex items-start gap-3">
                    <span className="mt-2 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-700 text-[11px] font-medium text-slate-300">
                      {index + 1}
                    </span>
                    <div className="flex-1 grid grid-cols-3 gap-3">
                      <div className="col-span-2">
                        <input
                          value={variant.variantName}
                          onChange={(e) => updateVariant(index, "variantName", e.target.value)}
                          required
                          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500"
                          placeholder="Tên cấp độ (VD: Cơ bản)"
                        />
                      </div>
                      <div>
                        <input
                          type="number"
                          value={variant.price}
                          onChange={(e) =>
                            updateVariant(index, "price", parseInt(e.target.value) || 0)
                          }
                          required
                          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500"
                          placeholder="Giá (VNĐ)"
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          value={variant.description}
                          onChange={(e) => updateVariant(index, "description", e.target.value)}
                          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500"
                          placeholder="Mô tả chi tiết (tooltip cho user)..."
                        />
                      </div>
                    </div>
                    {variants.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeVariant(index)}
                        className="mt-2 rounded-lg p-1 text-slate-500 hover:bg-slate-700 hover:text-red-400 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {editing ? "Cập nhật" : "Tạo tính năng"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
