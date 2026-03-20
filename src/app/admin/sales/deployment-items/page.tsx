"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Pencil, Trash2, Save, Loader2, FileText, X, CheckCircle, AlertTriangle } from "lucide-react";

interface DeploymentItem {
  id?: string;
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

const defaultForm: Omit<DeploymentItem, "id"> = {
  slug: "",
  title: "",
  titleVi: "",
  description: "",
  descriptionVi: "",
  handedToClient: true,
  icon: "FileText",
  note: null,
  noteVi: null,
  sortOrder: 0,
  isActive: true,
};

const ICON_OPTIONS = [
  "GitBranch", "LayoutDashboard", "Server", "BarChart3", "ShieldCheck",
  "FileText", "Globe", "GraduationCap", "AlertTriangle", "Code2",
  "Key", "Mail", "Download", "BookOpen",
];

export default function AdminDeploymentItemsPage() {
  const [items, setItems] = useState<DeploymentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modal, setModal] = useState<{ open: boolean; editing?: DeploymentItem }>({ open: false });
  const [form, setForm] = useState<Omit<DeploymentItem, "id">>(defaultForm);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/packages/deployment-items");
      const json = await res.json();
      setItems(json.data || []);
    } catch { } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const openCreate = () => { setForm(defaultForm); setModal({ open: true }); };
  const openEdit = (item: DeploymentItem) => { setForm({ ...item }); setModal({ open: true, editing: item }); };
  const closeModal = () => setModal({ open: false });

  const handleSave = async () => {
    if (!form.title || !form.slug) return;
    setSaving(true);
    try {
      const url = modal.editing
        ? `/api/admin/packages/deployment-items/${modal.editing.id}`
        : "/api/admin/packages/deployment-items";
      const method = modal.editing ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (res.ok) { closeModal(); fetchItems(); }
    } finally { setSaving(false); }
  };

  const handleDelete = async (item: DeploymentItem) => {
    if (!confirm(`Xóa "${item.title}"?`)) return;
    await fetch(`/api/admin/packages/deployment-items/${item.id}`, { method: "DELETE" });
    fetchItems();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Deployment Items</h1>
          <p className="text-sm text-slate-400">Quản lý danh sách bàn giao</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors">
          <Plus size={16} /> Thêm item
        </button>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 size={24} className="animate-spin text-slate-500" />
        </div>
      ) : (
        <div className="grid gap-4">
          {items.length === 0 ? (
            <div className="rounded-xl border border-slate-800 px-4 py-12 text-center text-slate-500">Chưa có item nào</div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0 mt-0.5">
                      <FileText size={18} className="text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-semibold text-white">{item.title}</h3>
                        <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium text-xs"
                          style={{
                            background: item.handedToClient ? "rgba(34,197,94,0.1)" : "rgba(249,115,22,0.1)",
                            color: item.handedToClient ? "#4ade80" : "#fb923c",
                          }}>
                          {item.handedToClient ? <CheckCircle size={10} /> : <AlertTriangle size={10} />}
                          {item.handedToClient ? "Bàn giao" : "Không bàn giao"}
                        </span>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${item.isActive ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
                          {item.isActive ? "Hoạt động" : "Tắt"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mb-1">{item.titleVi}</p>
                      <p className="text-sm text-slate-300">{item.description}</p>
                      {(item.note || item.noteVi) && (
                        <p className="text-xs text-amber-400/80 mt-2 flex items-center gap-1">
                          <AlertTriangle size={10} /> {item.note || item.noteVi}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => openEdit(item)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => handleDelete(item)} className="rounded-lg p-1.5 text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal */}
      {modal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">{modal.editing ? "Sửa" : "Thêm"} Deployment Item</h2>
              <button onClick={closeModal} className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-400">Slug</label>
                  <input value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500"
                    placeholder="source-code" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-400">Icon</label>
                  <select value={form.icon} onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none focus:border-blue-500">
                    {ICON_OPTIONS.map((icon) => (
                      <option key={icon} value={icon}>{icon}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-400">Tiêu đề (EN)</label>
                  <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500"
                    placeholder="Source Code" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-400">Tiêu đề (VI)</label>
                  <input value={form.titleVi} onChange={(e) => setForm((f) => ({ ...f, titleVi: e.target.value }))}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500"
                    placeholder="Mã nguồn" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-400">Mô tả (EN)</label>
                <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500 resize-none"
                  rows={2} placeholder="Full access to Git repository..." />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-400">Mô tả (VI)</label>
                <textarea value={form.descriptionVi} onChange={(e) => setForm((f) => ({ ...f, descriptionVi: e.target.value }))}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500 resize-none"
                  rows={2} placeholder="Toàn quyền truy cập Git repository..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-400">Ghi chú (EN)</label>
                  <input value={form.note || ""} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value || null }))}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500"
                    placeholder="Optional note..." />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-400">Ghi chú (VI)</label>
                  <input value={form.noteVi || ""} onChange={(e) => setForm((f) => ({ ...f, noteVi: e.target.value || null }))}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500"
                    placeholder="Ghi chú tùy chọn..." />
                </div>
              </div>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                  <input type="checkbox" checked={form.handedToClient}
                    onChange={(e) => setForm((f) => ({ ...f, handedToClient: e.target.checked }))}
                    className="rounded border-slate-600 bg-slate-800 text-blue-500 outline-none" />
                  Bàn giao cho khách
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                  <input type="checkbox" checked={form.isActive}
                    onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                    className="rounded border-slate-600 bg-slate-800 text-blue-500 outline-none" />
                  Hoạt động
                </label>
              </div>
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
