"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Pencil, Trash2, Save, Loader2, Server, X } from "lucide-react";

interface HostingPlan {
  id?: string;
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

const defaultForm: Omit<HostingPlan, "id"> = {
  slug: "",
  name: "",
  nameVi: "",
  price: 0,
  period: "month",
  periodVi: "tháng",
  features: [],
  featuresVi: [],
  highlighted: false,
  color: "#3B82F6",
  sortOrder: 0,
  isActive: true,
};

const formatPrice = (price: number) =>
  new Intl.NumberFormat("vi-VN").format(price) + " ₫";

export default function AdminHostingPlansPage() {
  const [plans, setPlans] = useState<HostingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modal, setModal] = useState<{ open: boolean; editing?: HostingPlan }>({ open: false });
  const [form, setForm] = useState<Omit<HostingPlan, "id">>(defaultForm);
  const [featureInput, setFeatureInput] = useState("");
  const [featureViInput, setFeatureViInput] = useState("");

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/packages/hosting-plans");
      const json = await res.json();
      setPlans(json.data || []);
    } catch { } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPlans(); }, [fetchPlans]);

  const openCreate = () => {
    setForm(defaultForm);
    setModal({ open: true });
  };

  const openEdit = (plan: HostingPlan) => {
    setForm({ ...plan });
    setModal({ open: true, editing: plan });
  };

  const closeModal = () => {
    setModal({ open: false });
    setFeatureInput("");
    setFeatureViInput("");
  };

  const addFeature = () => {
    if (featureInput.trim()) {
      setForm((f) => ({ ...f, features: [...f.features, featureInput.trim()] }));
      setFeatureInput("");
    }
    if (featureViInput.trim()) {
      setForm((f) => ({ ...f, featuresVi: [...f.featuresVi, featureViInput.trim()] }));
      setFeatureViInput("");
    }
  };

  const removeFeature = (i: number) => {
    setForm((f) => ({ ...f, features: f.features.filter((_, idx) => idx !== i) }));
    setForm((f) => ({ ...f, featuresVi: f.featuresVi.filter((_, idx) => idx !== i) }));
  };

  const handleSave = async () => {
    if (!form.name || !form.slug) return;
    setSaving(true);
    try {
      const url = modal.editing
        ? `/api/admin/packages/hosting-plans/${modal.editing.id}`
        : "/api/admin/packages/hosting-plans";
      const method = modal.editing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        closeModal();
        fetchPlans();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (plan: HostingPlan) => {
    if (!confirm(`Xóa "${plan.name}"?`)) return;
    await fetch(`/api/admin/packages/hosting-plans/${plan.id}`, { method: "DELETE" });
    fetchPlans();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Hosting Plans</h1>
          <p className="text-sm text-slate-400">Quản lý các gói Hosting</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} />
          Thêm gói Hosting
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 size={24} className="animate-spin text-slate-500" />
        </div>
      ) : (
        <div className="rounded-xl border border-slate-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-900 border-b border-slate-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Tên</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Giá</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Chu kỳ</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Nổi bật</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Trạng thái</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-400">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {plans.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">Chưa có gói hosting nào</td>
                </tr>
              ) : (
                plans.map((plan) => (
                  <tr key={plan.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: plan.color + "33" }}>
                          <Server size={16} style={{ color: plan.color }} />
                        </div>
                        <div>
                          <div className="font-medium text-white">{plan.name}</div>
                          <div className="text-xs text-slate-500">{plan.nameVi}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-green-400">{formatPrice(plan.price)}</td>
                    <td className="px-4 py-3 text-slate-300">{plan.periodVi}</td>
                    <td className="px-4 py-3">
                      {plan.highlighted ? (
                        <span className="inline-flex items-center rounded-full bg-yellow-500/10 px-2 py-0.5 text-xs font-medium text-yellow-400">Nổi bật</span>
                      ) : (
                        <span className="text-slate-500 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${plan.isActive ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
                        {plan.isActive ? "Hoạt động" : "Tắt"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEdit(plan)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => handleDelete(plan)} className="rounded-lg p-1.5 text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {modal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">{modal.editing ? "Sửa" : "Thêm"} Hosting Plan</h2>
              <button onClick={closeModal} className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-400">Slug</label>
                  <input value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500" placeholder="hosting-basic" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-400">Màu</label>
                  <input type="color" value={form.color} onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                    className="h-10 w-full rounded-lg border border-slate-700 bg-slate-800 cursor-pointer" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-400">Tên (EN)</label>
                  <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500" placeholder="Basic Hosting" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-400">Tên (VI)</label>
                  <input value={form.nameVi} onChange={(e) => setForm((f) => ({ ...f, nameVi: e.target.value }))}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500" placeholder="Hosting Cơ Bản" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-400">Giá (VND)</label>
                  <input type="number" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) }))}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-400">Chu kỳ (EN)</label>
                  <input value={form.period} onChange={(e) => setForm((f) => ({ ...f, period: e.target.value }))}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none focus:border-blue-500" placeholder="month" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-400">Chu kỳ (VI)</label>
                  <input value={form.periodVi} onChange={(e) => setForm((f) => ({ ...f, periodVi: e.target.value }))}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none focus:border-blue-500" placeholder="tháng" />
                </div>
              </div>

              {/* Features */}
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-400">Tính năng (EN)</label>
                <div className="flex gap-2 mb-2">
                  <input value={featureInput} onChange={(e) => setFeatureInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addFeature())}
                    className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500" placeholder="Shared hosting..." />
                  <button type="button" onClick={addFeature} className="rounded-lg bg-slate-700 px-3 py-2 text-sm text-white hover:bg-slate-600">+</button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {form.features.map((f, i) => (
                    <span key={i} className="inline-flex items-center gap-1 rounded-full bg-slate-800 px-2.5 py-1 text-xs text-slate-300">
                      {f}
                      <button onClick={() => removeFeature(i)} className="text-slate-500 hover:text-red-400">×</button>
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-400">Tính năng (VI)</label>
                <div className="flex gap-2">
                  <input value={featureViInput} onChange={(e) => setFeatureViInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addFeature())}
                    className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500" placeholder="Shared hosting..." />
                </div>
              </div>

              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                  <input type="checkbox" checked={form.highlighted} onChange={(e) => setForm((f) => ({ ...f, highlighted: e.target.checked }))}
                    className="rounded border-slate-600 bg-slate-800 text-blue-500 outline-none" />
                  Nổi bật
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                  <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                    className="rounded border-slate-600 bg-slate-800 text-blue-500 outline-none" />
                  Hoạt động
                </label>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button onClick={closeModal} className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800">Hủy</button>
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
                {saving && <Loader2 size={14} className="animate-spin" />}
                <Save size={14} /> Lưu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
