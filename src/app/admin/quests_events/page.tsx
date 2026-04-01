"use client";

/**
 * Quests & Events Admin Page — LOOP Solutions
 * Route: /admin/quests_events
 * Wire: /api/admin/quests, /api/admin/company-events
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "motion/react";
import { adminApi } from "@/lib/api/client";
import { DS } from "@/lib/design-tokens";
import { Star, Zap, RefreshCw, Plus, Calendar, Users, CheckCircle2 } from "lucide-react";

const fmtDate = (d: string | Date | null | undefined) => {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("vi-VN"); }
  catch { return String(d); }
};

const fmtLP = (n: number) => {
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
};

const FREQ_COLORS: Record<string, { color: string; bg: string; label: string }> = {
  daily:     { label: "Daily", color: "#3B82F6", bg: "rgba(59,130,246,0.1)" },
  weekly:    { label: "Weekly", color: "#8B5CF6", bg: "rgba(139,92,246,0.1)" },
  monthly:   { label: "Monthly", color: "#F59E0B", bg: "rgba(245,158,11,0.1)" },
  seasonal:  { label: "Seasonal", color: "#EC4899", bg: "rgba(236,72,153,0.1)" },
  once:      { label: "One-time", color: "#22C55E", bg: "rgba(34,197,94,0.1)" },
};

type Quest = {
  id: string;
  title: string;
  description: string;
  lpReward: number;
  xpReward: number;
  frequency: string;
  category: string;
  icon: string;
  color: string;
  target: number;
  participantCount: number;
  isActive: boolean;
  sortOrder: number;
};

type Event = {
  id: string;
  title: string;
  description: string;
  type: string;
  startDate: string;
  endDate: string;
  lpBonus: number;
  color: string;
  icon: string;
  participantCount: number;
  isActive: boolean;
};

export default function QuestsEventsPage() {
  const [tab, setTab] = useState<"quests" | "events">("quests");
  const qc = useQueryClient();

  const { data: questsData, isLoading: questsLoading } = useQuery({
    queryKey: ["admin", "quests"],
    queryFn: () => adminApi.get<{ data: Quest[] }>("/api/admin/quests", { params: { limit: 50 } }),
  });

  const { data: eventsData, isLoading: eventsLoading } = useQuery({
    queryKey: ["admin", "company-events"],
    queryFn: () => adminApi.get<{ data: Event[] }>("/api/admin/company-events", { params: { limit: 50 } }),
  });

  const quests = questsData?.data ?? [];
  const events = eventsData?.data ?? [];

  const totalLpGiven = quests.reduce((s, q) => s + (q.lpReward ?? 0), 0);
  const activeQuests = quests.filter(q => q.isActive).length;
  const upcomingEvents = events.filter(e => new Date(e.startDate) > new Date()).length;
  const activeEvents = events.filter(e => e.isActive).length;

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h2 style={{ fontFamily: DS.heading, fontSize: 20, fontWeight: 800, color: DS.text, margin: "0 0 4px" }}>
            Nhiệm vụ & Sự kiện
          </h2>
          <p style={{ color: DS.text4, fontSize: 12, fontFamily: DS.mono, margin: 0 }}>
            {quests.length} quests · {events.length} sự kiện
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => tab === "quests"
              ? qc.invalidateQueries({ queryKey: ["admin", "quests"] })
              : qc.invalidateQueries({ queryKey: ["admin", "company-events"] })}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 10, color: DS.text3, cursor: "pointer", fontSize: 12, fontFamily: DS.mono }}
          >
            <RefreshCw size={13} /> Làm mới
          </button>
          <button style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 16px", background: DS.purple, color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: DS.mono }}>
            <Plus size={13} /> {tab === "quests" ? "Thêm quest" : "Thêm sự kiện"}
          </button>
        </div>
      </div>

      {/* KPI */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 12, padding: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem" }}>
            <span style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.1em", textTransform: "uppercase" }}>Quests</span>
            <Star size={14} style={{ color: DS.purple }} />
          </div>
          <div style={{ color: DS.purple, fontSize: "1.5rem", fontWeight: 700, fontFamily: DS.heading }}>{quests.length}</div>
          <div style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono }}>{activeQuests} active</div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 12, padding: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem" }}>
            <span style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.1em", textTransform: "uppercase" }}>LP Rewards</span>
            <Zap size={14} style={{ color: DS.amber }} />
          </div>
          <div style={{ color: DS.amber, fontSize: "1.5rem", fontWeight: 700, fontFamily: DS.heading }}>{fmtLP(totalLpGiven)}</div>
          <div style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono }}>tổng rewards</div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 12, padding: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem" }}>
            <span style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.1em", textTransform: "uppercase" }}>Sự kiện</span>
            <Calendar size={14} style={{ color: DS.blue }} />
          </div>
          <div style={{ color: DS.blue, fontSize: "1.5rem", fontWeight: 700, fontFamily: DS.heading }}>{events.length}</div>
          <div style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono }}>{activeEvents} active</div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 12, padding: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem" }}>
            <span style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.1em", textTransform: "uppercase" }}>Sắp tới</span>
            <CheckCircle2 size={14} style={{ color: DS.green }} />
          </div>
          <div style={{ color: DS.green, fontSize: "1.5rem", fontWeight: 700, fontFamily: DS.heading }}>{upcomingEvents}</div>
          <div style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono }}>events</div>
        </motion.div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: "1rem", borderBottom: `1px solid ${DS.border}` }}>
        {([["quests", "Nhiệm vụ"], ["events", "Sự kiện"]] as const).map(([t, label]) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: "8px 16px",
              background: "none",
              border: "none",
              borderBottom: `2px solid ${tab === t ? DS.blue : "transparent"}`,
              color: tab === t ? DS.blue : DS.text4,
              fontSize: 13,
              fontFamily: DS.mono,
              cursor: "pointer",
              marginBottom: -1,
              fontWeight: tab === t ? 600 : 400,
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Quests */}
      {tab === "quests" && (
        <div style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 12, overflow: "hidden" }}>
          {questsLoading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
              <div style={{ width: 32, height: 32, border: `2px solid ${DS.border}`, borderTop: `2px solid ${DS.blue}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            </div>
          ) : quests.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem", color: DS.text4 }}>Chưa có nhiệm vụ nào</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", padding: "1rem" }}>
              {quests.map(q => {
                const freqCfg = FREQ_COLORS[q.frequency] ?? { label: q.frequency, color: DS.text4, bg: "transparent" };
                return (
                  <motion.div
                    key={q.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    style={{
                      background: DS.bg,
                      border: `1px solid ${DS.border}`,
                      borderRadius: 10,
                      padding: "0.875rem 1rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "1rem",
                      opacity: q.isActive ? 1 : 0.5,
                    }}
                  >
                    {/* Icon */}
                    <div style={{
                      width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                      background: `${q.color ?? DS.purple}15`,
                      border: `1px solid ${q.color ?? DS.purple}30`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 18, color: q.color ?? DS.purple,
                    }}>
                      {q.icon ?? "★"}
                    </div>
                    {/* Info */}
                    <div style={{ flex: 1 }}>
                      <div style={{ color: DS.text, fontWeight: 600, fontSize: 13, marginBottom: 2 }}>{q.title}</div>
                      <div style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono }}>{q.description}</div>
                    </div>
                    {/* Meta */}
                    <div style={{ display: "flex", gap: 6, flexShrink: 0, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
                      <span style={{ background: freqCfg.bg, color: freqCfg.color, padding: "2px 8px", borderRadius: 9999, fontSize: 10, fontFamily: DS.mono, fontWeight: 700 }}>
                        {freqCfg.label}
                      </span>
                      <span style={{ background: `${DS.amber}15`, color: DS.amber, padding: "2px 8px", borderRadius: 9999, fontSize: 10, fontFamily: DS.mono, fontWeight: 700 }}>
                        +{fmtLP(q.lpReward)} LP
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: 3, color: DS.text4, fontSize: 11, fontFamily: DS.mono }}>
                        <Users size={11} /> {q.participantCount}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Events */}
      {tab === "events" && (
        <div style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 12, overflow: "hidden" }}>
          {eventsLoading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
              <div style={{ width: 32, height: 32, border: `2px solid ${DS.border}`, borderTop: `2px solid ${DS.blue}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            </div>
          ) : events.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem", color: DS.text4 }}>Chưa có sự kiện nào</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${DS.border}` }}>
                    {["Sự kiện", "Loại", "Thời gian", "LP Bonus", "Người tham gia", "Trạng thái"].map(h => (
                      <th key={h} style={{ textAlign: "left", padding: "10px 16px", color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.1em", textTransform: "uppercase" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {events.map(ev => {
                    const typeCfg = FREQ_COLORS[ev.type] ?? { label: ev.type, color: DS.text4, bg: "transparent" };
                    const isUpcoming = new Date(ev.startDate) > new Date();
                    return (
                      <tr key={ev.id} style={{ borderBottom: `1px solid ${DS.border}` }}>
                        <td style={{ padding: "12px 16px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ width: 28, height: 28, borderRadius: 8, background: `${ev.color ?? DS.blue}20`, display: "grid", placeItems: "center", fontSize: 14, color: ev.color ?? DS.blue, flexShrink: 0 }}>
                              {ev.icon ?? "◈"}
                            </div>
                            <div>
                              <div style={{ color: DS.text, fontSize: 13, fontWeight: 600 }}>{ev.title}</div>
                              <div style={{ color: DS.text4, fontSize: 11 }}>{ev.description}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <span style={{ background: typeCfg.bg, color: typeCfg.color, padding: "2px 8px", borderRadius: 9999, fontSize: 11, fontFamily: DS.mono, fontWeight: 700 }}>
                            {typeCfg.label}
                          </span>
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <div style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono }}>{fmtDate(ev.startDate)}</div>
                          <div style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono }}>→ {fmtDate(ev.endDate)}</div>
                        </td>
                        <td style={{ padding: "12px 16px", color: DS.amber, fontSize: 12, fontFamily: DS.mono, fontWeight: 700 }}>
                          +{fmtLP(ev.lpBonus)} LP
                        </td>
                        <td style={{ padding: "12px 16px", color: DS.text3, fontSize: 12, fontFamily: DS.mono }}>
                          {ev.participantCount}
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <span style={{ background: ev.isActive ? "rgba(34,197,94,0.1)" : "rgba(107,114,128,0.1)", color: ev.isActive ? DS.green : DS.text5, padding: "2px 10px", borderRadius: 9999, fontSize: 11, fontFamily: DS.mono, fontWeight: 600 }}>
                            {ev.isActive ? (isUpcoming ? "Upcoming" : "Active") : "Inactive"}
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
      )}
    </div>
  );
}
