"use client";

import { useState, useEffect, useCallback } from "react";
import { ProjectHeader } from "@/components/admin/shared/project-header";

interface Props { params: Promise<{ id: string }>; }

interface HandoverItem { key: string; label: string; checked: boolean; notes?: string; }
interface HandoverPackage {
  id: string; projectId: string; status: string;
  handoverDate: string | null; items: HandoverItem[]; notes: string | null;
  deliveredBy: string | null; createdAt: string;
}

const DEFAULT_ITEMS: HandoverItem[] = [
  { key: "source_code", label: "Source code (Git repository)", checked: false },
  { key: "design_files", label: "Design files (Figma/Sketch)", checked: false },
  { key: "docs", label: "Technical documentation", checked: false },
  { key: "credentials", label: "Credentials & access (env, hosting)", checked: false },
  { key: "training_video", label: "Training video / hướng dẫn sử dụng", checked: false },
  { key: "domain", label: "Domain & DNS configuration", checked: false },
  { key: "hosting", label: "Hosting account & instructions", checked: false },
  { key: "third_party", label: "Third-party service accounts", checked: false },
];

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  pending_review: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  approved: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  handed_over: "bg-green-500/20 text-green-400 border-green-500/30",
};
const STATUS_LABELS: Record<string, string> = {
  draft: "Nháp", pending_review: "Chờ duyệt", approved: "Đã duyệt", handed_over: "Đã bàn giao",
};

