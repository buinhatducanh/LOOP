"use client";

/**
 * Analytics Admin Page — LOOP Solutions
 * Route: /admin/analytics
 * Data from: /api/admin/kpi/dashboard
 */

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "motion/react";
import { qk } from "@/lib/query/provider";
import { adminApi } from "@/lib/api/client";
import { DS } from "@/lib/design-tokens";
import {
  BarChart2, TrendingUp, AlertTriangle, CheckCircle2,
  Zap, Clock, RefreshCw,
} from "lucide-react";

const fmtB = (n: number) => {
  if (typeof n === "bigint") n = Number(n);
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(0)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
};

const fmtLP = (n: number) => {
  if (typeof n === "bigint") n = Number(n);
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
};

// ── KPI Metric ──────────────────────────────────────────────
function MetricCard({
  label, value, icon, color, sub,
}: {
  label: string; value: string; icon: React.ReactNode;
  color: string; sub?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: DS.bgCard, border: `1px solid ${DS.border}`,
        borderRadius: 12, padding: "1rem",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
        <span style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.1em", textTransform: "uppercase" }}>
          {label}
        </span>
        <span style={{ color, background: `${color}15`, borderRadius: 8, padding: "4px", display: "flex" }}>
          {icon}
        </span>
      </div>
      <div style={{ color: DS.text, fontSize: "1.75rem", fontWeight: 700, fontFamily: DS.heading }}>
        {value}
      </div>
      {sub && <div style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, marginTop: "0.25rem" }}>{sub}</div>}
    </motion.div>
  );
}

