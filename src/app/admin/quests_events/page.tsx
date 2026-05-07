"use client";

/**
 * Quests & Events Admin Page — LOOP Solutions
 * Route: /admin/quests_events
 * Wire: GET/POST/PUT/DELETE /api/admin/quests + /api/admin/company-events
 */

import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import { adminApi } from "@/lib/api/client";
import { DS, GRD } from "@/lib/design-tokens";
import { useAdminTranslations } from "@/i18n/admin/useAdminTranslations";
import {
  Star, Zap, RefreshCw, Plus, Calendar, Users, CheckCircle2,
  X, AlertTriangle, Pencil, Trash2, ChevronDown, ChevronUp,
  MessageSquare, BookOpen, PenTool, GraduationCap,
  ShoppingCart, Flame, CheckSquare,
} from "lucide-react";

// ── Design token aliases ──────────────────────────────────────────────────────
const border = "rgba(255,255,255,0.08)";
const text4 = "#7A8A9E";
const text5 = "#5A6A7E";

// ── Formatters ─────────────────────────────────────────────────────────────────
const fmtDate = (d: string | Date | null | undefined) => {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("vi-VN"); }
  catch { return String(d); }
};

const fmtLP = (n: number) => {
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n ?? 0);
};

// ── Frequency map (no i18n dependency — safe for all call sites) ─────────────
const FREQ_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  daily: { label: "Hằng ngày", color: "#3B82F6", bg: "rgba(59,130,246,0.1)" },
  weekly: { label: "Hàng tuần", color: "#8B5CF6", bg: "rgba(139,92,246,0.1)" },
  monthly: { label: "Hàng tháng", color: "#F59E0B", bg: "rgba(245,158,11,0.1)" },
  one_time: { label: "Một lần", color: "#22C55E", bg: "rgba(34,197,94,0.1)" },
  event: { label: "Sự kiện", color: "#EC4899", bg: "rgba(236,72,153,0.1)" },
  seasonal: { label: "Theo mùa", color: "#EC4899", bg: "rgba(236,72,153,0.1)" },
  competition: { label: "Thi đua", color: "#F59E0B", bg: "rgba(245,158,11,0.1)" },
  celebration: { label: "Kỷ niệm", color: "#6B3DF5", bg: "rgba(107,61,245,0.1)" },
  milestone: { label: "Cột mốc", color: "#14B8A6", bg: "rgba(20,184,166,0.1)" },
  training: { label: "�ào tạo", color: "#6EB1A8", bg: "rgba(110,177,168,0.1)" },
};

const freqLabel = (freq: string) => FREQ_CONFIG[freq]?.label ?? freq;
const freqColor = (freq: string) => FREQ_CONFIG[freq]?.color ?? DS.text4;
const freqBg = (freq: string) => FREQ_CONFIG[freq]?.bg ?? "transparent";

// ── Types ──────────────────────────────────────────────────────────────────────
interface Quest {
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
}

interface CompanyEvent {
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
}

