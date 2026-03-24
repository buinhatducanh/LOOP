"use client";

import { useState, useEffect, useCallback } from "react";
import { ProjectHeader } from "@/components/admin/shared/project-header";

interface Props { params: Promise<{ id: string }>; }

interface BugNote {
  id: string; taskId: string; authorId: string;
  severity: string; content: string;
  status: string; // open | acknowledged | resolved
  resolvedAt: string | null;
  createdAt: string;
  task?: { id: string; title: string; status: string; backlog?: { projectId: string } };
  author?: { id: string; name: string };
}

const SEVERITY_COLORS: Record<string, string> = {
  low: "text-blue-400", medium: "text-yellow-400",
  high: "text-orange-400", critical: "text-red-400",
};
const SEVERITY_BG: Record<string, string> = {
  low: "bg-blue-500/20", medium: "bg-yellow-500/20",
  high: "bg-orange-500/20", critical: "bg-red-500/20",
};
const VI_DATE = new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

export default function QaPage({ params: paramsPromise }: Props) {
  const [projectId, setProjectId] = useState("");
  const [bugs, setBugs] = useState<BugNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: "open", severity: "" });
  const [selected, setSelected] = useState<BugNote | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [tasks, setTasks] = useState<{ id: string; title: string }[]>([]);
  const [processing, setProcessing] = useState<string | null>(null);
  const [form, setForm] = useState({
    taskId: "", severity: "medium", content: "",
  });

  useEffect(() => { paramsPromise.then(p => setProjectId(p.id)); }, [paramsPromise]);

  const fetchBugs = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      // BugNotes are scoped to a project via task → backlog → projectId
      const res = await fetch("/api/admin/bug-notes");
      const json = await res.json();
      const all: BugNote[] = json.data ?? [];
      // Filter by project via task relation
      const filtered = all.filter(b =>
        b.task?.backlog?.projectId === projectId &&
        (filter.status ? b.status === filter.status : true) &&
        (filter.severity ? b.severity === filter.severity : true)
      );
      setBugs(filtered);
    } finally { setLoading(false); }
  }, [projectId, filter]);

  useEffect(() => { fetchBugs(); }, [fetchBugs]);

  useEffect(() => {
    if (!projectId) return;
    fetch(`/api/admin/tasks?projectId=${projectId}`)
      .then(r => r.json())
      .then(j => setTasks(j.data ?? []));
  }, [projectId]);

  const resolve = async (id: string) => {
    setProcessing(id);
    try {
      await fetch(`/api/admin/bug-notes/${id}/resolve`, { method: "POST" });
      fetchBugs();
      setSelected(null);
    } finally { setProcessing(null); }
  };

  const submitBug = async () => {
    if (!form.taskId || !form.content) return;
    await fetch("/api/admin/bug-notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setCreateOpen(false);
    setForm({ taskId: "", severity: "medium", content: "" });
    fetchBugs();
  };

  const openCount = bugs.filter(b => b.status === "open").length;
  const resolvedCount = bugs.filter(b => b.status === "resolved").length;

  return (
    <div className="p-6">
      <ProjectHeader projectId={projectId} className="mb-6" />

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Bug Tracker</h1>
          <p className="text-sm mt-1" style={{ color: "rgba(209,213,219,0.5)" }}>Theo dõi lỗi & vấn đề chất lượng</p>
        </div>
        <button onClick={() => setCreateOpen(true)}
          className="rounded-lg px-4 py-2 text-sm font-bold text-white transition-all hover:opacity-90"
          style={{ background: "#EF4444" }}>
          + Báo lỗi
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {([
          { label: "Bug mở", count: openCount, color: "#EF4444" },
          { label: "Đã fix", count: resolvedCount, color: "#10B981" },
        ] as const).map(s => (
          <div key={s.label} className="rounded-xl border p-4 text-center"
            style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.08)" }}>
            <p className="text-2xl font-black" style={{ color: s.color }}>{s.count}</p>
            <p className="text-xs mt-1" style={{ color: "rgba(209,213,219,0.5)" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Status + Severity filters */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {(["open", "resolved"] as const).map(s => (
          <button key={s} onClick={() => setFilter(f => ({ ...f, status: s }))}
            className="rounded-lg border px-3 py-1 text-xs font-medium transition-all"
            style={{
              background: filter.status === s ? "rgba(99,102,241,0.2)" : "transparent",
              borderColor: filter.status === s ? "rgba(99,102,241,0.4)" : "rgba(255,255,255,0.1)",
              color: filter.status === s ? "#fff" : "rgba(209,213,219,0.5)",
            }}>
            {s === "open" ? "Mở" : "Đã fix"}
          </button>
        ))}
        <span className="mx-1" style={{ color: "rgba(255,255,255,0.1)" }}>|</span>
        {(["", "low", "medium", "high", "critical"] as const).map(s => (
          <button key={s} onClick={() => setFilter(f => ({ ...f, severity: s }))}
            className="rounded-lg border px-3 py-1 text-xs font-medium transition-all"
            style={{
              background: filter.severity === s ? (s === "critical" ? "rgba(239,68,68,0.2)" : s === "high" ? "rgba(249,115,22,0.2)" : s === "medium" ? "rgba(245,158,11,0.2)" : "rgba(59,130,246,0.2)") : "transparent",
              borderColor: filter.severity === s ? (s === "critical" ? "rgba(239,68,68,0.4)" : s === "high" ? "rgba(249,115,22,0.4)" : s === "medium" ? "rgba(245,158,11,0.4)" : "rgba(59,130,246,0.4)") : "rgba(255,255,255,0.1)",
              color: filter.severity === s ? "#fff" : "rgba(209,213,219,0.5)",
            }}>
            {s === "" ? "Tất cả" : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Bug list */}
      {loading ? (
        <p className="text-center py-20" style={{ color: "rgba(209,213,219,0.3)" }}>Đang tải...</p>
      ) : bugs.length === 0 ? (
        <div className="text-center py-20 rounded-xl border"
          style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.06)" }}>
          <p className="text-4xl mb-3">🐛</p>
          <p className="text-sm" style={{ color: "rgba(209,213,219,0.3)" }}>Không có bug nào</p>
        </div>
      ) : (
        <div className="space-y-3">
          {bugs.map(bug => {
            const isResolved = bug.status === "resolved";
            return (
              <div key={bug.id}
                className="rounded-xl border p-4 cursor-pointer transition-all hover:border-white/15"
                style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.08)" }}
                onClick={() => setSelected(bug)}>
                <div className="flex items-center gap-3">
                  <span className={`text-lg font-black shrink-0 ${SEVERITY_COLORS[bug.severity]}`}>
                    {bug.severity === "critical" ? "⬡" : bug.severity === "high" ? "◆" : bug.severity === "medium" ? "●" : "○"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium border ${SEVERITY_BG[bug.severity]} ${SEVERITY_COLORS[bug.severity]}`}>
                        {bug.severity}
                      </span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium border ${isResolved ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-red-500/20 text-red-400 border-red-500/30"}`}>
                        {isResolved ? "Đã fix" : "Mở"}
                      </span>
                    </div>
                    <p className="text-sm text-white truncate">{bug.content}</p>
                    {bug.task && (
                      <p className="text-[10px] mt-0.5 truncate" style={{ color: "rgba(209,213,219,0.4)" }}>
                        Task: {bug.task.title}
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs" style={{ color: "rgba(209,213,219,0.4)" }}>
                      {VI_DATE.format(new Date(bug.createdAt))}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Bug detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.7)" }}>
          <div className="rounded-2xl border p-6 w-full max-w-lg"
            style={{ background: "#1a1a2e", borderColor: "rgba(255,255,255,0.1)" }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className={`font-black ${SEVERITY_COLORS[selected.severity]}`}>
                  {selected.severity === "critical" ? "⬡" : selected.severity === "high" ? "◆" : "●"} {selected.severity}
                </span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium border ${selected.status === "resolved" ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-red-500/20 text-red-400 border-red-500/30"}`}>
                  {selected.status === "resolved" ? "Đã fix" : "Mở"}
                </span>
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-white">✕</button>
            </div>

            <p className="text-white font-semibold mb-2">{selected.content}</p>

            {selected.resolvedAt && (
              <div className="mb-4">
                <p className="text-xs font-medium mb-1" style={{ color: "rgba(209,213,219,0.5)" }}>Fixed at</p>
                <p className="text-sm text-green-400">
                  {VI_DATE.format(new Date(selected.resolvedAt))}
                </p>
              </div>
            )}

            {selected.task && (
              <p className="text-xs mb-3" style={{ color: "rgba(209,213,219,0.4)" }}>
                Task: <span className="text-white">{selected.task.title}</span>
              </p>
            )}

            <div className="flex gap-2 mt-4">
              {selected.status !== "resolved" && (
                <button
                  onClick={() => resolve(selected.id)}
                  disabled={processing === selected.id}
                  className="flex-1 rounded-lg py-2 text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-50"
                  style={{ background: "#10B981" }}>
                  {processing === selected.id ? "..." : "✓ Đánh dấu đã fix"}
                </button>
              )}
              <button onClick={() => setSelected(null)}
                className="rounded-lg border px-4 py-2 text-sm text-gray-400 border-white/10">
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create bug modal */}
      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.7)" }}>
          <div className="rounded-2xl border p-6 w-full max-w-md"
            style={{ background: "#1a1a2e", borderColor: "rgba(255,255,255,0.1)" }}>
            <h2 className="text-lg font-bold text-white mb-4">🐛 Báo lỗi mới</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: "rgba(209,213,219,0.6)" }}>Task liên quan</label>
                <select value={form.taskId} onChange={e => setForm(f => ({ ...f, taskId: e.target.value }))}
                  className="w-full rounded-lg border px-3 py-2 text-sm text-white"
                  style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }}>
                  <option value="">— Chọn task —</option>
                  {tasks.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: "rgba(209,213,219,0.6)" }}>Mức độ</label>
                <select value={form.severity} onChange={e => setForm(f => ({ ...f, severity: e.target.value }))}
                  className="w-full rounded-lg border px-3 py-2 text-sm text-white"
                  style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }}>
                  {["low", "medium", "high", "critical"].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: "rgba(209,213,219,0.6)" }}>Mô tả lỗi</label>
                <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                  rows={3} placeholder="Mô tả chi tiết lỗi..."
                  className="w-full rounded-lg border px-3 py-2 text-sm text-white resize-none"
                  style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }} />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={submitBug} disabled={!form.taskId || !form.content}
                className="flex-1 rounded-lg py-2 text-sm font-bold text-white disabled:opacity-40"
                style={{ background: "#EF4444" }}>
                Gửi báo lỗi
              </button>
              <button onClick={() => setCreateOpen(false)}
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
