"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface PortalData {
  project: {
    id: string; orderNumber: string; customerName: string;
    companyName: string | null; domainName: string | null; projectStatus: string;
  };
  label: string;
  stats: {
    totalTasks: number; doneTasks: number;
    completionRate: number; memberCount: number;
  };
  members: { id: string; name: string; role: string; image: string | null }[];
  epics: {
    id: string; name: string; status: string;
    backlogs: {
      id: string; name: string;
      tasks: { id: string; title: string; status: string; completedAt: string | null }[];
    }[];
  }[];
  recentDeployments: {
    id: string; environment: string; status: string;
    deployedAt: string | null; deployUrl: string | null;
  }[];
  handoverStatus: { status: string; completedSections: number; totalSections: number } | null;
}

const ENV_COLORS: Record<string, { color: string; bg: string }> = {
  production: { color: "#10B981", bg: "rgba(16,185,129,0.1)" },
  staging: { color: "#F59E0B", bg: "rgba(245,158,11,0.1)" },
  dev: { color: "#6366F1", bg: "rgba(99,102,241,0.1)" },
};

const TASK_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  backlog: { label: "Backlog", color: "#94A3B8" },
  in_progress: { label: "Đang làm", color: "#3B82F6" },
  in_review: { label: "Review", color: "#F59E0B" },
  done: { label: "Hoàn thành", color: "#10B981" },
};

const fmtDate = (d: string | null) => {
  if (!d) return "—";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric"
  }).format(new Date(d));
};

