"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

const VI_DATE = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit", month: "2-digit", year: "numeric",
});

const STATUS_LABELS: Record<string, string> = {
  pending: "Chờ duyệt",
  approved_by_client: "Khách duyệt",
  rejected: "Cần sửa",
  approved: "Hoàn tất",
};
const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-400",
  approved_by_client: "bg-blue-500/20 text-blue-400",
  rejected: "bg-red-500/20 text-red-400",
  approved: "bg-green-500/20 text-green-400",
};

interface FigmaDemo {
  id: string;
  projectId: string;
  title: string;
  figmaUrl: string;
  versionHash: string | null;
  status: string;
  clientEmail: string | null;
  clientToken: string;
  rejectionNote: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  sentAt: string | null;
  createdAt: string;
  updatedAt: string;
  project: { id: string; orderNumber: string; customerName: string };
}

export default function FigmaDemosPage() {
  const [demos, setDemos] = useState<FigmaDemo[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: "all" });
  const [selected, setSelected] = useState<FigmaDemo | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [orders, setOrders] = useState<Array<{ id: string; orderNumber: string; customerName: string }>>([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ projectId: "", title: "", figmaUrl: "", clientEmail: "" });

  const fetchDemos = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filter.status !== "all") params.set("status", filter.status);
    try {
      const res = await fetch(`/api/admin/figma-demos?${params}`);
      const json = await res.json();
      setDemos(json.data ?? []);
    } finally { setLoading(false); }
  }, [filter]);

  const fetchOrders = useCallback(async () => {
    const res = await fetch("/api/admin/orders?status=confirmed,in_progress&limit=100");
    const json = await res.json();
    setOrders(json.data ?? []);
  }, []);

  useEffect(() => { fetchDemos(); }, [fetchDemos]);
  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const createDemo = async () => {
    if (!form.projectId || !form.title || !form.figmaUrl) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/figma-demos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Lỗi");
      toast.success("Đã tạo Figma demo");
      setShowCreate(false);
      setForm({ projectId: "", title: "", figmaUrl: "", clientEmail: "" });
      fetchDemos();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lỗi khi tạo Figma demo");
    } finally { setSaving(false); }
  };

  const sendToClient = async (demo: FigmaDemo) => {
    const reviewUrl = `${window.location.origin}/figma/review/${demo.clientToken}`;
    await navigator.clipboard.writeText(reviewUrl);
    toast.success("Đã copy link! Gửi link này cho khách hàng để xem và duyệt thiết kế.");
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Figma Demos</h1>
          <p className="text-sm mt-1" style={{ color: "rgba(209,213,219,0.5)" }}>
            Demo design cho khách hàng xem &amp; duyệt
          </p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="rounded-lg px-4 py-2 text-sm font-medium text-white transition-all hover:opacity-90"
          style={{ background: "linear-gradient(135deg, #8B5CF6, #6366F1)" }}>
          + Tạo Figma Demo
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6">
        {(["all", "pending", "approved_by_client", "rejected", "approved"] as const).map(s => (
          <button key={s} onClick={() => setFilter(f => ({ ...f, status: s }))}
            className="rounded-lg border px-3 py-2 text-xs font-medium transition-all"
            style={{
              background: filter.status === s ? "rgba(139,92,246,0.2)" : "transparent",
              borderColor: filter.status === s ? "rgba(139,92,246,0.4)" : "rgba(255,255,255,0.1)",
              color: filter.status === s ? "#fff" : "rgba(209,213,219,0.6)",
            }}>
            {s === "all" ? "Tất cả" : STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <p className="text-center py-20 text-sm" style={{ color: "rgba(209,213,219,0.4)" }}>Đang tải...</p>
      ) : demos.length === 0 ? (
        <div className="text-center py-20 rounded-xl border"
          style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.06)" }}>
          <p className="text-4xl mb-3">🎨</p>
          <p className="text-sm" style={{ color: "rgba(209,213,219,0.3)" }}>Không có demo nào</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {demos.map(demo => (
            <div key={demo.id}
              className="rounded-xl border p-4 cursor-pointer transition-all hover:border-purple-500/40 hover:bg-purple-500/5"
              style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.08)" }}
              onClick={() => setSelected(demo)}>
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="min-w-0">
                  <h3 className="font-semibold text-white truncate">{demo.title}</h3>
                  <p className="text-xs mt-0.5" style={{ color: "rgba(209,213,219,0.4)" }}>
                    {demo.project.customerName} · {demo.project.orderNumber}
                  </p>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium border ${STATUS_COLORS[demo.status] ?? ""}`}>
                  {STATUS_LABELS[demo.status] ?? demo.status}
                </span>
              </div>

              {/* Figma thumbnail placeholder */}
              <div className="rounded-lg overflow-hidden mb-3 border" style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.04)" }}>
                <div className="h-28 flex items-center justify-center flex-col gap-2">
                  <span style={{ fontSize: 40 }}>🎨</span>
                  {demo.versionHash && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded"
                      style={{ background: "rgba(139,92,246,0.15)", color: "#A78BFA" }}>
                      {demo.versionHash.slice(0, 8)}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between px-3 py-2 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                  <span className="text-[10px]" style={{ color: "rgba(209,213,219,0.4)" }}>
                    v1{demo.sentAt ? ` · sent ${VI_DATE.format(new Date(demo.sentAt))}` : ""}
                  </span>
                  <a href={demo.figmaUrl} target="_blank" rel="noopener noreferrer"
                    className="text-[10px] font-medium" style={{ color: "#A78BFA" }}
                    onClick={e => e.stopPropagation()}>
                    Mở Figma →
                  </a>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[10px]" style={{ color: "rgba(209,213,219,0.3)" }}>
                  {demo.createdAt ? VI_DATE.format(new Date(demo.createdAt)) : ""}
                </span>
                <button onClick={e => { e.stopPropagation(); sendToClient(demo); }}
                  className="rounded-lg px-2.5 py-1 text-[10px] font-medium text-white transition-all hover:opacity-80"
                  style={{ background: "#1abb9c" }}>
                  Copy link
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)" }}
          onClick={() => setShowCreate(false)}>
          <div className="w-full max-w-md rounded-2xl border p-6" style={{ background: "#1a1a2e", borderColor: "rgba(255,255,255,0.1)" }}
            onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-white mb-5">Tạo Figma Demo</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(209,213,219,0.6)" }}>Dự án *</label>
                <select value={form.projectId}
                  onChange={e => setForm(f => ({ ...f, projectId: e.target.value }))}
                  className="w-full rounded-lg border px-3 py-2.5 text-sm text-white outline-none focus:border-purple-500"
                  style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }}>
                  <option value="">— Chọn dự án —</option>
                  {orders.map(o => <option key={o.id} value={o.id}>{o.orderNumber} · {o.customerName}</option>)}
                </select>
              </div>
              <input type="text" value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Tiêu đề demo (VD: Homepage v1)"
                className="w-full rounded-lg border px-3 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-purple-500"
                style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }} />
              <input type="url" value={form.figmaUrl}
                onChange={e => setForm(f => ({ ...f, figmaUrl: e.target.value }))}
                placeholder="https://figma.com/file/..."
                className="w-full rounded-lg border px-3 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-purple-500"
                style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }} />
              <input type="email" value={form.clientEmail}
                onChange={e => setForm(f => ({ ...f, clientEmail: e.target.value }))}
                placeholder="Email khách hàng (tùy chọn)"
                className="w-full rounded-lg border px-3 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-purple-500"
                style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }} />
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowCreate(false)}
                className="flex-1 rounded-lg border py-2.5 text-sm font-medium transition-colors hover:bg-white/5"
                style={{ borderColor: "rgba(255,255,255,0.1)", color: "rgba(209,213,219,0.7)" }}>Hủy</button>
              <button onClick={createDemo} disabled={saving}
                className="flex-1 rounded-lg py-2.5 text-sm font-medium text-white transition-all hover:opacity-90 disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #8B5CF6, #6366F1)" }}>
                {saving ? "Đang lưu..." : "Tạo Demo"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)" }}
          onClick={() => setSelected(null)}>
          <div className="w-full max-w-lg rounded-2xl border p-6 max-h-[90vh] overflow-y-auto"
            style={{ background: "#1a1a2e", borderColor: "rgba(255,255,255,0.1)" }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-white">{selected.title}</h2>
                <p className="text-xs mt-0.5" style={{ color: "rgba(209,213,219,0.5)" }}>
                  {selected.project.customerName} · {selected.project.orderNumber}
                </p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-medium border ${STATUS_COLORS[selected.status]}`}>
                {STATUS_LABELS[selected.status]}
              </span>
            </div>

            {/* Figma preview */}
            <div className="rounded-xl overflow-hidden border mb-4" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
              <div className="h-40 flex flex-col items-center justify-center gap-3" style={{ background: "rgba(255,255,255,0.02)" }}>
                <span style={{ fontSize: 40 }}>🎨</span>
                <a href={selected.figmaUrl} target="_blank" rel="noopener noreferrer"
                  className="rounded-lg px-4 py-2 text-sm font-medium text-white"
                  style={{ background: "#1abb9c" }}>
                  Mở Figma
                </a>
              </div>
            </div>

            {/* Info */}
            <div className="space-y-2 text-sm mb-5">
              {([
                ["Version hash", selected.versionHash ?? "—"],
                ["Review link", `${typeof window !== "undefined" ? window.location.origin : ""}/figma/review/${selected.clientToken}`],
                ["Client email", selected.clientEmail ?? "—"],
                ["Tạo lúc", selected.createdAt ? VI_DATE.format(new Date(selected.createdAt)) : "—"],
                ["Gửi lúc", selected.sentAt ? VI_DATE.format(new Date(selected.sentAt)) : "—"],
              ] as const).map(([label, value]) => (
                <div key={label} className="flex justify-between">
                  <span style={{ color: "rgba(209,213,219,0.4)" }}>{label}</span>
                  <span className="text-white text-xs truncate max-w-[250px]" title={value}>{value}</span>
                </div>
              ))}
              {selected.rejectionNote && (
                <div className="flex flex-col gap-1 mt-2 p-2 rounded-lg"
                  style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
                  <span style={{ color: "#EF4444" }} className="text-xs font-medium">Lý do từ chối:</span>
                  <span style={{ color: "rgba(209,213,219,0.7)" }} className="text-xs">{selected.rejectionNote}</span>
                </div>
              )}
            </div>

            {/* Send button */}
            <button onClick={() => sendToClient(selected)}
              className="w-full rounded-lg py-2.5 text-sm font-medium text-white transition-all hover:opacity-90 mb-3"
              style={{ background: "#1abb9c" }}>
              📋 Copy link gửi khách
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
