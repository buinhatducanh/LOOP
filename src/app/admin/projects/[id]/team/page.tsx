"use client";

import { useState, useEffect, useCallback } from "react";
import { ProjectHeader } from "@/components/admin/shared/project-header";

interface Props { params: Promise<{ id: string }>; }

interface Member {
  id: string; name: string; role: string;
  earnedLp: number; earnedExp: number; assignedLp: number;
}
interface TaskStats {
  total: number; backlog: number; inProgress: number; inReview: number;
  done: number; violated: number; totalLpAllocated: number; totalLpEarned: number;
}
interface Summary {
  projectId: string; members: Member[]; memberStats: Record<string, { approved: number; pending: number; rejected: number }>;
  taskStats: TaskStats;
  totalLpAwarded: number; totalLpPending: number;
}

export default function ProjectTeamPage({ params: paramsPromise }: Props) {
  const [projectId, setProjectId] = useState("");
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { paramsPromise.then(p => setProjectId(p.id)); }, [paramsPromise]);

  const loadSummary = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/lp-summary/${projectId}`);
      const json = await res.json();
      setSummary(json.data);
    } finally { setLoading(false); }
  }, [projectId]);

  useEffect(() => { loadSummary(); }, [loadSummary]);

  if (loading || !summary) return (
    <div className="p-6 text-center" style={{ color: "rgba(209,213,219,0.4)" }}>Đang tải...</div>
  );

  const { taskStats, totalLpAwarded, totalLpPending, members, memberStats } = summary;

  return (
    <div className="p-6">
      <ProjectHeader projectId={projectId} className="mb-6" />

      {/* Overall stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {([
          { label: "Tổng LP đã duyệt", value: `⬡${totalLpAwarded}`, color: "#A78BFA" },
          { label: "LP chờ duyệt", value: `⬡${totalLpPending}`, color: "#F59E0B" },
          { label: "Tasks hoàn thành", value: taskStats.done, color: "#10B981" },
          { label: "Tasks vi phạm", value: taskStats.violated, color: "#EF4444" },
        ] as const).map(stat => (
          <div key={stat.label} className="rounded-xl border p-4 text-center"
            style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.08)" }}>
            <p className="text-2xl font-black" style={{ color: stat.color }}>{stat.value}</p>
            <p className="text-xs mt-1" style={{ color: "rgba(209,213,219,0.5)" }}>{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Task progress */}
      <div className="rounded-xl border p-5 mb-8" style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.08)" }}>
        <h2 className="text-sm font-semibold text-white mb-4">Tiến độ Tasks</h2>
        <div className="grid grid-cols-5 gap-2 mb-3">
          {([
            { label: "Backlog", count: taskStats.backlog, color: "#64748b" },
            { label: "Đang làm", count: taskStats.inProgress, color: "#3B82F6" },
            { label: "Review", count: taskStats.inReview, color: "#F59E0B" },
            { label: "Done", count: taskStats.done, color: "#10B981" },
            { label: "Violated", count: taskStats.violated, color: "#EF4444" },
          ] as const).map(col => (
            <div key={col.label} className="text-center">
              <p className="text-lg font-black" style={{ color: col.color }}>{col.count}</p>
              <p className="text-[10px]" style={{ color: "rgba(209,213,219,0.4)" }}>{col.label}</p>
            </div>
          ))}
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.1)" }}>
          <div className="h-full rounded-full flex">
            <div style={{ width: `${taskStats.total > 0 ? (taskStats.inProgress / taskStats.total) * 100 : 0}%`, background: "#3B82F6" }} />
            <div style={{ width: `${taskStats.total > 0 ? (taskStats.inReview / taskStats.total) * 100 : 0}%`, background: "#F59E0B" }} />
            <div style={{ width: `${taskStats.total > 0 ? (taskStats.done / taskStats.total) * 100 : 0}%`, background: "#10B981" }} />
            <div style={{ width: `${taskStats.total > 0 ? (taskStats.violated / taskStats.total) * 100 : 0}%`, background: "#EF4444" }} />
          </div>
        </div>
      </div>

      {/* Member LP Leaderboard */}
      <div className="rounded-xl border overflow-hidden" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
        <div className="px-5 py-4" style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <h2 className="text-sm font-semibold text-white">LP Leaderboard</h2>
        </div>
        <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
          {members
            .sort((a, b) => b.earnedLp - a.earnedLp)
            .map((member, i) => {
              const stats = memberStats[member.id] ?? { approved: 0, pending: 0, rejected: 0 };
              const totalEarned = stats.approved;
              const maxLp = Math.max(...members.map(m => (memberStats[m.id]?.approved ?? 0) + (memberStats[m.id]?.pending ?? 0)), 1);
              const barWidth = Math.round(((stats.approved + stats.pending) / maxLp) * 100);
              return (
                <div key={member.id} className="flex items-center gap-4 px-5 py-4">
                  <span className="text-lg font-black w-6 text-center shrink-0"
                    style={{ color: i === 0 ? "#F59E0B" : i === 1 ? "#9CA3AF" : i === 2 ? "#CD7F32" : "rgba(209,213,219,0.3)" }}>
                    #{i + 1}
                  </span>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                    style={{ background: ["#6366F1", "#EC4899", "#F59E0B", "#10B981", "#06B6D4"][i % 5] }}>
                    {member.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-white truncate">{member.name}</span>
                      <span className="text-[10px] rounded px-1.5 py-0.5 shrink-0"
                        style={{ background: "rgba(99,102,241,0.15)", color: "#818CF8" }}>
                        {member.role}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                      <div className="h-full rounded-full flex"
                        style={{ width: `${barWidth}%`, background: "linear-gradient(to right, #8B5CF6, #06B6D4)" }} />
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-base font-black" style={{ color: "#A78BFA" }}>⬡{totalEarned}</p>
                    {stats.pending > 0 && (
                      <p className="text-[10px]" style={{ color: "rgba(245,158,11,0.8)" }}>+⬡{stats.pending} pending</p>
                    )}
                  </div>
                </div>
              );
            })}
          {members.length === 0 && (
            <p className="text-center py-8 text-sm" style={{ color: "rgba(209,213,219,0.2)" }}>
              Chưa có thành viên trong dự án
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
