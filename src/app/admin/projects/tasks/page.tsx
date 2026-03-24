"use client";

import { useState, useEffect, useCallback } from "react";
import { EmptyState } from "@/components/admin/ui/empty-state";
import { LoadingSkeleton } from "@/components/admin/ui/loading-skeleton";

const VI_DATE = new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", hour: "2-digit" });

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  backlog: { bg: "rgba(100,116,139,0.2)", color: "#94a3b8" },
  in_progress: { bg: "rgba(59,130,246,0.2)", color: "#60a5fa" },
  in_review: { bg: "rgba(245,158,11,0.2)", color: "#f59e0b" },
  done: { bg: "rgba(16,185,129,0.2)", color: "#10B981" },
};
const STATUS_LABELS: Record<string, string> = {
  backlog: "Backlog", in_progress: "Đang làm", in_review: "Review", done: "Done",
};

interface Task {
  id: string; title: string; status: string; priority: string;
  violated: boolean; slaDeadline: string | null;
  assigneeId: string | null;
  createdAt: string; completedAt: string | null;
  backlog?: { title: string; projectId: string; project?: { orderNumber: string; customerName: string } };
  assignee?: { name: string };
}

export default function ProjectTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (search) params.set("search", search);
      const res = await fetch(`/api/admin/tasks?${params}&limit=100`);
      const json = await res.json();
      setTasks(json.data ?? []);
    } finally { setLoading(false); }
  }, [statusFilter, search]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const violatedCount = tasks.filter(t => t.violated).length;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">All Tasks</h1>
          <p className="text-sm mt-1" style={{ color: "rgba(209,213,219,0.5)" }}>
            {tasks.length} tasks · {violatedCount} violated
          </p>
        </div>
        {violatedCount > 0 && (
          <div className="flex items-center gap-2 rounded-xl px-4 py-2"
            style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)" }}>
            <span className="text-lg">⚠</span>
            <span className="text-sm font-bold text-red-400">{violatedCount} SLA violations</span>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <input value={search} onChange={e => setSearch(e.target.value)}
          onKeyDown={e => e.key === "Enter" && fetchTasks()}
          placeholder="Search tasks..."
          className="flex-1 min-w-[200px] rounded-lg border px-4 py-2 text-sm text-white"
          style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }} />
        {(["all", "backlog", "in_progress", "in_review", "done"] as const).map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className="rounded-lg border px-3 py-2 text-xs font-medium transition-all capitalize"
            style={{
              background: statusFilter === s ? "rgba(99,102,241,0.15)" : "transparent",
              borderColor: statusFilter === s ? "rgba(99,102,241,0.4)" : "rgba(255,255,255,0.1)",
              color: statusFilter === s ? "#fff" : "rgba(209,213,219,0.5)",
            }}>
            {s === "all" ? "Tất cả" : STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <LoadingSkeleton type="table" count={8} />
      ) : tasks.length === 0 ? (
        <EmptyState icon="✓" message="Không có task nào" description="Tasks từ tất cả các dự án sẽ hiển thị ở đây." />
      ) : (
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          <table className="w-full">
            <thead>
              <tr style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                {["Task", "Project", "Status", "SLA", "Assignee", "Created"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium"
                    style={{ color: "rgba(209,213,219,0.5)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
              {tasks.map(task => {
                const colors = STATUS_COLORS[task.status] ?? STATUS_COLORS.backlog;
                const deadline = task.slaDeadline ? new Date(task.slaDeadline) : null;
                const isOverdue = deadline && deadline < new Date() && task.status !== "done";
                return (
                  <tr key={task.id} className="hover:bg-white/5 transition-colors"
                    style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {task.violated && <span className="text-red-400 text-sm">⚠</span>}
                        <div>
                          <p className="text-sm text-white max-w-[300px] truncate">{task.title}</p>
                          {task.backlog && (
                            <p className="text-[10px] mt-0.5" style={{ color: "rgba(209,213,219,0.3)" }}>
                              {task.backlog.title}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs text-white">{task.backlog?.project?.orderNumber ?? "—"}</p>
                      <p className="text-[10px]" style={{ color: "rgba(209,213,219,0.4)" }}>
                        {task.backlog?.project?.customerName ?? "—"}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs rounded-full px-2 py-0.5 font-medium"
                        style={{ background: colors.bg, color: colors.color }}>
                        {STATUS_LABELS[task.status] ?? task.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {deadline ? (
                        <span className={`text-xs ${isOverdue ? "text-red-400" : "text-white"}`}>
                          {isOverdue ? "⚠ " : ""}{VI_DATE.format(deadline)}
                        </span>
                      ) : <span className="text-xs" style={{ color: "rgba(209,213,219,0.3)" }}>—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold text-white"
                          style={{ background: "#6366F1" }}>
                          {task.assignee?.name?.slice(0, 1).toUpperCase() ?? "?"}
                        </div>
                        <span className="text-xs text-white">{task.assignee?.name ?? "—"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs" style={{ color: "rgba(209,213,219,0.4)" }}>
                        {VI_DATE.format(new Date(task.createdAt))}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
