"use client";

import { useState, useEffect, useCallback } from "react";

const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  high: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  critical: "bg-red-500/20 text-red-400 border-red-500/30",
};
const PRIORITY_ORDER = ["low", "medium", "high", "critical"] as const;

interface SlaRule {
  id: string; projectId: string; priority: string; maxHours: number;
  project?: { id: string; orderNumber: string; customerName: string };
}

interface Project { id: string; orderNumber: string; customerName: string; }

export default function SlaRulesPage() {
  const [rules, setRules] = useState<SlaRule[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SlaRule | null>(null);
  const [form, setForm] = useState({
    projectId: "", priority: "medium", maxHours: 24,
  });

  const fetchRules = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/sla-rules");
      const json = await res.json();
      setRules(json.data ?? []);
    } finally { setLoading(false); }
  }, []);

  const fetchProjects = useCallback(async () => {
    const res = await fetch("/api/admin/orders?status=active");
    const json = await res.json();
    setProjects(json.data ?? []);
  }, []);

  useEffect(() => {
    fetchRules();
    fetchProjects();
  }, [fetchRules, fetchProjects]);

  const openCreate = () => {
    setEditing(null);
    setForm({ projectId: "", priority: "medium", maxHours: 24 });
    setModalOpen(true);
  };

  const openEdit = (r: SlaRule) => {
    setEditing(r);
    setForm({ projectId: r.projectId, priority: r.priority, maxHours: r.maxHours });
    setModalOpen(true);
  };

  const save = async () => {
    const url = editing ? `/api/admin/sla-rules/${editing.id}` : "/api/admin/sla-rules";
    await fetch(url, {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setModalOpen(false);
    fetchRules();
  };

  const remove = async (id: string) => {
    if (!confirm("Xóa SLA rule này?")) return;
    await fetch(`/api/admin/sla-rules/${id}`, { method: "DELETE" });
    fetchRules();
  };

  const byPriority = (p: string) => rules.filter(r => r.priority === p);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">SLA Rules</h1>
          <p className="text-sm mt-1" style={{ color: "rgba(209,213,219,0.5)" }}>
            {rules.length} rules · Thời hạn xử lý task theo mức ưu tiên
          </p>
        </div>
        <button onClick={openCreate}
          className="rounded-lg px-4 py-2 text-sm font-bold text-white transition-all hover:opacity-90"
          style={{ background: "#6366F1" }}>
          + Thêm Rule
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {PRIORITY_ORDER.map(p => {
          const count = byPriority(p).length;
          return (
            <div key={p} className="rounded-xl border p-4"
              style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.08)" }}>
              <div className="flex items-center gap-2 mb-2">
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium border ${PRIORITY_COLORS[p]}`}>
                  {p}
                </span>
              </div>
              <p className="text-2xl font-black text-white">{count} rules</p>
            </div>
          );
        })}
      </div>

      {/* Rules by priority */}
      {loading ? (
        <p className="text-center py-20" style={{ color: "rgba(209,213,219,0.3)" }}>Đang tải...</p>
      ) : rules.length === 0 ? (
        <div className="text-center py-20 rounded-xl border"
          style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.06)" }}>
          <p className="text-4xl mb-3">⏱</p>
          <p className="text-sm" style={{ color: "rgba(209,213,219,0.3)" }}>Chưa có SLA rule nào</p>
        </div>
      ) : (
        <div className="space-y-6">
          {PRIORITY_ORDER.map(priority => {
            const group = byPriority(priority);
            if (group.length === 0) return null;
            return (
              <div key={priority}>
                <div className="flex items-center gap-2 mb-3">
                  <span className={`rounded-full px-3 py-1 text-xs font-medium border ${PRIORITY_COLORS[priority]}`}>
                    {priority.charAt(0).toUpperCase() + priority.slice(1)}
                  </span>
                  <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
                </div>
                <div className="space-y-2">
                  {group.map(rule => (
                    <div key={rule.id}
                      className="rounded-xl border p-4 flex items-center gap-4 cursor-pointer transition-all hover:border-white/15"
                      style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.08)" }}
                      onClick={() => openEdit(rule)}>
                      {/* SLA clock */}
                      <div className="text-center shrink-0 w-16">
                        <p className="text-2xl font-black text-white">{rule.maxHours}h</p>
                        <p className="text-[10px]" style={{ color: "rgba(209,213,219,0.4)" }}>deadline</p>
                      </div>

                      <div className="w-px h-10 shrink-0" style={{ background: "rgba(255,255,255,0.06)" }} />

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white capitalize">{priority} priority SLA</p>
                        {rule.project && (
                          <p className="text-[10px] mt-0.5" style={{ color: "rgba(139,92,246,0.7)" }}>
                            {rule.project.orderNumber} · {rule.project.customerName}
                          </p>
                        )}
                      </div>

                      <button onClick={e => { e.stopPropagation(); remove(rule.id); }}
                        className="shrink-0 text-gray-600 hover:text-red-400 transition-colors">
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.7)" }}>
          <div className="rounded-2xl border p-6 w-full max-w-md"
            style={{ background: "#1a1a2e", borderColor: "rgba(255,255,255,0.1)" }}>
            <h2 className="text-lg font-bold text-white mb-4">
              {editing ? "Sửa SLA Rule" : "Tạo SLA Rule"}
            </h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: "rgba(209,213,219,0.6)" }}>Dự án (bắt buộc)</label>
                <select value={form.projectId} onChange={e => setForm(f => ({ ...f, projectId: e.target.value }))}
                  className="w-full rounded-lg border px-3 py-2 text-sm text-white"
                  style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }}>
                  <option value="">— Chọn dự án —</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.orderNumber} · {p.customerName}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: "rgba(209,213,219,0.6)" }}>Priority</label>
                  <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                    className="w-full rounded-lg border px-3 py-2 text-sm text-white"
                    style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }}>
                    {PRIORITY_ORDER.map(p => (
                      <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: "rgba(209,213,219,0.6)" }}>SLA (giờ)</label>
                  <input type="number" value={form.maxHours} onChange={e => setForm(f => ({ ...f, maxHours: +e.target.value }))}
                    min={1} className="w-full rounded-lg border px-3 py-2 text-sm text-white"
                    style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }} />
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={save} disabled={!form.projectId || !form.maxHours}
                className="flex-1 rounded-lg py-2 text-sm font-bold text-white disabled:opacity-40"
                style={{ background: "#6366F1" }}>
                {editing ? "Lưu" : "Tạo"}
              </button>
              <button onClick={() => setModalOpen(false)}
                className="rounded-lg border px-4 py-2 text-sm text-gray-400 border-white/10">
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
