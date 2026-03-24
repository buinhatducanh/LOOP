"use client";

import { useState, useEffect } from "react";

interface KpiSummary {
  totalProjects: number; activeProjects: number;
  totalTasks: number; completedTasks: number; violatedTasks: number;
  completionRate: number; violationRate: number;
  totalLpAwarded: number; totalLpPending: number;
  approvedCount: number; pendingCount: number;
}
interface Violation {
  id: string; type: string; note: string;
  task?: { id: string; title: string };
  createdAt: string;
}
interface TopMember { memberId: string; name: string; totalLp: number; }
interface ProjectHealth {
  id: string; orderNumber: string; customerName: string; memberCount: number;
  totalTasks: number; doneTasks: number; violatedTasks: number; overdueTasks: number;
  completionRate: number; healthScore: number; healthStatus: string;
}
interface TrendPoint { day: string | Date; total: number; }

const VI_DATE = new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit" });

const HEALTH_COLORS = { green: "#10B981", amber: "#F59E0B", red: "#EF4444" };

export default function KpiDashboardPage() {
  const [summary, setSummary] = useState<KpiSummary | null>(null);
  const [violations, setViolations] = useState<Violation[]>([]);
  const [topMembers, setTopMembers] = useState<TopMember[]>([]);
  const [projectHealth, setProjectHealth] = useState<ProjectHealth[]>([]);
  const [lpTrend, setLpTrend] = useState<TrendPoint[]>([]);
  const [violationTrend, setViolationTrend] = useState<TrendPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("30");

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/kpi/dashboard?period=${period}`)
      .then(r => r.json())
      .then(j => {
        const d = j.data;
        setSummary(d.summary);
        setViolations(d.recentViolations ?? []);
        setTopMembers(d.topMembers ?? []);
        setProjectHealth(d.projectHealth ?? []);
        setLpTrend(d.lpTrend ?? []);
        setViolationTrend(d.violationTrend ?? []);
      })
      .finally(() => setLoading(false));
  }, [period]);

  if (loading || !summary) return (
    <div className="p-6 text-center" style={{ color: "rgba(209,213,219,0.4)" }}>Đang tải dashboard...</div>
  );

  const { totalProjects, activeProjects, totalTasks, completedTasks, violatedTasks,
    completionRate, violationRate, totalLpAwarded, totalLpPending } = summary;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">KPI Dashboard</h1>
          <p className="text-sm mt-1" style={{ color: "rgba(209,213,219,0.5)" }}>
            Tổng quan hiệu suất toàn công ty
          </p>
        </div>
        <div className="flex items-center gap-2">
          {[("7"), ("30"), ("90")].map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className="rounded-lg border px-3 py-1.5 text-xs font-medium transition-all"
              style={{
                background: period === p ? "rgba(139,92,246,0.2)" : "transparent",
                borderColor: period === p ? "rgba(139,92,246,0.4)" : "rgba(255,255,255,0.1)",
                color: period === p ? "#fff" : "rgba(209,213,219,0.5)",
              }}>
              {p === "7" ? "7 ngày" : p === "30" ? "30 ngày" : "90 ngày"}
            </button>
          ))}
        </div>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {([
          { label: "Active Projects", value: `${activeProjects}/${totalProjects}`, sub: undefined as string | undefined, color: "#6366F1" },
          { label: "Tasks hoàn thành", value: completedTasks, sub: `${completionRate}%`, color: "#10B981" },
          { label: "Tasks vi phạm", value: violatedTasks, sub: `${violationRate}%`, color: "#EF4444" },
          { label: "LP đã duyệt", value: `⬡${totalLpAwarded}`, sub: `${totalLpPending} pending`, color: "#A78BFA" },
        ] as { label: string; value: string | number; sub?: string; color: string }[]).map(s => (
          <div key={s.label} className="rounded-xl border p-4 text-center"
            style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.08)" }}>
            <p className="text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
            {s.sub && <p className="text-[10px] mt-0.5" style={{ color: "rgba(209,213,219,0.4)" }}>{s.sub}</p>}
            <p className="text-xs mt-1" style={{ color: "rgba(209,213,219,0.5)" }}>{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Health */}
        <div className="rounded-xl border overflow-hidden"
          style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          <div className="px-5 py-4" style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <h2 className="text-sm font-semibold text-white">Project Health</h2>
          </div>
          <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
            {projectHealth.length === 0 ? (
              <p className="text-center py-8 text-sm" style={{ color: "rgba(209,213,219,0.3)" }}>Không có dữ liệu</p>
            ) : projectHealth.map(p => (
              <div key={p.id} className="px-5 py-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-3 h-3 rounded-full shrink-0"
                    style={{ background: HEALTH_COLORS[p.healthStatus as keyof typeof HEALTH_COLORS] ?? "#64748b" }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{p.orderNumber}</p>
                    <p className="text-[10px]" style={{ color: "rgba(209,213,219,0.4)" }}>{p.customerName}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-black" style={{
                      color: HEALTH_COLORS[p.healthStatus as keyof typeof HEALTH_COLORS] ?? "#64748b"
                    }}>{p.healthScore}</p>
                    <p className="text-[10px]" style={{ color: "rgba(209,213,219,0.4)" }}>score</p>
                  </div>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden mb-1" style={{ background: "rgba(255,255,255,0.08)" }}>
                  <div className="h-full rounded-full" style={{
                    width: `${p.completionRate}%`,
                    background: p.healthStatus === "green" ? "#10B981" : p.healthStatus === "amber" ? "#F59E0B" : "#EF4444",
                  }} />
                </div>
                <div className="flex gap-3 text-[10px]" style={{ color: "rgba(209,213,219,0.4)" }}>
                  <span>✓ {p.doneTasks}/{p.totalTasks}</span>
                  <span style={{ color: "#EF4444" }}>⚠ {p.violatedTasks}</span>
                  <span style={{ color: "#F59E0B" }}>⏰ {p.overdueTasks} overdue</span>
                  <span>👥 {p.memberCount} members</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* LP Leaderboard */}
        <div className="rounded-xl border overflow-hidden"
          style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          <div className="px-5 py-4" style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <h2 className="text-sm font-semibold text-white">LP Leaderboard</h2>
            <p className="text-[10px] mt-0.5" style={{ color: "rgba(209,213,219,0.4)" }}>Top earners — {period} ngày</p>
          </div>
          <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
            {topMembers.length === 0 ? (
              <p className="text-center py-8 text-sm" style={{ color: "rgba(209,213,219,0.3)" }}>Không có dữ liệu</p>
            ) : topMembers.slice(0, 8).map((m, i) => {
              const maxLp = topMembers[0]?.totalLp ?? 1;
              const barWidth = Math.round((m.totalLp / maxLp) * 100);
              return (
                <div key={m.memberId} className="flex items-center gap-3 px-5 py-3">
                  <span className="text-lg font-black w-6 text-center shrink-0"
                    style={{ color: i === 0 ? "#F59E0B" : i === 1 ? "#9CA3AF" : i === 2 ? "#CD7F32" : "rgba(209,213,219,0.3)" }}>
                    #{i + 1}
                  </span>
                  <div className="flex-1">
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                      <div className="h-full rounded-full" style={{ width: `${barWidth}%`, background: "linear-gradient(to right, #8B5CF6, #06B6D4)" }} />
                    </div>
                    <p className="text-xs mt-1 text-white">{m.name}</p>
                  </div>
                  <span className="text-sm font-black shrink-0" style={{ color: "#A78BFA" }}>⬡{m.totalLp}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent violations */}
        <div className="rounded-xl border overflow-hidden lg:col-span-2"
          style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          <div className="px-5 py-4" style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <h2 className="text-sm font-semibold text-white">Recent Violations</h2>
          </div>
          {violations.length === 0 ? (
            <p className="text-center py-8 text-sm" style={{ color: "rgba(209,213,219,0.3)" }}>
              Không có vi phạm nào trong {period} ngày qua ✓
            </p>
          ) : (
            <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
              {violations.map(v => (
                <div key={v.id} className="flex items-center gap-4 px-5 py-3">
                  <span className="text-red-400 shrink-0">⚠</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{v.task?.title ?? "Unknown task"}</p>
                    <p className="text-xs truncate" style={{ color: "rgba(239,68,68,0.7)" }}>{v.note}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] rounded px-2 py-0.5"
                      style={{ background: "rgba(239,68,68,0.15)", color: "#EF4444" }}>
                      {v.type.replace("_", " ")}
                    </span>
                    <p className="text-[10px] mt-0.5" style={{ color: "rgba(209,213,219,0.3)" }}>
                      {VI_DATE.format(new Date(v.createdAt))}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* LP Velocity Chart */}
        <div className="rounded-xl border overflow-hidden"
          style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          <div className="px-5 py-4" style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <h2 className="text-sm font-semibold text-white">LP Velocity</h2>
            <p className="text-[10px] mt-0.5" style={{ color: "rgba(209,213,219,0.4)" }}>LP awarded/day — {period} ngày</p>
          </div>
          <div className="px-5 py-4">
            {lpTrend.length === 0 ? (
              <p className="text-center py-8 text-sm" style={{ color: "rgba(209,213,219,0.3)" }}>Chưa có dữ liệu LP</p>
            ) : (
              <div className="flex items-end gap-1" style={{ height: "80px" }}>
                {lpTrend.map((p, i) => {
                  const max = Math.max(...lpTrend.map(t => t.total), 1);
                  const h = Math.round((p.total / max) * 80);
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                      <span className="text-[10px] font-mono" style={{ color: "#A78BFA" }}>
                        {p.total > 0 ? p.total : ""}
                      </span>
                      <div className="w-full rounded-t-sm"
                        style={{
                          height: `${Math.max(h, 2)}px`,
                          background: "linear-gradient(to top, #8B5CF6, #06B6D4)",
                          opacity: 0.8,
                        }} />
                      <span className="text-[9px]" style={{ color: "rgba(209,213,219,0.3)" }}>
                        {VI_DATE.format(new Date(p.day))}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Violation Trend Chart */}
        <div className="rounded-xl border overflow-hidden"
          style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          <div className="px-5 py-4" style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <h2 className="text-sm font-semibold text-white">Violation Trend</h2>
            <p className="text-[10px] mt-0.5" style={{ color: "rgba(209,213,219,0.4)" }}>Vi phạm SLA/ngày — {period} ngày</p>
          </div>
          <div className="px-5 py-4">
            {violationTrend.length === 0 ? (
              <p className="text-center py-8 text-sm" style={{ color: "rgba(209,213,219,0.3)" }}>Không có vi phạm nào ✓</p>
            ) : (
              <div className="flex items-end gap-1" style={{ height: "80px" }}>
                {violationTrend.map((p, i) => {
                  const max = Math.max(...violationTrend.map(t => t.total), 1);
                  const h = Math.round((p.total / max) * 80);
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                      <span className="text-[10px] font-mono" style={{ color: "#EF4444" }}>
                        {p.total > 0 ? p.total : ""}
                      </span>
                      <div className="w-full rounded-t-sm"
                        style={{
                          height: `${Math.max(h, 2)}px`,
                          background: "#EF4444",
                          opacity: 0.7,
                        }} />
                      <span className="text-[9px]" style={{ color: "rgba(209,213,219,0.3)" }}>
                        {VI_DATE.format(new Date(p.day))}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Project Health RAG Board */}
        <div className="rounded-xl border overflow-hidden lg:col-span-2"
          style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          <div className="px-5 py-4" style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <h2 className="text-sm font-semibold text-white">Project Health RAG Board</h2>
            <p className="text-[10px] mt-0.5" style={{ color: "rgba(209,213,219,0.4)" }}>🟢 Green ≥70 · 🟡 Amber 40-69 · 🔴 Red &lt;40</p>
          </div>
          <div className="px-5 py-4">
            {projectHealth.length === 0 ? (
              <p className="text-center py-8 text-sm" style={{ color: "rgba(209,213,219,0.3)" }}>Không có dự án</p>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {/* Green */}
                {(["green", "amber", "red"] as const).map(rag => {
                  const projects = projectHealth.filter(p => p.healthStatus === rag);
                  const ragColors = { green: "#10B981", amber: "#F59E0B", red: "#EF4444" };
                  const ragLabels = { green: "🟢 Green", amber: "🟡 Amber", red: "🔴 Red" };
                  return (
                    <div key={rag} className="rounded-lg border p-3"
                      style={{ borderColor: `${ragColors[rag]}30`, background: `${ragColors[rag]}06` }}>
                      <p className="text-xs font-bold mb-2" style={{ color: ragColors[rag] }}>
                        {ragLabels[rag]} — {projects.length}
                      </p>
                      {projects.length === 0 ? (
                        <p className="text-[10px]" style={{ color: "rgba(209,213,219,0.3)" }}>—</p>
                      ) : projects.map(p => (
                        <div key={p.id} className="mb-2 last:mb-0">
                          <p className="text-xs font-medium text-white truncate">{p.orderNumber}</p>
                          <p className="text-[10px] truncate" style={{ color: "rgba(209,213,219,0.4)" }}>{p.customerName}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.1)" }}>
                              <div className="h-full rounded-full" style={{ width: `${p.completionRate}%`, background: ragColors[rag] }} />
                            </div>
                            <span className="text-[10px] font-mono shrink-0" style={{ color: ragColors[rag] }}>{p.healthScore}</span>
                          </div>
                          <div className="flex gap-2 mt-1 text-[9px]" style={{ color: "rgba(209,213,219,0.3)" }}>
                            <span>✓{p.doneTasks}/{p.totalTasks}</span>
                            <span style={{ color: "#EF4444" }}>⚠{p.violatedTasks}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