// ── Quest Form Modal ───────────────────────────────────────────────────────────
function QuestFormModal({
  initial,
  onClose,
  onSuccess,
}: {
  initial?: Quest;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { t } = useAdminTranslations();
  const isEdit = !!initial;
  const [form, setForm] = useState({
    title: initial?.title ?? "",
    description: initial?.description ?? "",
    lpReward: String(initial?.lpReward ?? ""),
    xpReward: String(initial?.xpReward ?? ""),
    frequency: initial?.frequency ?? "daily",
    category: initial?.category ?? "engagement",
    icon: initial?.icon ?? "★",
    color: initial?.color ?? "#3B82F6",
    target: String(initial?.target ?? "1"),
    isActive: initial?.isActive ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const inp = {
    width: "100%",
    background: DS.bg,
    border: `1px solid ${border}`,
    borderRadius: 8,
    padding: "8px 12px",
    color: DS.text,
    fontSize: 13,
    outline: "none",
    boxSizing: "border-box" as const,
    fontFamily: DS.body,
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return setError(t("quests_events.errTitleRequired"));
    setSaving(true); setError("");
    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      lpReward: Number(form.lpReward) || 0,
      xpReward: Number(form.xpReward) || 0,
      frequency: form.frequency,
      category: form.category,
      icon: form.icon,
      color: form.color,
      target: Number(form.target) || 1,
      isActive: form.isActive,
    };
    try {
      if (isEdit && initial) {
        await adminApi.put(`/api/admin/quests/${initial.id}`, payload);
      } else {
        await adminApi.post("/api/admin/quests", payload);
      }
      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("quests_events.errCreateFailed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)",
          backdropFilter: "blur(8px)", zIndex: 60,
          display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          onClick={e => e.stopPropagation()}
          style={{
            background: DS.bgCard, border: `1px solid ${border}`,
            borderRadius: 16, padding: 24, width: "100%", maxWidth: 500,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
            <h3 style={{ color: DS.text, fontWeight: 700, fontSize: 18 }}>
              {isEdit ? t("quests_events.formEditQuest") : t("quests_events.formQuestTitle")}
            </h3>
            <button onClick={onClose} style={{ background: "none", border: "none", color: text4, cursor: "pointer" }}>
              <X size={18} />
            </button>
          </div>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8 }}>
              <div>
                <label style={{ color: text4, fontSize: 11, fontFamily: DS.mono, display: "block", marginBottom: 4 }}>
                  {t("quests_events.formQuestTitleLabel")}
                </label>
                <input style={inp} value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Tên nhiệm vụ" />
              </div>
              <div>
                <label style={{ color: text4, fontSize: 11, fontFamily: DS.mono, display: "block", marginBottom: 4 }}>ICON</label>
                <input style={{ ...inp, width: 60, textAlign: "center" }} value={form.icon}
                  onChange={e => setForm(f => ({ ...f, icon: e.target.value.slice(0, 2) }))}
                  maxLength={2} />
              </div>
            </div>
            <div>
              <label style={{ color: text4, fontSize: 11, fontFamily: DS.mono, display: "block", marginBottom: 4 }}>
                {t("quests_events.formQuestDescription")}
              </label>
              <textarea style={{ ...inp, resize: "vertical", minHeight: 60 }}
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Mô tả nhiệm vụ..." />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              <div>
                <label style={{ color: text4, fontSize: 11, fontFamily: DS.mono, display: "block", marginBottom: 4 }}>
                  {t("quests_events.formQuestLpReward")}
                </label>
                <input style={inp} type="number" value={form.lpReward}
                  onChange={e => setForm(f => ({ ...f, lpReward: e.target.value }))} placeholder="100" />
              </div>
              <div>
                <label style={{ color: text4, fontSize: 11, fontFamily: DS.mono, display: "block", marginBottom: 4 }}>
                  {t("quests_events.formQuestXpReward")}
                </label>
                <input style={inp} type="number" value={form.xpReward}
                  onChange={e => setForm(f => ({ ...f, xpReward: e.target.value }))} placeholder="20" />
              </div>
              <div>
                <label style={{ color: text4, fontSize: 11, fontFamily: DS.mono, display: "block", marginBottom: 4 }}>
                  {t("quests_events.formQuestTarget")}
                </label>
                <input style={inp} type="number" value={form.target}
                  onChange={e => setForm(f => ({ ...f, target: e.target.value }))} placeholder="1" />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <div>
                <label style={{ color: text4, fontSize: 11, fontFamily: DS.mono, display: "block", marginBottom: 4 }}>
                  {t("quests_events.formQuestFrequency")}
                </label>
                <select style={inp} value={form.frequency}
                  onChange={e => setForm(f => ({ ...f, frequency: e.target.value }))}>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="one_time">One-time</option>
                  <option value="event">Event</option>
                </select>
              </div>
              <div>
                <label style={{ color: text4, fontSize: 11, fontFamily: DS.mono, display: "block", marginBottom: 4 }}>
                  {t("quests_events.formQuestCategory")}
                </label>
                <select style={inp} value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                  <option value="engagement">Engagement</option>
                  <option value="project">Project</option>
                  <option value="social">Social</option>
                  <option value="learning">Learning</option>
                  <option value="achievement">Achievement</option>
                </select>
              </div>
            </div>
            <div>
              <label style={{ color: text4, fontSize: 11, fontFamily: DS.mono, display: "block", marginBottom: 4 }}>
                {t("quests_events.formQuestColor")}
              </label>
              <input type="color" value={form.color}
                onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
                style={{ width: "100%", height: 38, border: `1px solid ${border}`, borderRadius: 8, background: DS.bg, cursor: "pointer" }} />
            </div>
            {/* Active toggle */}
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", color: DS.text2, fontSize: 13 }}>
              <input type="checkbox" checked={form.isActive}
                onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} />
              {t("common.active")}
            </label>
            {error && (
              <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: "8px 12px", color: "#EF4444", fontSize: 12 }}>
                <AlertTriangle size={12} style={{ display: "inline", marginRight: 6 }} />
                {error}
              </div>
            )}
            <div style={{ display: "flex", gap: 10 }}>
              <button type="button" onClick={onClose}
                style={{ flex: 1, padding: "10px", background: DS.bg, border: `1px solid ${border}`, borderRadius: 10, color: DS.text3, cursor: "pointer", fontSize: 13 }}>
                {t("common.cancel")}
              </button>
              <button type="submit" disabled={saving}
                style={{ flex: 1, padding: "10px", background: saving ? text4 : GRD.primary, border: "none", borderRadius: 10, color: "#fff", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", fontSize: 13 }}>
                {saving ? t("quests_events.formBtnCreating") : (isEdit ? t("common.save") : t("quests_events.formBtnCreateQuest"))}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ── Event Form Modal ───────────────────────────────────────────────────────────
function EventFormModal({
  initial,
  onClose,
  onSuccess,
}: {
  initial?: CompanyEvent;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { t } = useAdminTranslations();
  const isEdit = !!initial;
  const [form, setForm] = useState({
    title: initial?.title ?? "",
    description: initial?.description ?? "",
    type: initial?.type ?? "seasonal",
    icon: initial?.icon ?? "◈",
    color: initial?.color ?? "#EC4899",
    startDate: initial?.startDate ? new Date(initial.startDate).toISOString().split("T")[0] : "",
    endDate: initial?.endDate ? new Date(initial.endDate).toISOString().split("T")[0] : "",
    lpBonus: String(initial?.lpBonus ?? ""),
    isActive: initial?.isActive ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const inp = {
    width: "100%", background: DS.bg, border: `1px solid ${border}`,
    borderRadius: 8, padding: "8px 12px", color: DS.text, fontSize: 13,
    outline: "none", boxSizing: "border-box" as const, fontFamily: DS.body,
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return setError(t("quests_events.errTitleRequired"));
    setSaving(true); setError("");
    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      type: form.type,
      icon: form.icon,
      color: form.color,
      startDate: form.startDate || undefined,
      endDate: form.endDate || undefined,
      lpBonus: Number(form.lpBonus) || 0,
      isActive: form.isActive,
    };
    try {
      if (isEdit && initial) {
        await adminApi.put(`/api/admin/company-events/${initial.id}`, payload);
      } else {
        await adminApi.post("/api/admin/company-events", payload);
      }
      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("quests_events.errCreateFailed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)",
          backdropFilter: "blur(8px)", zIndex: 60,
          display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          onClick={e => e.stopPropagation()}
          style={{
            background: DS.bgCard, border: `1px solid ${border}`,
            borderRadius: 16, padding: 24, width: "100%", maxWidth: 500,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
            <h3 style={{ color: DS.text, fontWeight: 700, fontSize: 18 }}>
              {isEdit ? t("quests_events.formEditEvent") : t("quests_events.formEventTitle")}
            </h3>
            <button onClick={onClose} style={{ background: "none", border: "none", color: text4, cursor: "pointer" }}>
              <X size={18} />
            </button>
          </div>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <label style={{ color: text4, fontSize: 11, fontFamily: DS.mono, display: "block", marginBottom: 4 }}>
                {t("quests_events.formQuestTitleLabel")}
              </label>
              <input style={inp} value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Tên sự kiện" />
            </div>
            <div>
              <label style={{ color: text4, fontSize: 11, fontFamily: DS.mono, display: "block", marginBottom: 4 }}>
                {t("quests_events.formQuestDescription")}
              </label>
              <textarea style={{ ...inp, resize: "vertical", minHeight: 60 }}
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Mô tả sự kiện..." />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              <div>
                <label style={{ color: text4, fontSize: 11, fontFamily: DS.mono, display: "block", marginBottom: 4 }}>
                  {t("quests_events.formEventType")}
                </label>
                <select style={inp} value={form.type}
                  onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                  <option value="seasonal">Seasonal</option>
                  <option value="competition">Competition</option>
                  <option value="celebration">Celebration</option>
                  <option value="milestone">Milestone</option>
                  <option value="training">Training</option>
                </select>
              </div>
              <div>
                <label style={{ color: text4, fontSize: 11, fontFamily: DS.mono, display: "block", marginBottom: 4 }}>ICON</label>
                <input style={inp} value={form.icon}
                  onChange={e => setForm(f => ({ ...f, icon: e.target.value.slice(0, 2) }))}
                  maxLength={2} />
              </div>
              <div>
                <label style={{ color: text4, fontSize: 11, fontFamily: DS.mono, display: "block", marginBottom: 4 }}>
                  {t("quests_events.colLpBonus")}
                </label>
                <input style={inp} type="number" value={form.lpBonus}
                  onChange={e => setForm(f => ({ ...f, lpBonus: e.target.value }))} placeholder="100" />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <div>
                <label style={{ color: text4, fontSize: 11, fontFamily: DS.mono, display: "block", marginBottom: 4 }}>
                  {t("quests_events.formEventStartDate")}
                </label>
                <input style={inp} type="date" value={form.startDate}
                  onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} />
              </div>
              <div>
                <label style={{ color: text4, fontSize: 11, fontFamily: DS.mono, display: "block", marginBottom: 4 }}>
                  {t("quests_events.formEventEndDate")}
                </label>
                <input style={inp} type="date" value={form.endDate}
                  onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} />
              </div>
            </div>
            <div>
              <label style={{ color: text4, fontSize: 11, fontFamily: DS.mono, display: "block", marginBottom: 4 }}>
                {t("quests_events.formQuestColor")}
              </label>
              <input type="color" value={form.color}
                onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
                style={{ width: "100%", height: 38, border: `1px solid ${border}`, borderRadius: 8, background: DS.bg, cursor: "pointer" }} />
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", color: DS.text2, fontSize: 13 }}>
              <input type="checkbox" checked={form.isActive}
                onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} />
              {t("common.active")}
            </label>
            {error && (
              <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: "8px 12px", color: "#EF4444", fontSize: 12 }}>
                <AlertTriangle size={12} style={{ display: "inline", marginRight: 6 }} />
                {error}
              </div>
            )}
            <div style={{ display: "flex", gap: 10 }}>
              <button type="button" onClick={onClose}
                style={{ flex: 1, padding: "10px", background: DS.bg, border: `1px solid ${border}`, borderRadius: 10, color: DS.text3, cursor: "pointer", fontSize: 13 }}>
                {t("common.cancel")}
              </button>
              <button type="submit" disabled={saving}
                style={{ flex: 1, padding: "10px", background: saving ? text4 : GRD.primary, border: "none", borderRadius: 10, color: "#fff", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", fontSize: 13 }}>
                {saving ? t("quests_events.formBtnCreating") : (isEdit ? t("common.save") : t("quests_events.formBtnCreateEvent"))}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ── Delete Confirm Modal ──────────────────────────────────────────────────────
function DeleteConfirmModal({
  title,
  onClose,
  onConfirm,
}: {
  title: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const { t } = useAdminTranslations();
  const [deleting, setDeleting] = useState(false);

  const handleConfirm = async () => {
    setDeleting(true);
    await onConfirm();
    setDeleting(false);
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)",
          backdropFilter: "blur(8px)", zIndex: 60,
          display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          onClick={e => e.stopPropagation()}
          style={{
            background: DS.bgCard, border: "1px solid rgba(239,68,68,0.3)",
            borderRadius: 16, padding: 24, width: "100%", maxWidth: 380,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(239,68,68,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <AlertTriangle size={20} color="#EF4444" />
            </div>
            <div>
              <div style={{ color: DS.text, fontWeight: 700, fontSize: 16 }}>{t("common.delete")}</div>
              <div style={{ color: text4, fontSize: 12 }}>{t("quests_events.confirmDelete")}</div>
            </div>
          </div>
          <div style={{ background: DS.bg, border: `1px solid ${border}`, borderRadius: 8, padding: "10px 12px", marginBottom: 16 }}>
            <div style={{ color: DS.text, fontSize: 13, fontWeight: 600 }}>{title}</div>
          </div>
          <div style={{ color: text5, fontSize: 12, marginBottom: 16 }}>{t("quests_events.confirmDeleteWarn")}</div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={onClose}
              style={{ flex: 1, padding: "10px", background: DS.bg, border: `1px solid ${border}`, borderRadius: 10, color: DS.text3, cursor: "pointer", fontSize: 13 }}>
              {t("common.cancel")}
            </button>
            <button onClick={handleConfirm} disabled={deleting}
              style={{ flex: 1, padding: "10px", background: deleting ? text4 : "#EF4444", border: "none", borderRadius: 10, color: "#fff", fontWeight: 700, cursor: deleting ? "not-allowed" : "pointer", fontSize: 13 }}>
              {deleting ? "..." : t("common.delete")}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function QuestsEventsPage() {
  const { t } = useAdminTranslations();
  const [tab, setTab] = useState<"quests" | "events">("quests");
  const [showQuestModal, setShowQuestModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [editQuest, setEditQuest] = useState<Quest | null>(null);
  const [editEvent, setEditEvent] = useState<CompanyEvent | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ type: "quest" | "event"; id: string; title: string } | null>(null);

  // Filters
  const [freqFilter, setFreqFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const qc = useQueryClient();

  const { data: questsData, isLoading: questsLoading, refetch: refetchQuests } = useQuery({
    queryKey: ["admin", "quests"],
    queryFn: () => adminApi.get<{ data: Quest[] }>("/api/admin/quests", { params: { limit: 100 } }),
  });

  const { data: eventsData, isLoading: eventsLoading, refetch: refetchEvents } = useQuery({
    queryKey: ["admin", "company-events"],
    queryFn: () => adminApi.get<{ data: CompanyEvent[] }>("/api/admin/company-events", { params: { limit: 100 } }),
  });

  const allQuests: Quest[] = questsData?.data ?? [];
  const allEvents: CompanyEvent[] = eventsData?.data ?? [];

  // Filtered data
  const quests = useMemo(() => {
    return allQuests.filter(q => {
      if (freqFilter !== "all" && q.frequency !== freqFilter) return false;
      if (statusFilter === "active" && !q.isActive) return false;
      if (statusFilter === "inactive" && q.isActive) return false;
      return true;
    });
  }, [allQuests, freqFilter, statusFilter]);

  const events = useMemo(() => {
    return allEvents.filter(e => {
      if (statusFilter === "active" && !e.isActive) return false;
      if (statusFilter === "inactive" && e.isActive) return false;
      return true;
    });
  }, [allEvents, statusFilter]);

  // Stats
  const totalLpGiven = quests.reduce((s, q) => s + (q.lpReward ?? 0), 0);
  const activeQuests = allQuests.filter(q => q.isActive).length;
  const activeEvents = allEvents.filter(e => e.isActive).length;
  const now = new Date();
  const upcomingEvents = allEvents.filter(e => {
    try { return new Date(e.startDate) > now; }
    catch { return false; }
  }).length;

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === "quest") {
        await adminApi.delete(`/api/admin/quests/${deleteTarget.id}`);
        qc.invalidateQueries({ queryKey: ["admin", "quests"] });
      } else {
        await adminApi.delete(`/api/admin/company-events/${deleteTarget.id}`);
        qc.invalidateQueries({ queryKey: ["admin", "company-events"] });
      }
    } catch { /* silent */ }
  };

  const handleRefresh = () => {
    if (tab === "quests") refetchQuests();
    else refetchEvents();
  };

  // Loading spinner
  const Spinner = () => (
    <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
      <div style={{ width: 32, height: 32, border: `2px solid ${border}`, borderTop: `2px solid ${DS.purple}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
    </div>
  );

  return (
    <div style={{ padding: "var(--admin-padding, 2rem)", minHeight: "100vh", background: DS.bgCosmic }}>
      <style>{`
        :root { --admin-padding: 2rem; }
        @media (max-width: 640px) { :root { --admin-padding: 1rem; } }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
      {/* ── Header ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h2 style={{ fontFamily: DS.heading, fontSize: 20, fontWeight: 800, color: DS.text, margin: "0 0 4px" }}>
            {t("quests_events.title")}
          </h2>
          <p style={{ color: text4, fontSize: 12, fontFamily: DS.mono, margin: 0 }}>
            {tab === "quests"
              ? `${quests.length} / ${allQuests.length} ${t("quests_events.tabQuests").toLowerCase()}`
              : `${events.length} / ${allEvents.length} ${t("quests_events.tabEvents").toLowerCase()}`}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={handleRefresh}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", background: DS.bgCard, border: `1px solid ${border}`, borderRadius: 10, color: DS.text3, cursor: "pointer", fontSize: 12, fontFamily: DS.mono }}>
            <RefreshCw size={13} /> {t("quests_events.refreshBtn")}
          </button>
          <button onClick={() => tab === "quests" ? setShowQuestModal(true) : setShowEventModal(true)}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 16px", background: GRD.primary, color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: DS.mono }}>
            <Plus size={13} /> {tab === "quests" ? t("quests_events.addQuestBtn") : t("quests_events.addEventBtn")}
          </button>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          style={{ background: DS.bgCard, border: `1px solid ${border}`, borderRadius: 12, padding: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem" }}>
            <span style={{ color: text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.1em", textTransform: "uppercase" }}>{t("quests_events.tabQuests")}</span>
            <Star size={14} style={{ color: DS.purple }} />
          </div>
          <div style={{ color: DS.purple, fontSize: "1.5rem", fontWeight: 700, fontFamily: DS.heading }}>{allQuests.length}</div>
          <div style={{ color: text4, fontSize: 11, fontFamily: DS.mono }}>{activeQuests} {t("common.active")}</div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          style={{ background: DS.bgCard, border: `1px solid ${border}`, borderRadius: 12, padding: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem" }}>
            <span style={{ color: text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.1em", textTransform: "uppercase" }}>{t("quests_events.kpiLpRewards")}</span>
            <Zap size={14} style={{ color: DS.amber }} />
          </div>
          <div style={{ color: DS.amber, fontSize: "1.5rem", fontWeight: 700, fontFamily: DS.heading }}>{fmtLP(totalLpGiven)}</div>
          <div style={{ color: text4, fontSize: 11, fontFamily: DS.mono }}>{t("quests_events.kpiTotalRewards")}</div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          style={{ background: DS.bgCard, border: `1px solid ${border}`, borderRadius: 12, padding: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem" }}>
            <span style={{ color: text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.1em", textTransform: "uppercase" }}>{t("quests_events.tabEvents")}</span>
            <Calendar size={14} style={{ color: DS.blue }} />
          </div>
          <div style={{ color: DS.blue, fontSize: "1.5rem", fontWeight: 700, fontFamily: DS.heading }}>{allEvents.length}</div>
          <div style={{ color: text4, fontSize: 11, fontFamily: DS.mono }}>{activeEvents} {t("common.active")}</div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          style={{ background: DS.bgCard, border: `1px solid ${border}`, borderRadius: 12, padding: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem" }}>
            <span style={{ color: text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.1em", textTransform: "uppercase" }}>{t("quests_events.kpiUpcoming")}</span>
            <CheckCircle2 size={14} style={{ color: DS.green }} />
          </div>
          <div style={{ color: DS.green, fontSize: "1.5rem", fontWeight: 700, fontFamily: DS.heading }}>{upcomingEvents}</div>
          <div style={{ color: text4, fontSize: 11, fontFamily: DS.mono }}>{t("quests_events.tabEvents")}</div>
        </motion.div>
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: "flex", gap: 0, marginBottom: "1rem", borderBottom: `1px solid ${border}` }}>
        {([["quests", "tabQuests"], ["events", "tabEvents"]] as const).map(([tabKey, labelKey]) => (
          <button
            key={tabKey}
            onClick={() => setTab(tabKey as "quests" | "events")}
            style={{
              padding: "10px 20px",
              background: "none",
              border: "none",
              borderBottom: `2px solid ${tab === tabKey ? DS.purple : "transparent"}`,
              color: tab === tabKey ? DS.purple : text4,
              fontSize: 13,
              fontFamily: DS.mono,
              cursor: "pointer",
              marginBottom: -1,
              fontWeight: tab === tabKey ? 700 : 400,
            }}
          >
            {tab === tabKey && (
              <motion.div layoutId="tab-indicator"
                style={{ position: "absolute", bottom: -1, height: 2, background: GRD.primary, borderRadius: 2 }} />
            )}
            {tab === tabKey ? "▸ " : ""}{t(`quests_events.${labelKey}`)}
          </button>
        ))}
      </div>

      {/* ── Filters ── */}
      {tab === "quests" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: "1.5rem" }}>
          {/* Frequency */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, width: "100%" }}>
            <span style={{ color: text4, fontSize: 11, fontFamily: DS.mono, flexShrink: 0 }}>{t("quests_events.formQuestFrequency")}:</span>
            <div 
              style={{ 
                display: "flex", 
                gap: 6, 
                overflowX: "auto", 
                paddingBottom: 6, 
                whiteSpace: "nowrap", 
                flex: 1,
                WebkitOverflowScrolling: "touch"
              }} 
              className="hide-scrollbar"
            >
              {(["all", "daily", "weekly", "monthly", "one_time", "event"] as const).map(f => (
                <button key={f} onClick={() => setFreqFilter(f)}
                  style={{
                    padding: "4px 14px", borderRadius: 9999, fontSize: 11, fontFamily: DS.mono,
                    fontWeight: 600, cursor: "pointer", flexShrink: 0,
                    background: freqFilter === f ? freqColor(f) : "rgba(255,255,255,0.05)",
                    color: freqFilter === f ? "#fff" : text4,
                    border: `1px solid ${freqFilter === f ? freqColor(f) : border}`,
                    transition: "all 0.15s",
                  }}>
                  {f === "all" ? t("common.all") : freqLabel(f)}
                </button>
              ))}
            </div>
          </div>
          {/* Status */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, width: "100%" }}>
            <span style={{ color: text4, fontSize: 11, fontFamily: DS.mono, flexShrink: 0 }}>{t("common.status")}:</span>
            <div 
              style={{ 
                display: "flex", 
                gap: 6, 
                overflowX: "auto", 
                paddingBottom: 6, 
                whiteSpace: "nowrap", 
                flex: 1,
                WebkitOverflowScrolling: "touch"
              }} 
              className="hide-scrollbar"
            >
              {([["all", t("common.all")], ["active", t("common.active")], ["inactive", t("common.inactive")]] as const).map(([val, label]) => (
                <button key={val} onClick={() => setStatusFilter(val)}
                  style={{
                    padding: "4px 14px", borderRadius: 9999, fontSize: 11, fontFamily: DS.mono,
                    fontWeight: 600, cursor: "pointer", flexShrink: 0,
                    background: statusFilter === val ? DS.purple : "rgba(255,255,255,0.05)",
                    color: statusFilter === val ? "#fff" : text4,
                    border: `1px solid ${statusFilter === val ? DS.purple : border}`,
                    transition: "all 0.15s",
                  }}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      {tab === "events" && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "1.5rem" }}>
          <span style={{ color: text4, fontSize: 11, fontFamily: DS.mono, flexShrink: 0 }}>{t("common.status")}:</span>
          <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4, whiteSpace: "nowrap", flex: 1, minWidth: 0 }} className="hide-scrollbar">
            {([["all", t("common.all")], ["active", t("common.active")], ["inactive", t("common.inactive")]] as const).map(([val, label]) => (
              <button key={val} onClick={() => setStatusFilter(val)}
                style={{
                  padding: "3px 12px", borderRadius: 9999, fontSize: 11, fontFamily: DS.mono,
                  fontWeight: 600, cursor: "pointer", flexShrink: 0,
                  background: statusFilter === val ? DS.purple : "rgba(255,255,255,0.05)",
                  color: statusFilter === val ? "#fff" : text4,
                  border: `1px solid ${statusFilter === val ? DS.purple : border}`,
                  transition: "all 0.15s",
                }}>
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Quests Panel ── */}
      {tab === "quests" && (
        <div style={{ background: DS.bgCard, border: `1px solid ${border}`, borderRadius: 12, overflowX: "auto" }} className="hide-scrollbar">
          {questsLoading ? <Spinner /> : quests.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem", color: text4, fontFamily: DS.mono }}>
              {allQuests.length === 0 ? t("quests_events.emptyQuests") : t("common.noResults")}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", padding: "1rem", minWidth: 450 }}>
              {quests.map((q, i) => {
                const fc = FREQ_CONFIG[q.frequency] ?? { label: q.frequency, color: DS.text4, bg: "transparent" };
                return (
                  <motion.div
                    key={q.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    style={{
                      background: DS.bg,
                      border: `1px solid ${q.isActive ? border : "rgba(239,68,68,0.2)"}`,
                      borderRadius: 10,
                      padding: "0.875rem 1rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "1rem",
                      opacity: q.isActive ? 1 : 0.55,
                    }}
                  >
                    {/* Icon */}
                    <div style={{
                      width: 44, height: 44, borderRadius: 10, flexShrink: 0,
                      background: `${q.color ?? DS.purple}15`,
                      border: `1px solid ${q.color ?? DS.purple}30`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 20, color: q.color ?? DS.purple,
                    }}>
                      {(() => {
                        const iconProps = { size: 20, color: q.color ?? DS.purple };
                        switch (q.icon) {
                          case "CheckCircle":   return <CheckCircle2 {...iconProps} />;
                          case "Zap":           return <Zap {...iconProps} />;
                          case "Star":          return <Star {...iconProps} />;
                          case "Users":         return <Users {...iconProps} />;
                          case "Calendar":      return <Calendar {...iconProps} />;
                          case "MessageSquare": return <MessageSquare {...iconProps} />;
                          case "BookOpen":      return <BookOpen {...iconProps} />;
                          case "PenTool":       return <PenTool {...iconProps} />;
                          case "GraduationCap": return <GraduationCap {...iconProps} />;
                          case "ShoppingCart":  return <ShoppingCart {...iconProps} />;
                          case "Flame":         return <Flame {...iconProps} />;
                          case "CheckSquare":   return <CheckSquare {...iconProps} />;
                          default:              return <span>{q.icon ?? "★"}</span>;
                        }
                      })()}
                    </div>
                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: DS.text, fontWeight: 600, fontSize: 13, marginBottom: 2, display: "flex", alignItems: "center", gap: 8 }}>
                        {q.title}
                        {!q.isActive && (
                          <span style={{ background: "rgba(239,68,68,0.1)", color: "#EF4444", padding: "1px 6px", borderRadius: 4, fontSize: 10, fontWeight: 600 }}>
                            {t("common.inactive")}
                          </span>
                        )}
                      </div>
                      <div style={{ color: text4, fontSize: 11, fontFamily: DS.mono, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {q.description || "—"}
                      </div>
                    </div>
                    {/* Badges */}
                    <div 
                      style={{ 
                        display: "flex", 
                        gap: 6, 
                        flexShrink: 1, 
                        alignItems: "center", 
                        flexWrap: "nowrap", 
                        justifyContent: "flex-end", 
                        overflowX: "auto",
                        maxWidth: "45%", // Prevent it from squishing the title too much
                        WebkitOverflowScrolling: "touch"
                      }} 
                      className="hide-scrollbar"
                    >
                      <span style={{ background: freqBg(q.frequency), color: freqColor(q.frequency), padding: "2px 8px", borderRadius: 9999, fontSize: 10, fontFamily: DS.mono, fontWeight: 700 }}>
                        {freqLabel(q.frequency)}
                      </span>
                      {q.lpReward > 0 && (
                        <span style={{ background: `${DS.amber}15`, color: DS.amber, padding: "2px 8px", borderRadius: 9999, fontSize: 10, fontFamily: DS.mono, fontWeight: 700 }}>
                          +{fmtLP(q.lpReward)} LP
                        </span>
                      )}
                      {q.xpReward > 0 && (
                        <span style={{ background: `${DS.purple}15`, color: DS.purple, padding: "2px 8px", borderRadius: 9999, fontSize: 10, fontFamily: DS.mono, fontWeight: 700 }}>
                          +{q.xpReward} XP
                        </span>
                      )}
                      <span style={{ display: "flex", alignItems: "center", gap: 3, color: text4, fontSize: 11, fontFamily: DS.mono }}>
                        <Users size={11} /> {q.participantCount}
                      </span>
                    </div>
                    {/* Actions */}
                    <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                      <button
                        onClick={() => setEditQuest(q)}
                        style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(255,255,255,0.04)", border: `1px solid ${border}`, color: text4, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                        title={t("common.edit")}
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget({ type: "quest", id: q.id, title: q.title })}
                        style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", color: "#EF4444", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                        title={t("common.delete")}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Events Panel ── */}
      {tab === "events" && (
        <div style={{ background: DS.bgCard, border: `1px solid ${border}`, borderRadius: 12, overflow: "hidden" }}>
          {eventsLoading ? <Spinner /> : events.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem", color: text4, fontFamily: DS.mono }}>
              {allEvents.length === 0 ? t("quests_events.emptyEvents") : t("common.noResults")}
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${border}` }}>
                    {[
                      { key: "colEvent", label: t("quests_events.colEvent") },
                      { key: "colType", label: t("quests_events.colType") },
                      { key: "colPeriod", label: t("quests_events.colPeriod") },
                      { key: "colLpBonus", label: t("quests_events.colLpBonus") },
                      { key: "colParticipants", label: t("quests_events.colParticipants") },
                      { key: "colEventStatus", label: t("quests_events.colEventStatus") },
                      { key: "actions", label: t("common.actions") },
                    ].map(h => (
                      <th key={h.key} style={{ textAlign: "left", padding: "10px 16px", color: text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                        {h.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {events.map((ev, i) => {
                    const fc = FREQ_CONFIG[ev.type] ?? { label: ev.type, color: text4, bg: "transparent" };
                    const isUpcoming = (() => {
                      try { return new Date(ev.startDate) > now; }
                      catch { return false; }
                    })();
                    return (
                      <motion.tr key={ev.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.03 }}
                        style={{ borderBottom: `1px solid ${border}`, opacity: ev.isActive ? 1 : 0.55 }}
                      >
                        <td style={{ padding: "12px 16px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{
                              width: 36, height: 36, borderRadius: 10,
                              background: `${ev.color ?? DS.pink}15`,
                              border: `1px solid ${ev.color ?? DS.pink}30`,
                              display: "grid", placeItems: "center",
                              fontSize: 18, color: ev.color ?? DS.pink, flexShrink: 0,
                            }}>
                              {ev.icon ?? "◈"}
                            </div>
                            <div>
                              <div style={{ color: DS.text, fontSize: 13, fontWeight: 600 }}>{ev.title}</div>
                              <div style={{ color: text4, fontSize: 11, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {ev.description || "—"}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <span style={{ background: freqBg(ev.type), color: freqColor(ev.type), padding: "2px 8px", borderRadius: 9999, fontSize: 10, fontFamily: DS.mono, fontWeight: 700 }}>
                            {freqLabel(ev.type)}
                          </span>
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <div style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono }}>{fmtDate(ev.startDate)}</div>
                          <div style={{ color: text5, fontSize: 10, fontFamily: DS.mono }}>→ {fmtDate(ev.endDate)}</div>
                        </td>
                        <td style={{ padding: "12px 16px", color: DS.amber, fontSize: 12, fontFamily: DS.mono, fontWeight: 700 }}>
                          +{fmtLP(ev.lpBonus)} LP
                        </td>
                        <td style={{ padding: "12px 16px", color: DS.text3, fontSize: 12, fontFamily: DS.mono }}>
                          {ev.participantCount}
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <span style={{
                            background: ev.isActive ? "rgba(34,197,94,0.1)" : "rgba(107,114,128,0.1)",
                            color: ev.isActive ? DS.green : text5,
                            padding: "2px 10px", borderRadius: 9999,
                            fontSize: 11, fontFamily: DS.mono, fontWeight: 600,
                          }}>
                            {ev.isActive ? (isUpcoming ? t("quests_events.kpiUpcoming") : t("common.active")) : t("common.inactive")}
                          </span>
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <div style={{ display: "flex", gap: 4 }}>
                            <button onClick={() => setEditEvent(ev)}
                              style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(255,255,255,0.04)", border: `1px solid ${border}`, color: text4, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                              title={t("common.edit")}
                            >
                              <Pencil size={13} />
                            </button>
                            <button onClick={() => setDeleteTarget({ type: "event", id: ev.id, title: ev.title })}
                              style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", color: "#EF4444", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                              title={t("common.delete")}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Modals ── */}
      {showQuestModal && (
        <QuestFormModal
          onClose={() => setShowQuestModal(false)}
          onSuccess={() => qc.invalidateQueries({ queryKey: ["admin", "quests"] })}
        />
      )}
      {editQuest && (
        <QuestFormModal
          initial={editQuest}
          onClose={() => setEditQuest(null)}
          onSuccess={() => { qc.invalidateQueries({ queryKey: ["admin", "quests"] }); }}
        />
      )}
      {showEventModal && (
        <EventFormModal
          onClose={() => setShowEventModal(false)}
          onSuccess={() => qc.invalidateQueries({ queryKey: ["admin", "company-events"] })}
        />
      )}
      {editEvent && (
        <EventFormModal
          initial={editEvent}
          onClose={() => setEditEvent(null)}
          onSuccess={() => { qc.invalidateQueries({ queryKey: ["admin", "company-events"] }); }}
        />
      )}
      {deleteTarget && (
        <DeleteConfirmModal
          title={deleteTarget.title}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
