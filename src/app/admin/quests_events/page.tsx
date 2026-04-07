"use client";

/**
 * Quests & Events Admin Page — LOOP Solutions
 * Route: /admin/quests_events
 * Wire: /api/admin/quests, /api/admin/company-events
 */

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import { adminApi } from "@/lib/api/client";
import { DS, GRD } from "@/lib/design-tokens";
import { useAdminTranslations } from "@/i18n/admin/useAdminTranslations";
import { Star, Zap, RefreshCw, Plus, Calendar, Users, CheckCircle2, X, AlertTriangle } from "lucide-react";

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
  daily:     { label: "daily", color: "#3B82F6", bg: "rgba(59,130,246,0.1)" },
  weekly:    { label: "weekly", color: "#8B5CF6", bg: "rgba(139,92,246,0.1)" },
  monthly:   { label: "monthly", color: "#F59E0B", bg: "rgba(245,158,11,0.1)" },
  seasonal:  { label: "seasonal", color: "#EC4899", bg: "rgba(236,72,153,0.1)" },
  once:      { label: "one_time", color: "#22C55E", bg: "rgba(34,197,94,0.1)" },
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

function CreateQuestModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { t } = useAdminTranslations();
  const [form, setForm] = useState({
    title: "", description: "", lpReward: "", xpReward: "",
    frequency: "daily", category: "engagement", icon: "★", color: "#3B82F6", target: "1",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const inp = { width: "100%", background: DS.bg, border: `1px solid ${DS.border}`, borderRadius: 8, padding: "8px 12px", color: DS.text, fontSize: 13, outline: "none", boxSizing: "border-box" as const, fontFamily: DS.body };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return setError(t("quests_events.errTitleRequired"));
    setSaving(true); setError("");
    try {
      await adminApi.post("/api/admin/quests", {
        title: form.title.trim(), description: form.description.trim(),
        lpReward: Number(form.lpReward) || 0, xpReward: Number(form.xpReward) || 0,
        frequency: form.frequency, category: form.category,
        icon: form.icon, color: form.color, target: Number(form.target) || 1,
        isActive: true,
      });
      onSuccess(); onClose();
    } catch (err: unknown) { setError(err instanceof Error ? err.message : t("quests_events.errCreateFailed")); }
    finally { setSaving(false); }
  };
  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)", zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
        <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
          onClick={e => e.stopPropagation()}
          style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 16, padding: 24, width: "100%", maxWidth: 460 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
            <h3 style={{ color: DS.text, fontWeight: 700, fontSize: 18 }}>{t("quests_events.formQuestTitle")}</h3>
            <button onClick={onClose} style={{ background: "none", border: "none", color: DS.text4, cursor: "pointer" }}><X size={18} /></button>
          </div>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8 }}>
              <div><label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, display: "block", marginBottom: 4 }}>{t("quests_events.formQuestTitleLabel")}</label>
                <input style={inp} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Tên nhiệm vụ" /></div>
              <div><label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, display: "block", marginBottom: 4 }}>ICON</label>
                <input style={{ ...inp, width: 60, textAlign: "center" }} value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value.slice(0, 2) }))} maxLength={2} /></div>
            </div>
            <div><label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, display: "block", marginBottom: 4 }}>{t("quests_events.formQuestDescription")}</label>
              <textarea style={{ ...inp, resize: "vertical", minHeight: 60 }} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Mô tả nhiệm vụ..." /></div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              <div><label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, display: "block", marginBottom: 4 }}>{t("quests_events.formQuestLpReward")}</label>
                <input style={inp} type="number" value={form.lpReward} onChange={e => setForm(f => ({ ...f, lpReward: e.target.value }))} placeholder="100" /></div>
              <div><label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, display: "block", marginBottom: 4 }}>{t("quests_events.formQuestXpReward")}</label>
                <input style={inp} type="number" value={form.xpReward} onChange={e => setForm(f => ({ ...f, xpReward: e.target.value }))} placeholder="20" /></div>
              <div><label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, display: "block", marginBottom: 4 }}>{t("quests_events.formQuestTarget")}</label>
                <input style={inp} type="number" value={form.target} onChange={e => setForm(f => ({ ...f, target: e.target.value }))} placeholder="1" /></div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <div><label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, display: "block", marginBottom: 4 }}>{t("quests_events.formQuestFrequency")}</label>
                <select style={inp} value={form.frequency} onChange={e => setForm(f => ({ ...f, frequency: e.target.value }))}>
                  <option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option><option value="one_time">One-time</option><option value="event">Event</option>
                </select></div>
              <div><label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, display: "block", marginBottom: 4 }}>{t("quests_events.formQuestCategory")}</label>
                <select style={inp} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                  <option value="engagement">Engagement</option><option value="project">Project</option><option value="social">Social</option><option value="learning">Learning</option><option value="achievement">Achievement</option>
                </select></div>
            </div>
            <div><label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, display: "block", marginBottom: 4 }}>{t("quests_events.formQuestColor")}</label>
              <input type="color" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} style={{ width: "100%", height: 38, border: `1px solid ${DS.border}`, borderRadius: 8, background: DS.bg, cursor: "pointer" }} /></div>
            {error && <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: "8px 12px", color: "#EF4444", fontSize: 12 }}><AlertTriangle size={12} style={{ display: "inline", marginRight: 6 }} />{error}</div>}
            <div style={{ display: "flex", gap: 10 }}>
              <button type="button" onClick={onClose} style={{ flex: 1, padding: "10px", background: DS.bg, border: `1px solid ${DS.border}`, borderRadius: 10, color: DS.text3, cursor: "pointer", fontSize: 13 }}>{t("common.cancel")}</button>
              <button type="submit" disabled={saving} style={{ flex: 1, padding: "10px", background: saving ? DS.text4 : GRD.primary, border: "none", borderRadius: 10, color: "#fff", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", fontSize: 13 }}>{saving ? t("quests_events.formBtnCreating") : t("quests_events.formBtnCreateQuest")}</button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function CreateEventModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { t } = useAdminTranslations();
  const [form, setForm] = useState({
    title: "", description: "", type: "seasonal", icon: "◈", color: "#3B82F6",
    startDate: "", endDate: "", lpBonus: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const inp = { width: "100%", background: DS.bg, border: `1px solid ${DS.border}`, borderRadius: 8, padding: "8px 12px", color: DS.text, fontSize: 13, outline: "none", boxSizing: "border-box" as const, fontFamily: DS.body };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return setError(t("quests_events.errTitleRequired"));
    setSaving(true); setError("");
    try {
      await adminApi.post("/api/admin/company-events", {
        title: form.title.trim(), description: form.description.trim(),
        type: form.type, icon: form.icon, color: form.color,
        startDate: form.startDate || undefined, endDate: form.endDate || undefined,
        lpBonus: Number(form.lpBonus) || 0, isActive: true,
      });
      onSuccess(); onClose();
    } catch (err: unknown) { setError(err instanceof Error ? err.message : t("quests_events.errCreateFailed")); }
    finally { setSaving(false); }
  };
  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)", zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
        <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
          onClick={e => e.stopPropagation()}
          style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 16, padding: 24, width: "100%", maxWidth: 460 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
            <h3 style={{ color: DS.text, fontWeight: 700, fontSize: 18 }}>{t("quests_events.formEventTitle")}</h3>
            <button onClick={onClose} style={{ background: "none", border: "none", color: DS.text4, cursor: "pointer" }}><X size={18} /></button>
          </div>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div><label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, display: "block", marginBottom: 4 }}>{t("quests_events.formQuestTitleLabel")}</label>
              <input style={inp} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Tên sự kiện" /></div>
            <div><label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, display: "block", marginBottom: 4 }}>{t("quests_events.formQuestDescription")}</label>
              <textarea style={{ ...inp, resize: "vertical", minHeight: 60 }} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Mô tả sự kiện..." /></div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              <div><label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, display: "block", marginBottom: 4 }}>{t("quests_events.formEventType")}</label>
                <select style={inp} value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                  <option value="seasonal">Seasonal</option><option value="competition">Competition</option><option value="celebration">Celebration</option><option value="milestone">Milestone</option><option value="training">Training</option>
                </select></div>
              <div><label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, display: "block", marginBottom: 4 }}>ICON</label>
                <input style={inp} value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value.slice(0, 2) }))} maxLength={2} /></div>
              <div><label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, display: "block", marginBottom: 4 }}>{t("quests_events.colLpBonus")}</label>
                <input style={inp} type="number" value={form.lpBonus} onChange={e => setForm(f => ({ ...f, lpBonus: e.target.value }))} placeholder="100" /></div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <div><label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, display: "block", marginBottom: 4 }}>{t("quests_events.formEventStartDate")}</label>
                <input style={inp} type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} /></div>
              <div><label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, display: "block", marginBottom: 4 }}>{t("quests_events.formEventEndDate")}</label>
                <input style={inp} type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} /></div>
            </div>
            <div><label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, display: "block", marginBottom: 4 }}>{t("quests_events.formQuestColor")}</label>
              <input type="color" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} style={{ width: "100%", height: 38, border: `1px solid ${DS.border}`, borderRadius: 8, background: DS.bg, cursor: "pointer" }} /></div>
            {error && <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: "8px 12px", color: "#EF4444", fontSize: 12 }}><AlertTriangle size={12} style={{ display: "inline", marginRight: 6 }} />{error}</div>}
            <div style={{ display: "flex", gap: 10 }}>
              <button type="button" onClick={onClose} style={{ flex: 1, padding: "10px", background: DS.bg, border: `1px solid ${DS.border}`, borderRadius: 10, color: DS.text3, cursor: "pointer", fontSize: 13 }}>{t("common.cancel")}</button>
              <button type="submit" disabled={saving} style={{ flex: 1, padding: "10px", background: saving ? DS.text4 : GRD.primary, border: "none", borderRadius: 10, color: "#fff", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", fontSize: 13 }}>{saving ? t("quests_events.formBtnCreating") : t("quests_events.formBtnCreateEvent")}</button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default function QuestsEventsPage() {
  const { t } = useAdminTranslations();
  const [tab, setTab] = useState<"quests" | "events">("quests");
  const [showQuestModal, setShowQuestModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
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
            {t("quests_events.title")}
          </h2>
          <p style={{ color: DS.text4, fontSize: 12, fontFamily: DS.mono, margin: 0 }}>
            {t("quests_events.titleCount", { n: quests.length })}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => tab === "quests"
              ? qc.invalidateQueries({ queryKey: ["admin", "quests"] })
              : qc.invalidateQueries({ queryKey: ["admin", "company-events"] })}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 10, color: DS.text3, cursor: "pointer", fontSize: 12, fontFamily: DS.mono }}
          >
            <RefreshCw size={13} /> {t("quests_events.refreshBtn")}
          </button>
          <button
            onClick={() => tab === "quests" ? setShowQuestModal(true) : setShowEventModal(true)}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 16px", background: DS.purple, color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: DS.mono }}
          >
            <Plus size={13} /> {tab === "quests" ? t("quests_events.addQuestBtn") : t("quests_events.addEventBtn")}
          </button>
        </div>
      </div>

      {/* KPI */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 12, padding: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem" }}>
            <span style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.1em", textTransform: "uppercase" }}>{t("quests_events.tabQuests")}</span>
            <Star size={14} style={{ color: DS.purple }} />
          </div>
          <div style={{ color: DS.purple, fontSize: "1.5rem", fontWeight: 700, fontFamily: DS.heading }}>{quests.length}</div>
          <div style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono }}>{activeQuests} {t("common.active")}</div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 12, padding: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem" }}>
            <span style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.1em", textTransform: "uppercase" }}>{t("quests_events.kpiLpRewards")}</span>
            <Zap size={14} style={{ color: DS.amber }} />
          </div>
          <div style={{ color: DS.amber, fontSize: "1.5rem", fontWeight: 700, fontFamily: DS.heading }}>{fmtLP(totalLpGiven)}</div>
          <div style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono }}>{t("quests_events.kpiTotalRewards")}</div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 12, padding: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem" }}>
            <span style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.1em", textTransform: "uppercase" }}>{t("quests_events.kpiEvents")}</span>
            <Calendar size={14} style={{ color: DS.blue }} />
          </div>
          <div style={{ color: DS.blue, fontSize: "1.5rem", fontWeight: 700, fontFamily: DS.heading }}>{events.length}</div>
          <div style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono }}>{activeEvents} {t("common.active")}</div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 12, padding: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem" }}>
            <span style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.1em", textTransform: "uppercase" }}>{t("quests_events.kpiUpcoming")}</span>
            <CheckCircle2 size={14} style={{ color: DS.green }} />
          </div>
          <div style={{ color: DS.green, fontSize: "1.5rem", fontWeight: 700, fontFamily: DS.heading }}>{upcomingEvents}</div>
          <div style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono }}>{t("quests_events.kpiEvents")}</div>
        </motion.div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: "1rem", borderBottom: `1px solid ${DS.border}` }}>
        {([["quests", "quests"], ["events", "events"]] as const).map(([tabKey, labelKey]) => (
          <button
            key={tabKey}
            onClick={() => setTab(tabKey as "quests" | "events")}
            style={{
              padding: "8px 16px",
              background: "none",
              border: "none",
              borderBottom: `2px solid ${tab === tabKey ? DS.blue : "transparent"}`,
              color: tab === tabKey ? DS.blue : DS.text4,
              fontSize: 13,
              fontFamily: DS.mono,
              cursor: "pointer",
              marginBottom: -1,
              fontWeight: tab === tabKey ? 600 : 400,
            }}
          >
            {t(`quests_events.tab${labelKey.charAt(0).toUpperCase() + labelKey.slice(1) as "Quests" | "Events"}`)}
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
            <div style={{ textAlign: "center", padding: "3rem", color: DS.text4 }}>{t("quests_events.emptyQuests")}</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", padding: "1rem" }}>
              {quests.map(q => {
                const freqCfg = FREQ_COLORS[q.frequency] ?? { label: q.frequency, color: DS.text4, bg: "transparent" };
                const freqLabel = t(`quests_events.formQuest${freqCfg.label.charAt(0).toUpperCase() + freqCfg.label.slice(1)}` as `quests_events.formQuest${string}`);
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
                        {freqLabel}
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
            <div style={{ textAlign: "center", padding: "3rem", color: DS.text4 }}>{t("quests_events.emptyEvents")}</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${DS.border}` }}>
                    {[t("quests_events.colEvent"), t("quests_events.colType"), t("quests_events.colPeriod"), t("quests_events.colLpBonus"), t("quests_events.colParticipants"), t("quests_events.colEventStatus")].map(h => (
                      <th key={h} style={{ textAlign: "left", padding: "10px 16px", color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.1em", textTransform: "uppercase" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {events.map(ev => {
                    const typeCfg = FREQ_COLORS[ev.type] ?? { label: ev.type, color: DS.text4, bg: "transparent" };
                    const isUpcoming = new Date(ev.startDate) > new Date();
                    const typeLabel = t(`quests_events.formQuest${typeCfg.label.charAt(0).toUpperCase() + typeCfg.label.slice(1)}` as `quests_events.formQuest${string}`);
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
                            {typeLabel}
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
                            {ev.isActive ? (isUpcoming ? t("quests_events.kpiUpcoming") : t("common.active")) : t("common.inactive")}
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

      {/* Create modals */}
      {showQuestModal && (
        <CreateQuestModal
          onClose={() => setShowQuestModal(false)}
          onSuccess={() => { qc.invalidateQueries({ queryKey: ["admin", "quests"] }); }}
        />
      )}
      {showEventModal && (
        <CreateEventModal
          onClose={() => setShowEventModal(false)}
          onSuccess={() => { qc.invalidateQueries({ queryKey: ["admin", "company-events"] }); }}
        />
      )}
    </div>
  );
}