export default function HandoverPage({ params: paramsPromise }: Props) {
  const [projectId, setProjectId] = useState("");
  const [packages, setPackages] = useState<HandoverPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [selected, setSelected] = useState<HandoverPackage | null>(null);
  const [form, setForm] = useState<{ items: HandoverItem[]; notes: string }>({
    items: DEFAULT_ITEMS,
    notes: "",
  });

  useEffect(() => { paramsPromise.then(p => setProjectId(p.id)); }, [paramsPromise]);

  const fetchPackages = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/handover-packages?projectId=${projectId}`);
      const json = await res.json();
      setPackages(json.data ?? []);
    } finally { setLoading(false); }
  }, [projectId]);

  useEffect(() => { fetchPackages(); }, [fetchPackages]);

  const openEdit = (pkg: HandoverPackage) => {
    setSelected(pkg);
    setForm({ items: pkg.items?.length ? pkg.items : DEFAULT_ITEMS, notes: pkg.notes ?? "" });
    setEditOpen(true);
  };

  const save = async () => {
    if (!selected) return;
    await fetch(`/api/admin/handover-packages/${selected.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: form.items, notes: form.notes }),
    });
    setEditOpen(false);
    fetchPackages();
  };

  const updateStatus = async (id: string, status: string) => {
    await fetch(`/api/admin/handover-packages/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, handoverDate: new Date().toISOString() }),
    });
    fetchPackages();
  };

  const createNew = async () => {
    if (!projectId) return;
    const res = await fetch("/api/admin/handover-packages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, items: DEFAULT_ITEMS, status: "draft" }),
    });
    const json = await res.json();
    fetchPackages();
    if (json.data) openEdit(json.data);
  };

  const toggleItem = (key: string) => {
    setForm(f => ({
      ...f,
      items: f.items.map(i => i.key === key ? { ...i, checked: !i.checked } : i),
    }));
  };

  const latest = packages[0];
  const completion = latest
    ? Math.round((latest.items.filter(i => i.checked).length / (latest.items.length || 1)) * 100)
    : 0;

  return (
    <div className="p-6">
      <ProjectHeader projectId={projectId} className="mb-6" />

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Handover Package</h1>
          <p className="text-sm mt-1" style={{ color: "rgba(209,213,219,0.5)" }}>
            Bàn giao dự án: source code, tài liệu, credentials
          </p>
        </div>
        {latest ? (
          <span className={`rounded-full px-3 py-1 text-xs font-medium border ${STATUS_COLORS[latest.status]}`}>
            {STATUS_LABELS[latest.status]}
          </span>
        ) : (
          <button onClick={createNew}
            className="rounded-lg px-4 py-2 text-sm font-bold text-white"
            style={{ background: "#6366F1" }}>
            + Tạo Handover
          </button>
        )}
      </div>

      {/* Progress */}
      {latest && (
        <div className="rounded-xl border p-5 mb-6"
          style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.08)" }}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-semibold text-white">Tiến độ checklist</p>
              <p className="text-xs mt-0.5" style={{ color: "rgba(209,213,219,0.4)" }}>
                {latest.items.filter(i => i.checked).length} / {latest.items.length} items
              </p>
            </div>
            <p className="text-2xl font-black text-white">{completion}%</p>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.1)" }}>
            <div className="h-full rounded-full transition-all" style={{ width: `${completion}%`, background: "linear-gradient(to right, #6366F1, #10B981)" }} />
          </div>
        </div>
      )}

      {/* Checklist */}
      {loading ? (
        <p className="text-center py-20" style={{ color: "rgba(209,213,219,0.3)" }}>Đang tải...</p>
      ) : !latest ? (
        <div className="text-center py-20 rounded-xl border"
          style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.06)" }}>
          <p className="text-4xl mb-3">📦</p>
          <p className="text-sm mb-4" style={{ color: "rgba(209,213,219,0.3)" }}>Chưa có handover package</p>
          <button onClick={createNew} className="rounded-lg px-4 py-2 text-sm font-bold text-white"
            style={{ background: "#6366F1" }}>Tạo package đầu tiên</button>
        </div>
      ) : (
        <div className="rounded-xl border overflow-hidden mb-6"
          style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
            {(form.items).map(item => (
              <div key={item.key}
                className="flex items-center gap-4 px-5 py-4 hover:bg-white/5 transition-colors cursor-pointer"
                onClick={() => latest.status === "draft" && openEdit(latest)}>
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                  item.checked ? "bg-green-500 border-green-500" : "border-white/20"
                }`}>
                  {item.checked && <span className="text-xs text-white">✓</span>}
                </div>
                <div className="flex-1">
                  <p className={`text-sm ${item.checked ? "line-through opacity-50" : "text-white"}`}>
                    {item.label}
                  </p>
                </div>
                {item.notes && (
                  <p className="text-xs truncate max-w-[200px]" style={{ color: "rgba(139,92,246,0.7)" }}>
                    {item.notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action buttons */}
      {latest && (
        <div className="flex gap-2">
          <button onClick={() => openEdit(latest)}
            className="rounded-lg border px-4 py-2 text-sm font-medium text-white border-white/10 hover:bg-white/5 transition-colors">
            ✏️ Sửa checklist
          </button>
          {latest.status === "draft" && (
            <button onClick={() => updateStatus(latest.id, "pending_review")}
              className="rounded-lg px-4 py-2 text-sm font-bold text-white"
              style={{ background: "#F59E0B" }}>
              📤 Gửi duyệt
            </button>
          )}
          {latest.status === "pending_review" && (
            <>
              <button onClick={() => updateStatus(latest.id, "approved")}
                className="rounded-lg px-4 py-2 text-sm font-bold text-white"
                style={{ background: "#3B82F6" }}>✓ Duyệt</button>
              <button onClick={() => updateStatus(latest.id, "draft")}
                className="rounded-lg border px-4 py-2 text-sm text-red-400 border-red-500/30">
                Yêu cầu sửa lại
              </button>
            </>
          )}
          {latest.status === "approved" && (
            <button onClick={() => updateStatus(latest.id, "handed_over")}
              className="rounded-lg px-4 py-2 text-sm font-bold text-white"
              style={{ background: "#10B981" }}>
              🎉 Hoàn tất bàn giao
            </button>
          )}
        </div>
      )}

      {/* Edit modal */}
      {editOpen && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto"
          style={{ background: "rgba(0,0,0,0.7)" }}>
          <div className="rounded-2xl border p-6 w-full max-w-lg my-8"
            style={{ background: "#1a1a2e", borderColor: "rgba(255,255,255,0.1)" }}>
            <h2 className="text-lg font-bold text-white mb-4">✏️ Sửa Handover Checklist</h2>
            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
              {form.items.map(item => (
                <div key={item.key}
                  className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors hover:border-white/20"
                  style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.08)" }}
                  onClick={() => toggleItem(item.key)}>
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${
                    item.checked ? "bg-green-500 border-green-500" : "border-white/20"
                  }`}>
                    {item.checked && <span className="text-xs text-white">✓</span>}
                  </div>
                  <p className="text-sm text-white">{item.label}</p>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <label className="text-xs font-medium mb-1 block" style={{ color: "rgba(209,213,219,0.6)" }}>Ghi chú</label>
              <textarea value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                rows={3} className="w-full rounded-lg border px-3 py-2 text-sm text-white resize-none"
                style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }} />
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={save} className="flex-1 rounded-lg py-2 text-sm font-bold text-white"
                style={{ background: "#10B981" }}>Lưu</button>
              <button onClick={() => setEditOpen(false)}
                className="rounded-lg border px-4 py-2 text-sm text-gray-400 border-white/10">Đóng</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