export default function PortalPage() {
  const params = useParams();
  const token = params.token as string;

  const [data, setData] = useState<PortalData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPortal = useCallback(async () => {
    try {
      const res = await fetch(`/api/portal/${token}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Không thể tải dữ liệu");
      setData(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchPortal(); }, [fetchPortal]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#0f0f1a" }}>
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-full border-2 animate-spin" style={{ borderColor: "rgba(139,92,246,0.3)", borderTopColor: "#8B5CF6" }} />
        <p className="text-sm" style={{ color: "rgba(209,213,219,0.5)" }}>Đang tải dữ liệu dự án…</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#0f0f1a" }}>
      <div className="text-center">
        <p className="text-5xl mb-4">🔒</p>
        <h1 className="text-xl font-bold text-white mb-2">Không có quyền truy cập</h1>
        <p className="text-sm mb-4" style={{ color: "rgba(209,213,219,0.5)" }}>{error}</p>
        <Link href="https://loop.vn" className="text-sm" style={{ color: "#8B5CF6" }}>Quay về loop.vn</Link>
      </div>
    </div>
  );

  if (!data) return null;

  const { project, stats, members, epics, recentDeployments, handoverStatus } = data;
  const completionRate = stats.totalTasks > 0
    ? Math.round((stats.doneTasks / stats.totalTasks) * 100)
    : 0;

  const allTasks = epics.flatMap(e => e.backlogs.flatMap(b => b.tasks));
  const doneTasks = allTasks.filter(t => t.status === "done").length;

  return (
    <div className="min-h-screen" style={{ background: "#0f0f1a" }}>
      {/* Header */}
      <header className="border-b" style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(9,11,20,0.98)" }}>
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black text-white"
                style={{ background: "linear-gradient(135deg, #8B5CF6, #06B6D4)" }}>L</div>
              <span className="font-bold text-white">LOOP Studio</span>
            </div>
            <p className="text-xs mt-0.5" style={{ color: "rgba(209,213,219,0.4)" }}>
              {project.companyName ?? project.customerName}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-1 rounded-full font-medium"
              style={{
                background: project.projectStatus === "active" ? "rgba(16,185,129,0.12)" : "rgba(245,158,11,0.12)",
                color: project.projectStatus === "active" ? "#10B981" : "#F59E0B",
              }}>
              {project.projectStatus === "active" ? "● Active" : "⏸ " + project.projectStatus}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {/* Project Title */}
        <div className="text-center py-4">
          <h1 className="text-2xl font-black text-white mb-1">
            Tiến độ dự án
          </h1>
          <p className="text-sm" style={{ color: "rgba(209,213,219,0.5)" }}>
            {project.customerName}
            {project.companyName && ` · ${project.companyName}`}
            {project.domainName && (
              <span> · <a href={`https://${project.domainName}`} target="_blank" rel="noopener noreferrer"
                className="underline" style={{ color: "#8B5CF6" }}>{project.domainName}</a></span>
            )}
          </p>
        </div>

        {/* Overall Progress */}
        <div className="rounded-2xl border p-6 text-center"
          style={{ background: "rgba(139,92,246,0.06)", borderColor: "rgba(139,92,246,0.2)" }}>
          <p className="text-xs mb-2" style={{ color: "rgba(209,213,219,0.4)" }}>TIẾN ĐỘ CHUNG</p>
          <p className="text-5xl font-black mb-3" style={{ color: "#A78BFA" }}>{completionRate}%</p>
          <div className="h-3 rounded-full overflow-hidden mb-3 mx-auto max-w-sm"
            style={{ background: "rgba(255,255,255,0.1)" }}>
            <div className="h-full rounded-full transition-all"
              style={{ width: `${completionRate}%`, background: "linear-gradient(to right, #8B5CF6, #06B6D4)" }} />
          </div>
          <p className="text-xs" style={{ color: "rgba(209,213,219,0.4)" }}>
            {doneTasks}/{allTasks.length} công việc hoàn thành
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4">
          {([
            { label: "Tổng công việc", value: allTasks.length, color: "#6366F1" },
            { label: "Đã hoàn thành", value: doneTasks, color: "#10B981" },
            { label: "Thành viên", value: members.length, color: "#F59E0B" },
          ] as const).map(s => (
            <div key={s.label}
              className="rounded-xl border p-4 text-center"
              style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.08)" }}>
              <p className="text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs mt-1" style={{ color: "rgba(209,213,219,0.4)" }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Team */}
        {members.length > 0 && (
          <div className="rounded-xl border overflow-hidden"
            style={{ borderColor: "rgba(255,255,255,0.08)" }}>
            <div className="px-5 py-4 border-b" style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
              <h2 className="text-sm font-semibold text-white">👥 Đội ngũ dự án</h2>
            </div>
            <div className="p-5 flex gap-4 flex-wrap">
              {members.map(m => (
                <div key={m.id} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white overflow-hidden"
                    style={{ background: "linear-gradient(135deg, #8B5CF6, #06B6D4)" }}>
                    {m.image ? (
                      <img src={m.image} alt={m.name} className="w-full h-full object-cover" />
                    ) : m.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{m.name}</p>
                    <p className="text-[10px]" style={{ color: "rgba(209,213,219,0.4)" }}>{m.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Task Progress by Epic */}
        {epics.map(epic => {
          const epicTasks = epic.backlogs.flatMap(b => b.tasks);
          const epicDone = epicTasks.filter(t => t.status === "done").length;
          const epicRate = epicTasks.length > 0 ? Math.round((epicDone / epicTasks.length) * 100) : 0;

          return (
            <div key={epic.id} className="rounded-xl border overflow-hidden"
              style={{ borderColor: "rgba(255,255,255,0.08)" }}>
              {/* Epic Header */}
              <div className="px-5 py-4 border-b" style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-white">{epic.name}</h3>
                    <p className="text-[10px]" style={{ color: "rgba(209,213,219,0.4)" }}>
                      {epicDone}/{epicTasks.length} công việc hoàn thành
                    </p>
                  </div>
                  <span className="text-sm font-bold" style={{ color: epicRate >= 80 ? "#10B981" : epicRate >= 50 ? "#F59E0B" : "#EF4444" }}>
                    {epicRate}%
                  </span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden mt-2"
                  style={{ background: "rgba(255,255,255,0.08)" }}>
                  <div className="h-full rounded-full"
                    style={{
                      width: `${epicRate}%`,
                      background: epicRate >= 80 ? "#10B981" : epicRate >= 50 ? "#F59E0B" : "#EF4444",
                    }} />
                </div>
              </div>

              {/* Backlogs + Tasks */}
              <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                {epic.backlogs.map(backlog => (
                  <div key={backlog.id} className="px-5 py-3">
                    <p className="text-xs font-medium text-white mb-2">{backlog.name}</p>
                    <div className="space-y-1">
                      {backlog.tasks.map(task => {
                        const s = TASK_STATUS_LABELS[task.status] ?? TASK_STATUS_LABELS.backlog;
                        return (
                          <div key={task.id} className="flex items-center gap-2 text-xs">
                            <span style={{ color: s.color }}>
                              {task.status === "done" ? "✓" : task.status === "in_progress" ? "●" : task.status === "in_review" ? "◐" : "○"}
                            </span>
                            <span className={task.status === "done" ? "line-through" : ""}
                              style={{ color: task.status === "done" ? "rgba(209,213,219,0.3)" : "#fff" }}>
                              {task.title}
                            </span>
                            {task.status === "done" && task.completedAt && (
                              <span className="ml-auto text-[10px]" style={{ color: "rgba(209,213,219,0.3)" }}>
                                {fmtDate(task.completedAt)}
                              </span>
                            )}
                          </div>
                        );
                      })}
                      {backlog.tasks.length === 0 && (
                        <p className="text-xs italic" style={{ color: "rgba(209,213,219,0.25)" }}>Chưa có công việc</p>
                      )}
                    </div>
                  </div>
                ))}
                {epic.backlogs.length === 0 && (
                  <p className="text-center py-6 text-sm" style={{ color: "rgba(209,213,219,0.25)" }}>Chưa có backlog</p>
                )}
              </div>
            </div>
          );
        })}

        {/* Recent Deployments */}
        {recentDeployments.length > 0 && (
          <div className="rounded-xl border overflow-hidden"
            style={{ borderColor: "rgba(255,255,255,0.08)" }}>
            <div className="px-5 py-4 border-b" style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
              <h2 className="text-sm font-semibold text-white">🚀 Deployments gần đây</h2>
            </div>
            <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
              {recentDeployments.map(d => {
                const env = ENV_COLORS[d.environment] ?? ENV_COLORS.dev;
                return (
                  <div key={d.id} className="flex items-center gap-4 px-5 py-3">
                    <span className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase"
                      style={{ background: env.bg, color: env.color }}>{d.environment}</span>
                    <span className="text-xs font-medium text-white">{d.deployUrl ?? "—"}</span>
                    <span className="ml-auto text-xs" style={{ color: "rgba(209,213,219,0.4)" }}>
                      {d.deployedAt ? fmtDate(d.deployedAt) : "—"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Handover Status */}
        {handoverStatus && (
          <div className="rounded-xl border p-5"
            style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-white">📦 Handover Package</h2>
              <span className="text-xs font-medium px-2 py-1 rounded-full"
                style={{
                  background: handoverStatus.status === "delivered" ? "rgba(16,185,129,0.12)" : "rgba(245,158,11,0.12)",
                  color: handoverStatus.status === "delivered" ? "#10B981" : "#F59E0B",
                }}>
                {handoverStatus.status}
              </span>
            </div>
            <p className="text-xs" style={{ color: "rgba(209,213,219,0.5)" }}>
              Đã hoàn thành {handoverStatus.completedSections}/{handoverStatus.totalSections} sections
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="text-center pt-8 pb-4">
          <p className="text-xs" style={{ color: "rgba(209,213,219,0.25)" }}>
            Powered by <span style={{ color: "#8B5CF6" }}>LOOP Studio</span> · Cung cấp bởi hệ thống quản lý dự án nội bộ
          </p>
        </div>
      </main>
    </div>
  );
}
