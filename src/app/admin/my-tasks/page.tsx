"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
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
const NEXT_STATUS: Record<string, { label: string; color: string }> = {
  backlog: { label: "Bắt đầu", color: "#3B82F6" },
  in_progress: { label: "Gửi Review", color: "#F59E0B" },
  in_review: { label: "Hoàn thành", color: "#10B981" },
  done: { label: "Mở lại", color: "#6B7280" },
};

interface TaskTag { id: string; name: string; color: string; }
interface Task {
  id: string; title: string; description: string | null;
  lp: number; status: string; priority: string;
  violated: boolean; slaDeadline: string | null;
  completedAt: string | null; updatedAt: string;
  tags: TaskTag[];
  backlog: {
    id: string; name: string; title: string;
    project: { id: string; orderNumber: string; customerName: string };
  };
}

export default function MyTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [transitioning, setTransitioning] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      const res = await fetch(`/api/admin/tasks/my?${params}`);
      const json = await res.json();
      setTasks(json.data ?? []);
    } finally { setLoading(false); }
  }, [statusFilter]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const transitionTask = async (task: Task) => {
    const next = {
      backlog: "in_progress",
      in_progress: "in_review",
      in_review: "done",
      done: "in_progress",
    }[task.status] as string;
    if (!next) return;

    setTransitioning(task.id);
    try {
      const res = await fetch(`/api/admin/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) throw new Error();
      toast.success(`"${task.title.slice(0, 40)}" → ${STATUS_LABELS[next]}`);
      fetchTasks();
    } catch {
      toast.error("Lỗi khi cập nhật trạng thái");
    } finally { setTransitioning(null); }
  };

  // Group by project
  const byProject = tasks.reduce<Record<string, Task[]>>((acc, t) => {
    const pid = t.backlog.project.id;
    if (!acc[pid]) acc[pid] = [];
    acc[pid].push(t);
    return acc;
  }, {});

  const stats = {
    total: tasks.length,
    done: tasks.filter(t => t.status === "done").length,
    inProgress: tasks.filter(t => t.status === "in_progress").length,
    violated: tasks.filter(t => t.violated).length,
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Công việc của tôi</h1>
          <p className="text-sm mt-1" style={{ color: "rgba(209,213,219,0.5)" }}>
            {stats.total} tasks · {stats.done} done · {stats.inProgress} đang làm
            {stats.violated > 0 && ` · ${stats.violated} violated`}
          </p>
        </div>
        {stats.violated > 0 && (
          <div className="flex items-center gap-2 rounded-xl px-4 py-2"
            style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)" }}>
            <span className="text-sm font-bold text-red-400">⚠ {stats.violated} SLA violations</span>
          </div>
        )}
      </div>

      {/* Status filters */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {(["all", "backlog", "in_progress", "in_review", "done"] as const).map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className="rounded-lg border px-4 py-2 text-xs font-medium capitalize transition-all"
            style={{
              background: statusFilter === s ? "rgba(99,102,241,0.15)" : "transparent",
              borderColor: statusFilter === s ? "rgba(99,102,241,0.4)" : "rgba(255,255,255,0.1)",
              color: statusFilter === s ? "#fff" : "rgba(209,213,219,0.5)",
            }}>
            {s === "all" ? `Tất cả (${stats.total})` : `${STATUS_LABELS[s]} (${tasks.filter(t => t.status === s).length})`}
          </button>
        ))}
      </div>

      {/* Tasks by project */}
      {loading ? (
        <LoadingSkeleton type="row" count={6} />
      ) : tasks.length === 0 ? (
        <EmptyState icon="✓" message="Không có task nào" description="Bạn chưa được assign task nào." />
      ) : (
        <div className="space-y-8">
          {Object.entries(byProject).map(([pid, projectTasks]) => {
            const project = projectTasks[0].backlog.project;
            return (
              <div key={pid}>
                {/* Project header */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
                  <span className="text-xs font-medium px-2" style={{ color: "rgba(139,92,246,0.8)" }}>
                    {project.orderNumber}
                  </span>
                  <span className="text-xs" style={{ color: "rgba(209,213,219,0.4)" }}>
                    {project.customerName}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full"
                    style={{ background: "rgba(255,255,255,0.05)", color: "rgba(209,213,219,0.4)" }}>
                    {projectTasks.length}
                  </span>
                  <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
                </div>

                {/* Task list */}
                <div className="space-y-2">
                  {projectTasks.map(task => {
                    const colors = STATUS_COLORS[task.status] ?? STATUS_COLORS.backlog;
                    const next = NEXT_STATUS[task.status];
                    return (
                      <div key={task.id}
                        className="rounded-xl border p-4 flex items-center gap-4"
                        style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.06)" }}>

                        {/* Status dot */}
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: colors.color }} />

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-sm text-white font-medium truncate">{task.title}</span>
                            {task.violated && (
                              <span className="text-[10px] font-bold text-red-400">⚠</span>
                            )}
                            <span className="text-[10px] rounded-full px-2 py-0.5 font-medium"
                              style={{ background: colors.bg, color: colors.color }}>
                              {STATUS_LABELS[task.status]}
                            </span>
                            {task.lp > 0 && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                                style={{ background: "rgba(139,92,246,0.15)", color: "#A78BFA" }}>
                                ⬡{task.lp}LP
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[10px]" style={{ color: "rgba(209,213,219,0.3)" }}>
                            <span>{task.backlog.name || task.backlog.title}</span>
                            {task.slaDeadline && (
                              <span style={{ color: new Date(task.slaDeadline) < new Date() && task.status !== "done" ? "#EF4444" : undefined }}>
                                SLA: {VI_DATE.format(new Date(task.slaDeadline))}
                              </span>
                            )}
                            <span>Cập nhật: {VI_DATE.format(new Date(task.updatedAt))}</span>
                          </div>
                        </div>

                        {/* Tags */}
                        {task.tags.length > 0 && (
                          <div className="hidden md:flex items-center gap-1 shrink-0">
                            {task.tags.slice(0, 3).map(tag => (
                              <span key={tag.id} className="text-[9px] rounded px-1.5 py-0.5"
                                style={{ background: tag.color + "20", color: tag.color }}>
                                {tag.name}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Transition button */}
                        <button
                          onClick={() => transitionTask(task)}
                          disabled={transitioning === task.id}
                          className="shrink-0 rounded-lg border px-3 py-1.5 text-xs font-medium text-white transition-all hover:opacity-90 disabled:opacity-40"
                          style={{
                            background: next.color,
                            borderColor: next.color,
                          }}>
                          {transitioning === task.id ? "..." : next.label}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
