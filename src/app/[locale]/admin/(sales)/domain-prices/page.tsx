"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Pencil, Trash2, Save, Loader2, Globe, X } from "lucide-react";

interface DomainPrice {
  id?: string;
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

const defaultForm: Omit<DomainPrice, "id"> = {
  extension: "",
  registrationPrice: 0,
  renewalPrice: 0,
  period: "year",
  periodVi: "năm",
  note: null,
  noteVi: null,
  sortOrder: 0,
  isActive: true,
};

const formatPrice = (price: number) =>
  new Intl.NumberFormat("vi-VN").format(price) + " ₫";

export default function AdminDomainPricesPage() {
  const [prices, setPrices] = useState<DomainPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modal, setModal] = useState<{ open: boolean; editing?: DomainPrice }>({ open: false });
  const [form, setForm] = useState<Omit<DomainPrice, "id">>(defaultForm);

  const fetchPrices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/packages/domain-prices");
      const json = await res.json();
      setPrices(json.data || []);
    } catch { } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPrices(); }, [fetchPrices]);

  const openCreate = () => { setForm(defaultForm); setModal({ open: true }); };
  const openEdit = (p: DomainPrice) => { setForm({ ...p }); setModal({ open: true, editing: p }); };
  const closeModal = () => setModal({ open: false });

  const handleSave = async () => {
    if (!form.extension) return;
    setSaving(true);
    try {
      const url = modal.editing
        ? `/api/admin/packages/domain-prices/${modal.editing.id}`
        : "/api/admin/packages/domain-prices";
      const method = modal.editing ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (res.ok) { closeModal(); fetchPrices(); }
    } finally { setSaving(false); }
  };

  const handleDelete = async (p: DomainPrice) => {
    if (!confirm(`Xóa "${p.extension}"?`)) return;
    await fetch(`/api/admin/packages/domain-prices/${p.id}`, { method: "DELETE" });
    fetchPrices();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Domain Prices</h1>
          <p className="text-sm text-slate-400">Quản lý giá domain</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors">
          <Plus size={16} /> Thêm domain
        </button>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 size={24} className="animate-spin text-slate-500" />
        </div>
      ) : (
        <div className="rounded-xl border border-slate-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-900 border-b border-slate-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Extension</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Giá đăng ký</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Giá gia hạn</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Chu kỳ</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Ghi chú</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Trạng thái</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-400">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {prices.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500">Chưa có giá domain</td></tr>
              ) : (
                prices.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Globe size={16} className="text-blue-400" />
                        <span className="font-mono font-medium text-white">{p.extension}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-green-400">{formatPrice(p.registrationPrice)}</td>
                    <td className="px-4 py-3 font-mono text-yellow-400">{formatPrice(p.renewalPrice)}</td>
                    <td className="px-4 py-3 text-slate-300">{p.periodVi}</td>
                    <td className="px-4 py-3 text-xs text-slate-500 max-w-[200px] truncate">{p.note || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${p.isActive ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
                        {p.isActive ? "Hoạt động" : "Tắt"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEdit(p)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => handleDelete(p)} className="rounded-lg p-1.5 text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-colors">
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
              <h2 className="text-lg font-bold text-white">{modal.editing ? "Sửa" : "Thêm"} Domain</h2>
              <button onClick={closeModal} className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-400">Extension (VD: .com)</label>
                <input value={form.extension} onChange={(e) => setForm((f) => ({ ...f, extension: e.target.value }))}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500"
                  placeholder=".com" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-400">Giá đăng ký (VND)</label>
                  <input type="number" value={form.registrationPrice}
                    onChange={(e) => setForm((f) => ({ ...f, registrationPrice: Number(e.target.value) }))}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-400">Giá gia hạn (VND)</label>
                  <input type="number" value={form.renewalPrice}
                    onChange={(e) => setForm((f) => ({ ...f, renewalPrice: Number(e.target.value) }))}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none focus:border-blue-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-400">Chu kỳ (EN)</label>
                  <input value={form.period} onChange={(e) => setForm((f) => ({ ...f, period: e.target.value }))}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none focus:border-blue-500" placeholder="year" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-400">Chu kỳ (VI)</label>
                  <input value={form.periodVi} onChange={(e) => setForm((f) => ({ ...f, periodVi: e.target.value }))}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none focus:border-blue-500" placeholder="năm" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-400">Ghi chú (EN)</label>
                <input value={form.note || ""} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value || null }))}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                  placeholder="Optional note..." />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-400">Ghi chú (VI)</label>
                <input value={form.noteVi || ""} onChange={(e) => setForm((f) => ({ ...f, noteVi: e.target.value || null }))}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                  placeholder="Ghi chú tùy chọn..." />
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                <input type="checkbox" checked={form.isActive}
                  onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                  className="rounded border-slate-600 bg-slate-800 text-blue-500 outline-none" />
                Hoạt động
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={closeModal} className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800">Hủy</button>
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
                {saving && <Loader2 size={14} className="animate-spin" />} <Save size={14} /> Lưu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