// ── Health bar ──────────────────────────────────────────────
function HealthBar({ score, label }: { score: number; label: string }) {
  const color = score >= 70 ? DS.green : score >= 40 ? DS.amber : DS.red;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ color: DS.text3, fontSize: 12 }}>{label}</span>
        <span style={{ color, fontSize: 12, fontFamily: DS.mono, fontWeight: 600 }}>{score}/100</span>
      </div>
      <div style={{ height: 6, background: DS.bg, borderRadius: 3, overflow: "hidden" }}>
        <div
          style={{ height: "100%", width: `${score}%`, background: color, borderRadius: 3, boxShadow: `0 0 6px ${color}` }}
        />
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────
export default function AnalyticsPage() {
  const [period, setPeriod] = useState("30");
  const qc = useQueryClient();

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["admin", "analytics", period],
    queryFn: () =>
      adminApi.get<{ data: { summary: Record<string,number>; topMembers: unknown[]; recentViolations: unknown[]; projectHealth: unknown[] } }>("/api/admin/kpi/dashboard", {
        params: { period },
      }),
  });

  const summary = data?.data?.summary ?? {};
  const topMembers = (data?.data?.topMembers ?? []) as { memberId: string; name: string; totalLp: number }[];
  const recentViolations = (data?.data?.recentViolations ?? []) as { id: string; type: string; description: string; createdAt: string }[];
  const projectHealth = (data?.data?.projectHealth ?? []) as { id: string; orderNumber: string; customerName: string; healthScore: number; healthStatus: string }[];
  const completionRate = summary.completionRate ?? 0;
  const violationRate = summary.violationRate ?? 0;

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h2 style={{ fontFamily: DS.heading, fontSize: 20, fontWeight: 800, color: DS.text, margin: "0 0 4px" }}>
            Phân tích & Báo cáo
          </h2>
          <p style={{ color: DS.text4, fontSize: 12, fontFamily: DS.mono, margin: 0 }}>
            Dữ liệu từ KPI dashboard · {period} ngày gần nhất
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <select
            value={period}
            onChange={e => setPeriod(e.target.value)}
            style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 10, padding: "6px 12px", color: DS.text3, fontSize: 12, fontFamily: DS.mono, cursor: "pointer" }}
          >
            <option value="7">7 ngày</option>
            <option value="30">30 ngày</option>
            <option value="90">90 ngày</option>
          </select>
          <button
            onClick={() => qc.invalidateQueries({ queryKey: ["admin", "analytics", period] })}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 10, color: DS.text3, cursor: "pointer", fontSize: 12, fontFamily: DS.mono }}
          >
            <RefreshCw size={13} className={isFetching ? "animate-spin" : ""} /> Làm mới
          </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        <MetricCard label="Tổng dự án" value={String(summary.totalProjects ?? 0)} icon={<BarChart2 size={16} />} color={DS.blue} sub={`${summary.activeProjects ?? 0} active`} />
        <MetricCard label="Tổng tasks" value={String(summary.totalTasks ?? 0)} icon={<CheckCircle2 size={16} />} color={DS.green} sub={`${completionRate}% hoàn thành`} />
        <MetricCard label="Tasks vi phạm" value={String(summary.violatedTasks ?? 0)} icon={<AlertTriangle size={16} />} color={DS.red} sub={`${violationRate}% violation rate`} />
        <MetricCard label="LP phát hành" value={fmtLP(summary.totalLpAwarded ?? 0)} icon={<Zap size={16} />} color={DS.purple} sub={`${summary.approvedCount ?? 0} awards`} />
        <MetricCard label="LP chờ duyệt" value={fmtLP(summary.totalLpPending ?? 0)} icon={<Clock size={16} />} color={DS.amber} sub={`${summary.pendingCount ?? 0} awards`} />
      </div>

      {/* Two-column */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", flexWrap: "wrap" }}>
        {/* Top members by LP */}
        <div style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 12, padding: "1.25rem" }}>
          <h3 style={{ color: DS.text2, fontSize: 14, fontWeight: 600, margin: "0 0 1rem" }}>
            Top thành viên LP · {period} ngày
          </h3>
          {isLoading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: 24 }}>
              <div style={{ width: 24, height: 24, border: `2px solid ${DS.border}`, borderTop: `2px solid ${DS.blue}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            </div>
          ) : topMembers.length === 0 ? (
            <div style={{ textAlign: "center", padding: "2rem", color: DS.text4, fontSize: 13 }}>Chưa có dữ liệu</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {topMembers.slice(0, 8).map((m, i) => (
                <div key={m.memberId} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 20, height: 20, borderRadius: "50%", background: `${DS.purple}20`, border: `1px solid ${DS.purple}40`, display: "grid", placeItems: "center", fontSize: 10, fontFamily: DS.mono, color: DS.purple, fontWeight: 700, flexShrink: 0 }}>
                    {i + 1}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: DS.text, fontSize: 12, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {m.name ?? m.memberId}
                    </div>
                    <div style={{ height: 4, background: DS.bg, borderRadius: 2, marginTop: 4, overflow: "hidden" }}>
                      <div
                        style={{
                          height: "100%",
                          width: `${Math.round((() => {
                            const top = Number(topMembers[0]?.totalLp ?? 1);
                            return top > 0 ? (m.totalLp / top) * 100 : 0;
                          })())}%`,
                          background: DS.purple,
                          borderRadius: 2,
                          boxShadow: `0 0 6px ${DS.purple}60`,
                        }}
                      />
                    </div>
                  </div>
                  <div style={{ color: DS.purple, fontSize: 12, fontFamily: DS.mono, fontWeight: 700, flexShrink: 0 }}>
                    +{fmtLP(Number(m.totalLp))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Project health */}
        <div style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 12, padding: "1.25rem" }}>
          <h3 style={{ color: DS.text2, fontSize: 14, fontWeight: 600, margin: "0 0 1rem" }}>
            Sức khỏe dự án
          </h3>
          {isLoading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: 24 }}>
              <div style={{ width: 24, height: 24, border: `2px solid ${DS.border}`, borderTop: `2px solid ${DS.blue}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            </div>
          ) : projectHealth.length === 0 ? (
            <div style={{ textAlign: "center", padding: "2rem", color: DS.text4, fontSize: 13 }}>Không có dự án active</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {projectHealth.slice(0, 6).map((p) => (
                <div key={p.id} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <div>
                      <span style={{ color: DS.text, fontSize: 12, fontWeight: 500 }}>{p.customerName ?? p.orderNumber}</span>
                    </div>
                    <span style={{ fontSize: 10, fontFamily: DS.mono, color: p.healthStatus === "green" ? DS.green : p.healthStatus === "amber" ? DS.amber : DS.red }}>
                      {p.healthScore}/100
                    </span>
                  </div>
                  <HealthBar score={p.healthScore} label="" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent violations */}
      {recentViolations.length > 0 && (
        <div style={{ marginTop: "1.5rem", background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 12, padding: "1.25rem" }}>
          <h3 style={{ color: DS.text2, fontSize: 14, fontWeight: 600, margin: "0 0 1rem" }}>
            Vi phạm gần đây
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {recentViolations.slice(0, 5).map((v, i) => (
              <div key={v.id ?? i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: `${DS.red}08`, border: `1px solid ${DS.red}20`, borderRadius: 8 }}>
                <AlertTriangle size={14} style={{ color: DS.red, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ color: DS.text3, fontSize: 12 }}>{v.description ?? v.type}</div>
                </div>
                <div style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, flexShrink: 0 }}>
                  {v.createdAt ? new Date(v.createdAt).toLocaleDateString("vi-VN") : ""}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
