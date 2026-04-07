"use client";

/**
 * LP Manage Admin Page — LOOP Solutions
 * Route: /admin/lp_manage
 * Wire: /api/admin/lp-awards, /api/admin/lp-transactions
 *
 * Full rewrite to match DESIGN LOOPS LPManagementTab (650 lines):
 * - RateConfigModal: LP→VND rate + salary by rank + bonus rates
 * - AddLPModal: 6 sources (project/performance/service/salary/tet_bonus/manual)
 * - 6-source breakdown cards
 * - Transactions table + Member summary view
 * - Per-member source breakdown
 */

import { useState, useMemo, useEffect } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import { adminApi } from "@/lib/api/client";
import { DS, GRD } from "@/lib/design-tokens";
import {
  Wallet, Plus, Save, X, BarChart3, Users,
  FolderKanban, Trophy, Briefcase, DollarSign, Gift, Star,
  Settings, RefreshCw, Send,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type LPSource = "project" | "performance" | "service" | "salary" | "tet_bonus" | "manual";

interface LPTransaction {
  id: string;
  memberId: number;
  memberName: string;
  memberRank: string;
  source: LPSource;
  amount: number;
  vndEquivalent: number;
  note: string;
  period: string;
  createdAt: string;
  createdBy: string;
}

interface LPRateConfig {
  lp_to_vnd: number;
  salary_iron: number;
  salary_bronze: number;
  salary_silver: number;
  salary_gold: number;
  salary_platinum: number;
  salary_ruby: number;
  salary_diamond: number;
  perf_bonus_pct: number;
  tet_bonus_months: number;
  service_per_unit: number;
  project_small: number;
  project_medium: number;
  project_large: number;
}

type RankKey = "iron" | "bronze" | "silver" | "gold" | "platinum" | "ruby" | "diamond";

const RANKS: Record<RankKey, { label: string; symbol: string; color: string }> = {
  iron:     { label: "Iron",     symbol: "⬡", color: "#9CA3AF" },
  bronze:   { label: "Bronze",   symbol: "◈", color: "#CD7F32" },
  silver:   { label: "Silver",   symbol: "◇", color: "#CBD5E1" },
  gold:     { label: "Gold",     symbol: "★", color: "#FFD700" },
  platinum: { label: "Platinum", symbol: "❋", color: "#14B8A6" },
  ruby:     { label: "Ruby",     symbol: "♦", color: "#EF4444" },
  diamond:  { label: "Diamond",  symbol: "✦", color: "#818CF8" },
};

const MOCK_MEMBERS = [
  { id: 1, name: "Akira Tanaka", role: "CEO", rank: "diamond" as RankKey, img: "https://i.pravatar.cc/150?img=1", level: 120 },
  { id: 2, name: "Yuki Sato", role: "Marketing Lead", rank: "ruby" as RankKey, img: "https://i.pravatar.cc/150?img=2", level: 96 },
  { id: 3, name: "Min-jun Lee", role: "IT Lead", rank: "platinum" as RankKey, img: "https://i.pravatar.cc/150?img=3", level: 88 },
  { id: 4, name: "Wei Chen", role: "Senior Engineer", rank: "gold" as RankKey, img: "https://i.pravatar.cc/150?img=4", level: 68 },
  { id: 5, name: "Sora Kimura", role: "Frontend Dev", rank: "silver" as RankKey, img: "https://i.pravatar.cc/150?img=5", level: 48 },
  { id: 6, name: "Ryo Nakamura", role: "Backend Dev", rank: "silver" as RankKey, img: "https://i.pravatar.cc/150?img=6", level: 42 },
  { id: 7, name: "Hana Park", role: "Media Lead", rank: "bronze" as RankKey, img: "https://i.pravatar.cc/150?img=7", level: 28 },
  { id: 8, name: "Alex Nguyen", role: "Marketing Specialist", rank: "bronze" as RankKey, img: "https://i.pravatar.cc/150?img=8", level: 22 },
  { id: 9, name: "Linh Hoang", role: "Junior Dev", rank: "iron" as RankKey, img: "https://i.pravatar.cc/150?img=9", level: 8 },
  { id: 10, name: "Minh Tran", role: "QA Engineer", rank: "iron" as RankKey, img: "https://i.pravatar.cc/150?img=10", level: 5 },
];

// ── Source config ─────────────────────────────────────────────────────────────

const SOURCE_CFG: Record<LPSource, { label: string; labelVi: string; color: string; icon: typeof FolderKanban; desc: string }> = {
  project:     { label: "Project",     labelVi: "Dự án",               color: DS.blue,   icon: FolderKanban, desc: "LP từ dự án hoàn thành (small/medium/large)" },
  performance: { label: "Performance", labelVi: "Thưởng hiệu suất",    color: DS.amber,  icon: Trophy,       desc: "Thưởng KPI hàng tháng/quý theo phòng ban" },
  service:     { label: "Service",     labelVi: "Dịch vụ",             color: DS.cyan,   icon: Briefcase,    desc: "LP khi hoàn thành gói dịch vụ cho khách hàng" },
  salary:      { label: "Salary",      labelVi: "Lương cứng",          color: DS.green,  icon: DollarSign,   desc: "Lương tháng/quý cố định theo rank" },
  tet_bonus:   { label: "Tết Bonus",   labelVi: "Thưởng Tết",          color: DS.red,    icon: Gift,         desc: "Thưởng Tết hàng năm (tháng lương × hệ số)" },
  manual:      { label: "Manual",      labelVi: "Thủ công",            color: DS.purple, icon: Star,         desc: "Admin cấp/trừ LP thủ công với lý do rõ ràng" },
};

const INIT_RATE: LPRateConfig = {
  lp_to_vnd: 1_000,
  salary_iron:     500,
  salary_bronze:   1_200,
  salary_silver:   2_500,
  salary_gold:     5_000,
  salary_platinum: 10_000,
  salary_ruby:     22_000,
  salary_diamond:  50_000,
  perf_bonus_pct:  20,
  tet_bonus_months: 1.5,
  service_per_unit: 300,
  project_small:   500,
  project_medium:  1_500,
  project_large:   4_000,
};

const SALARY_BY_RANK: Record<RankKey, keyof LPRateConfig> = {
  iron:     "salary_iron",
  bronze:   "salary_bronze",
  silver:   "salary_silver",
  gold:     "salary_gold",
  platinum: "salary_platinum",
  ruby:     "salary_ruby",
  diamond:  "salary_diamond",
};

const CURRENT_YEAR = 2026;

// ── Init transactions ─────────────────────────────────────────────────────────

function genId() { return `tx-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`; }

const INIT_TRANSACTIONS: LPTransaction[] = [
  { id: genId(), memberId: 1, memberName: "Akira Tanaka", memberRank: "diamond", source: "salary",      amount: 50_000, vndEquivalent: 50_000_000, note: "Lương tháng 3/2026 — Diamond", period: "T3/2026", createdAt: "2026-03-01", createdBy: "Admin" },
  { id: genId(), memberId: 2, memberName: "Yuki Sato", memberRank: "ruby",     source: "salary",      amount: 22_000, vndEquivalent: 22_000_000, note: "Lương tháng 3/2026 — Ruby",    period: "T3/2026", createdAt: "2026-03-01", createdBy: "Admin" },
  { id: genId(), memberId: 3, memberName: "Min-jun Lee", memberRank: "platinum", source: "salary",   amount: 10_000, vndEquivalent: 10_000_000, note: "Lương tháng 3/2026 — Platinum", period: "T3/2026", createdAt: "2026-03-01", createdBy: "Admin" },
  { id: genId(), memberId: 4, memberName: "Wei Chen", memberRank: "gold",     source: "salary",      amount: 5_000,  vndEquivalent: 5_000_000,  note: "Lương tháng 3/2026 — Gold",    period: "T3/2026", createdAt: "2026-03-01", createdBy: "Admin" },
  { id: genId(), memberId: 5, memberName: "Sora Kimura", memberRank: "silver",  source: "salary",      amount: 2_500,  vndEquivalent: 2_500_000,  note: "Lương tháng 3/2026 — Silver",  period: "T3/2026", createdAt: "2026-03-01", createdBy: "Admin" },
  { id: genId(), memberId: 2, memberName: "Yuki Sato", memberRank: "ruby",     source: "project",     amount: 4_000,  vndEquivalent: 4_000_000,  note: "Dự án: LOOP OS v2.0 — Large milestone", period: "T3/2026", createdAt: "2026-03-13", createdBy: "Admin" },
  { id: genId(), memberId: 4, memberName: "Wei Chen", memberRank: "gold",     source: "project",     amount: 1_500,  vndEquivalent: 1_500_000,  note: "Dự án: VNRetail v3 — Sprint 4 done", period: "T3/2026", createdAt: "2026-03-14", createdBy: "Admin" },
  { id: genId(), memberId: 1, memberName: "Akira Tanaka", memberRank: "diamond", source: "performance", amount: 10_000, vndEquivalent: 10_000_000, note: "Thưởng KPI Q1/2026 — Đạt 140% target", period: "Q1/2026", createdAt: "2026-03-31", createdBy: "Admin" },
  { id: genId(), memberId: 3, memberName: "Min-jun Lee", memberRank: "platinum", source: "performance", amount: 2_000,  vndEquivalent: 2_000_000,  note: "Thưởng KPI T3/2026 — IT uptime 99.98%", period: "T3/2026", createdAt: "2026-03-31", createdBy: "Admin" },
  { id: genId(), memberId: 5, memberName: "Sora Kimura", memberRank: "silver",  source: "service",     amount: 900,   vndEquivalent: 900_000,    note: "Design system delivery — 3 gói × 300 LP", period: "T3/2026", createdAt: "2026-03-20", createdBy: "Admin" },
  { id: genId(), memberId: 6, memberName: "Ryo Nakamura", memberRank: "silver",  source: "service",     amount: 600,   vndEquivalent: 600_000,    note: "UI/UX audit cho client MedTech — 2 gói", period: "T3/2026", createdAt: "2026-03-18", createdBy: "Admin" },
  { id: genId(), memberId: 7, memberName: "Hana Park", memberRank: "bronze",     source: "tet_bonus",   amount: 750,   vndEquivalent: 750_000,    note: "Thưởng Tết Bính Ngọ 2026 — 1.5 tháng lương Bronze", period: "Tết 2026", createdAt: "2026-01-25", createdBy: "Admin" },
];

// ── Formatters ────────────────────────────────────────────────────────────────

const fmtLP = (n: number) => n >= 1_000_000 ? `${(n / 1_000_000).toFixed(2)}M LP` : n >= 1_000 ? `${(n / 1_000).toFixed(1)}K LP` : `${n} LP`;
const fmtVND = (n: number) => n >= 1_000_000_000 ? `${(n / 1_000_000_000).toFixed(2)}B` : n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1_000 ? `${(n / 1_000).toFixed(0)}K` : String(n);

// ── Rate Config Modal ─────────────────────────────────────────────────────────

function RateConfigModal({ rate, onClose, onSave, isSaving }: {
  rate: LPRateConfig;
  onClose: () => void;
  onSave: (r: LPRateConfig) => void;
  isSaving: boolean;
}) {
  const [draft, setDraft] = useState<LPRateConfig>({ ...rate });
  const inputStyle: React.CSSProperties = {
    width: "100%", background: DS.bgCard2, border: `1px solid ${DS.border}`,
    borderRadius: 8, padding: "8px 12px", color: DS.text, fontSize: 13, outline: "none",
    fontFamily: DS.mono, boxSizing: "border-box",
  };
  const labelStyle: React.CSSProperties = {
    color: DS.text4, fontSize: 10, fontFamily: DS.mono, display: "block" as const,
    marginBottom: 5, letterSpacing: "0.1em",
  };

  const set = (k: keyof LPRateConfig, v: number) => setDraft(d => ({ ...d, [k]: v }));

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(2,6,23,0.88)", backdropFilter: "blur(10px)", zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
    >
      <motion.div
        initial={{ scale: 0.95 }} animate={{ scale: 1 }}
        onClick={e => e.stopPropagation()}
        style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 16, width: "100%", maxWidth: 640, maxHeight: "90vh", overflow: "hidden", display: "flex", flexDirection: "column" }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1.25rem 1.5rem", borderBottom: `1px solid ${DS.border}`, position: "sticky", top: 0, background: DS.bgCard, zIndex: 10 }}>
          <div>
            <div style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.15em" }}>── CẤU HÌNH HỆ THỐNG LP</div>
            <div style={{ color: DS.text, fontSize: 15, fontWeight: 700, marginTop: 2 }}>Tỷ lệ LP & Định mức lương</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: DS.text4, cursor: "pointer" }}><X size={18} /></button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "1.25rem 1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {/* Exchange rate */}
          <div style={{ padding: "1rem", borderRadius: 16, background: `${DS.green}06`, border: `1px solid ${DS.green}20` }}>
            <label style={{ ...labelStyle, color: DS.green }}>TỶ GIÁ: 1 LP = ? VND</label>
            <input type="number" value={draft.lp_to_vnd} onChange={e => set("lp_to_vnd", Number(e.target.value))}
              style={{ ...inputStyle, color: DS.green }} />
            <div style={{ color: DS.text5, fontSize: 11, marginTop: 6 }}>
              💡 Ví dụ: 1,000 LP = {(1000 * draft.lp_to_vnd).toLocaleString("vi-VN")} VND
            </div>
          </div>

          {/* Salary by rank */}
          <div>
            <div style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.15em", marginBottom: 12 }}>── LƯƠNG CỨ (LP/THÁNG) THEO RANK</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {(["iron", "bronze", "silver", "gold", "platinum", "ruby", "diamond"] as RankKey[]).map(rk => {
                const rc = RANKS[rk];
                const key = SALARY_BY_RANK[rk];
                const vnd = (draft[key] as number) * draft.lp_to_vnd;
                return (
                  <div key={rk} style={{ padding: "10px 12px", borderRadius: 12, background: DS.bgCard2, border: `1px solid ${rc.color}20` }}>
                    <label style={{ ...labelStyle, color: rc.color }}>{rc.symbol} {rc.label} (LP/tháng)</label>
                    <input type="number" value={draft[key] as number} onChange={e => set(key, Number(e.target.value))}
                      style={{ ...inputStyle, color: rc.color }} />
                    <div style={{ color: DS.text5, fontSize: 10, marginTop: 4, fontFamily: DS.mono }}>≈ {fmtVND(vnd)} VND</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bonus rates */}
          <div>
            <div style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.15em", marginBottom: 12 }}>── ĐỊNH MỨC THƯỞNG</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {[
                { key: "perf_bonus_pct" as const, label: "Thưởng hiệu suất (% lương)", color: DS.amber, unit: "%" },
                { key: "tet_bonus_months" as const, label: "Thưởng Tết (tháng lương)", color: DS.red, unit: "tháng" },
                { key: "service_per_unit" as const, label: "LP mỗi gói dịch vụ", color: DS.cyan, unit: "LP" },
                { key: "project_small" as const,  label: "Dự án nhỏ (<10M VND)", color: DS.blue, unit: "LP" },
                { key: "project_medium" as const, label: "Dự án vừa (10-50M VND)", color: DS.purple, unit: "LP" },
                { key: "project_large" as const,  label: "Dự án lớn (>50M VND)", color: DS.green, unit: "LP" },
              ].map(f => (
                <div key={f.key} style={{ padding: "10px 12px", borderRadius: 12, background: DS.bgCard2, border: `1px solid ${DS.border}` }}>
                  <label style={{ ...labelStyle, color: f.color }}>{f.label}</label>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <input type="number" value={draft[f.key] as number} onChange={e => set(f.key, Number(e.target.value))}
                      style={{ ...inputStyle, color: f.color, flex: 1 }} />
                    <span style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, flexShrink: 0 }}>{f.unit}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, padding: "1.25rem 1.5rem", borderTop: `1px solid ${DS.border}`, flexShrink: 0 }}>
          <button onClick={onClose}
            style={{ flex: 1, background: "none", border: `1px solid ${DS.border}`, borderRadius: 10, padding: "10px", color: DS.text3, cursor: "pointer", fontSize: 13 }}>
            Hủy
          </button>
          <button onClick={() => { onSave(draft); onClose(); }}
            style={{ flex: 2, background: GRD.primary, color: "#fff", border: "none", borderRadius: 10, padding: "10px", cursor: "pointer", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            {isSaving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />} {isSaving ? "Đang lưu..." : "Lưu cấu hình"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Add LP Modal ─────────────────────────────────────────────────────────────

function AddLPModal({ rate, onClose, onSave }: {
  rate: LPRateConfig;
  onClose: () => void;
  onSave: (tx: LPTransaction) => void;
}) {
  const [source, setSource] = useState<LPSource>("salary");
  const [memberId, setMemberId] = useState<number>(MOCK_MEMBERS[0].id);
  const [amount, setAmount] = useState<number>(0);
  const [note, setNote] = useState("");
  const [period, setPeriod] = useState(`T${new Date().getMonth() + 1}/${CURRENT_YEAR}`);
  const [projectSize, setProjectSize] = useState<"small" | "medium" | "large">("medium");

  const sc = SOURCE_CFG[source];
  const selectedMember = MOCK_MEMBERS.find(m => m.id === memberId)!;
  const rc = RANKS[selectedMember?.rank ?? "iron"];

  const calcAmount = () => {
    if (!selectedMember) return 0;
    const salaryKey = SALARY_BY_RANK[selectedMember.rank];
    const baseSalary = rate[salaryKey] as number;
    switch (source) {
      case "salary":      return baseSalary;
      case "performance": return Math.round(baseSalary * rate.perf_bonus_pct / 100);
      case "service":     return rate.service_per_unit;
      case "project":     return rate[`project_${projectSize}`] as number;
      case "tet_bonus":   return Math.round(baseSalary * rate.tet_bonus_months);
      default: return 0;
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", background: DS.bgCard2, border: `1px solid ${DS.border}`,
    borderRadius: 8, padding: "9px 12px", color: DS.text, fontSize: 13, outline: "none",
    fontFamily: DS.body, boxSizing: "border-box",
  };
  const labelStyle: React.CSSProperties = {
    color: DS.text4, fontSize: 10, fontFamily: DS.mono, display: "block" as const,
    marginBottom: 6, letterSpacing: "0.1em",
  };

  const handleSave = () => {
    const finalAmount = amount || calcAmount();
    onSave({
      id: genId(),
      memberId,
      memberName: selectedMember.name,
      memberRank: selectedMember.rank,
      source,
      amount: finalAmount,
      vndEquivalent: finalAmount * rate.lp_to_vnd,
      note: note || `${sc.labelVi} — ${period}`,
      period,
      createdAt: new Date().toISOString().split("T")[0],
      createdBy: "Admin",
    });
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(2,6,23,0.88)", backdropFilter: "blur(10px)", zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
    >
      <motion.div
        initial={{ scale: 0.95 }} animate={{ scale: 1 }}
        onClick={e => e.stopPropagation()}
        style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 16, width: "100%", maxWidth: 520, maxHeight: "90vh", overflow: "hidden", display: "flex", flexDirection: "column" }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1.25rem 1.5rem", borderBottom: `1px solid ${DS.border}`, flexShrink: 0 }}>
          <div>
            <div style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.15em" }}>── CẤP LP MỚI</div>
            <div style={{ color: DS.text, fontSize: 15, fontWeight: 700, marginTop: 2 }}>Thêm giao dịch LP</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: DS.text4, cursor: "pointer" }}><X size={18} /></button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "1.25rem 1.5rem", display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Source selector */}
          <div>
            <label style={labelStyle}>NGUỒN LP</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
              {(Object.keys(SOURCE_CFG) as LPSource[]).map(s => {
                const cfg = SOURCE_CFG[s];
                return (
                  <button key={s} onClick={() => setSource(s)}
                    style={{
                      display: "flex", alignItems: "center", gap: 6, padding: "8px 10px", borderRadius: 12,
                      background: source === s ? `${cfg.color}15` : DS.bgCard2,
                      border: `1px solid ${source === s ? cfg.color + "50" : DS.border}`,
                      color: source === s ? cfg.color : DS.text4,
                      cursor: "pointer", fontSize: 11,
                    }}>
                    <cfg.icon size={12} />
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cfg.labelVi}</span>
                  </button>
                );
              })}
            </div>
            <div style={{ color: DS.text5, fontSize: 10, marginTop: 6 }}>{sc.desc}</div>
          </div>

          {/* Member selector */}
          <div>
            <label style={labelStyle}>THÀNH VIÊN</label>
            <select value={memberId} onChange={e => setMemberId(Number(e.target.value))} style={inputStyle}>
              {MOCK_MEMBERS.map(m => {
                const mr = RANKS[m.rank];
                return <option key={m.id} value={m.id}>{mr.symbol} {m.name} — {m.role} (Lv.{m.level})</option>;
              })}
            </select>
          </div>

          {/* Project size */}
          {source === "project" && (
            <div>
              <label style={labelStyle}>QUY MÔ DỰ ÁN</label>
              <div style={{ display: "flex", gap: 8 }}>
                {(["small", "medium", "large"] as const).map(sz => (
                  <button key={sz} onClick={() => setProjectSize(sz)}
                    style={{
                      flex: 1, padding: "8px", borderRadius: 12, cursor: "pointer", fontSize: 11,
                      background: projectSize === sz ? `${DS.blue}15` : DS.bgCard2,
                      border: `1px solid ${projectSize === sz ? DS.blue + "40" : DS.border}`,
                      color: projectSize === sz ? DS.blue : DS.text4,
                    }}>
                    {sz === "small" ? "Nhỏ" : sz === "medium" ? "Vừa" : "Lớn"}
                    <span style={{ display: "block", fontSize: 9, color: DS.text5, marginTop: 2 }}>
                      {sz === "small" ? `${rate.project_small} LP` : sz === "medium" ? `${rate.project_medium} LP` : `${rate.project_large} LP`}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Amount */}
          <div>
            <label style={labelStyle}>SỐ LP (để trống = tự tính)</label>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input type="number" value={amount || ""} onChange={e => setAmount(Number(e.target.value))}
                placeholder={`${calcAmount()} LP (tự tính)`}
                style={{ ...inputStyle, flex: 1, color: DS.green, fontFamily: DS.mono }} />
              <button onClick={() => setAmount(calcAmount())}
                style={{ display: "flex", alignItems: "center", gap: 4, padding: "8px 12px", borderRadius: 12, background: `${DS.blue}12`, border: `1px solid ${DS.blue}25`, color: DS.blue, cursor: "pointer", fontSize: 11 }}>
                <RefreshCw size={11} /> Auto
              </button>
            </div>
            {(amount > 0 || calcAmount() > 0) && (
              <div style={{ color: DS.text5, fontSize: 11, marginTop: 4, fontFamily: DS.mono }}>
                ≈ {fmtVND((amount || calcAmount()) * rate.lp_to_vnd)} VND
              </div>
            )}
          </div>

          {/* Period + Note */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={labelStyle}>KỲ LƯƠNG / KỲ THƯỞNG</label>
              <input value={period} onChange={e => setPeriod(e.target.value)}
                placeholder="VD: T3/2026, Q1/2026" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>GHI CHÚ</label>
              <input value={note} onChange={e => setNote(e.target.value)}
                placeholder={`${sc.labelVi} — ${period}`} style={inputStyle} />
            </div>
          </div>

          {/* Preview */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 12, background: `${sc.color}08`, border: `1px solid ${sc.color}20` }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", overflow: "hidden", border: `2px solid ${rc.color}50`, flexShrink: 0 }}>
              <img src={selectedMember?.img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: DS.text2, fontSize: 12, fontWeight: 700 }}>{selectedMember?.name}</div>
              <div style={{ color: DS.text5, fontSize: 10 }}>{sc.labelVi} · {period}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ color: sc.color, fontFamily: DS.mono, fontWeight: 700, fontSize: 14 }}>+{fmtLP(amount || calcAmount())}</div>
              <div style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono }}>{fmtVND((amount || calcAmount()) * rate.lp_to_vnd)} VND</div>
            </div>
          </div>

          <button onClick={handleSave}
            style={{ width: "100%", background: GRD.primary, color: "#fff", border: "none", borderRadius: 12, padding: "12px", cursor: "pointer", fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, boxShadow: "0 0 20px rgba(129,140,248,0.25)" }}>
            <Send size={14} /> Cấp LP ngay
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function LpManagePage() {
  const [transactions, setTransactions] = useState<LPTransaction[]>(INIT_TRANSACTIONS);
  const [rate, setRate] = useState<LPRateConfig>(INIT_RATE);
  const [showConfig, setShowConfig] = useState(false);
  const [showAddLP, setShowAddLP] = useState(false);
  const [filterSource, setFilterSource] = useState<LPSource | "all">("all");
  const [filterMember, setFilterMember] = useState<number | "all">("all");
  const [filterPeriod, setFilterPeriod] = useState<string>("all");
  const [activeView, setActiveView] = useState<"transactions" | "summary">("transactions");
  const [isSavingRate, setIsSavingRate] = useState(false);

  const qc = useQueryClient();

  // Load persisted rate config from SiteSetting
  const { data: rateData } = useQuery({
    queryKey: ["admin", "settings", "lp-rate"],
    queryFn: () => adminApi.get<{ data: LPRateConfig }>("/api/admin/settings/lp-rate"),
  });

  // Sync rate from API when data loads
  useEffect(() => {
    if (rateData?.data) {
      setRate(rateData.data);
    }
  }, [rateData]);

  // Save rate config mutation
  const saveRateMutation = useMutation({
    mutationFn: (config: LPRateConfig) =>
      adminApi.post("/api/admin/settings/lp-rate", config),
    onSuccess: (_res) => {
      qc.invalidateQueries({ queryKey: ["admin", "settings", "lp-rate"] });
    },
    onError: () => {
      alert("Lỗi lưu cấu hình LP rate. Vui lòng thử lại.");
    },
  });

  const qc2 = qc;

  // Persist rate config → API
  const handleSaveRate = async (draft: LPRateConfig) => {
    setIsSavingRate(true);
    try {
      await saveRateMutation.mutateAsync(draft);
      setRate(draft); // update local state
    } finally {
      setIsSavingRate(false);
    }
  };

  const { data: txData, isLoading: txLoading, isFetching: txFetching } = useQuery({
    queryKey: ["admin", "lp", "transactions-manage"],
    queryFn: () => adminApi.get<{ data: LPTransaction[] }>("/api/admin/lp-transactions", { params: { limit: 100 } }),
  });

  // Use API data when available, fallback to local
  const allTx = (txData?.data?.length ?? 0) > 0 ? (txData?.data ?? []) : transactions;

  const periods = useMemo(() => {
    const set = new Set(allTx.map((t: LPTransaction) => t.period));
    return ["all", ...Array.from(set)];
  }, [allTx]);

  const filtered = allTx.filter((t: LPTransaction) =>
    (filterSource === "all" || t.source === filterSource) &&
    (filterMember === "all" || t.memberId === filterMember) &&
    (filterPeriod === "all" || t.period === filterPeriod)
  ).sort((a: LPTransaction, b: LPTransaction) => b.createdAt.localeCompare(a.createdAt));

  const totalLP = allTx.reduce((s: number, t: LPTransaction) => s + t.amount, 0);
  const totalVND = allTx.reduce((s: number, t: LPTransaction) => s + t.vndEquivalent, 0);
  const bySource = (Object.keys(SOURCE_CFG) as LPSource[]).map(s => ({
    source: s,
    total: allTx.filter((t: LPTransaction) => t.source === s).reduce((sum: number, t: LPTransaction) => sum + t.amount, 0),
    count: allTx.filter((t: LPTransaction) => t.source === s).length,
  })).sort((a, b) => b.total - a.total);

  // Per-member summary
  const memberSummary = MOCK_MEMBERS.slice(0, 10).map(m => {
    const txs = allTx.filter((t: LPTransaction) => t.memberId === m.id);
    const totalEarned = txs.reduce((s: number, t: LPTransaction) => s + t.amount, 0);
    const bySourceMap = (Object.keys(SOURCE_CFG) as LPSource[]).reduce((acc, s) => {
      acc[s] = txs.filter((t: LPTransaction) => t.source === s).reduce((sum: number, t: LPTransaction) => sum + t.amount, 0);
      return acc;
    }, {} as Record<LPSource, number>);
    return { member: m, totalEarned, bySourceMap, txCount: txs.length };
  }).filter(x => x.totalEarned > 0).sort((a, b) => b.totalEarned - a.totalEarned);

  const addTx = (tx: LPTransaction) => {
    setTransactions(prev => [tx, ...prev]);
    qc.setQueryData(["admin", "lp", "transactions-manage"], (old: unknown) => {
      if (old && typeof old === "object" && "data" in old && Array.isArray((old as { data: LPTransaction[] }).data)) {
        return { ...old, data: [tx, ...(old as { data: LPTransaction[] }).data] };
      }
      return old;
    });
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h2 style={{ fontFamily: DS.heading, fontSize: 20, fontWeight: 800, color: DS.text, margin: "0 0 4px" }}>
            Quản lý LP
          </h2>
          <p style={{ color: DS.text4, fontSize: 12, fontFamily: DS.mono, margin: 0 }}>
            Phát hành LP · Cấu hình tỷ lệ · Theo dõi nguồn
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => qc.invalidateQueries({ queryKey: ["admin", "lp", "transactions-manage"] })}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 10, color: DS.text3, cursor: "pointer", fontSize: 12, fontFamily: DS.mono }}
          >
            <RefreshCw size={13} className={txFetching ? "animate-spin" : ""} /> Làm mới
          </button>
          <button onClick={() => setShowConfig(true)}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 10, color: DS.text3, cursor: "pointer", fontSize: 12, fontFamily: DS.mono }}>
            <Settings size={13} /> Cấu hình tỷ lệ
          </button>
          <button onClick={() => setShowAddLP(true)}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 16px", background: GRD.primary, color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: DS.mono, boxShadow: "0 0 16px rgba(129,140,248,0.3)" }}>
            <Plus size={13} /> Cấp LP
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        {[
          { label: "Tổng LP đã cấp", value: fmtLP(totalLP), sub: `${allTx.length} giao dịch`, color: DS.purple, icon: <Wallet size={18} /> },
          { label: "Tổng VND quy đổi", value: fmtVND(totalVND), sub: `1 LP = ${rate.lp_to_vnd.toLocaleString()} VND`, color: DS.green, icon: <DollarSign size={18} /> },
          { label: "Thành viên nhận LP", value: new Set(allTx.map((t: LPTransaction) => t.memberId)).size, sub: "trong hệ thống", color: DS.blue, icon: <Users size={18} /> },
          { label: "Tỷ lệ đổi hiện tại", value: `1:${rate.lp_to_vnd}`, sub: "LP → VND", color: DS.amber, icon: <TrendingUp size={18} /> },
        ].map(s => (
          <div key={s.label} style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 16, padding: "1rem" }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: `${s.color}15`, border: `1px solid ${s.color}25`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
              <span style={{ color: s.color }}>{s.icon}</span>
            </div>
            <div style={{ color: s.color, fontFamily: DS.heading, fontSize: 20, fontWeight: 700 }}>{s.value}</div>
            <div style={{ color: DS.text3, fontSize: 12, marginTop: 2 }}>{s.label}</div>
            <div style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono, marginTop: 1 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* View + source breakdown */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: "1rem" }}>
        <div style={{ display: "flex", gap: 8 }}>
          {([
            { id: "transactions" as const, label: "Lịch sử", icon: <BarChart3 size={13} /> },
            { id: "summary" as const, label: "Tổng hợp thành viên", icon: <Users size={13} /> },
          ]).map(v => (
            <button key={v.id} onClick={() => setActiveView(v.id)}
              style={{
                display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 12,
                background: activeView === v.id ? "rgba(59,130,246,0.12)" : "rgba(255,255,255,0.03)",
                border: `1px solid ${activeView === v.id ? DS.blue + "40" : DS.border}`,
                color: activeView === v.id ? DS.blue : DS.text3,
                fontSize: 12, cursor: "pointer",
              }}>
              {v.icon} {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* Source breakdown cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "0.75rem", marginBottom: "1.5rem" }}>
        {bySource.map(s => {
          const cfg = SOURCE_CFG[s.source];
          const pct = totalLP > 0 ? (s.total / totalLP) * 100 : 0;
          return (
            <motion.div
              key={s.source}
              onClick={() => setFilterSource(filterSource === s.source ? "all" : s.source)}
              style={{
                background: DS.bgCard, border: `1px solid ${filterSource === s.source ? cfg.color + "50" : DS.border}`,
                borderRadius: 16, padding: "1rem", cursor: "pointer",
              }}
              whileHover={{ y: -2 }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: `${cfg.color}12`, border: `1px solid ${cfg.color}25`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <cfg.icon size={14} style={{ color: cfg.color }} />
                  </div>
                  <span style={{ color: cfg.color, fontSize: 12, fontWeight: 700 }}>{cfg.labelVi}</span>
                </div>
                <span style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono }}>{s.count} tx</span>
              </div>
              <div style={{ color: DS.text, fontFamily: DS.heading, fontSize: 16, fontWeight: 700 }}>{fmtLP(s.total)}</div>
              <div style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono, marginTop: 2 }}>{fmtVND(s.total * rate.lp_to_vnd)} VND · {pct.toFixed(1)}%</div>
              <div style={{ height: 3, background: DS.border, borderRadius: 99, overflow: "hidden", marginTop: 8 }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  style={{ height: "100%", background: cfg.color, borderRadius: 99 }}
                />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Main content */}
      <AnimatePresence mode="wait">
        {activeView === "transactions" && (
          <motion.div
            key="tx"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
          >
            {/* Filters */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <select value={filterSource} onChange={e => setFilterSource(e.target.value as LPSource | "all")}
                style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 10, padding: "8px 12px", color: DS.text3, fontSize: 12, outline: "none" }}>
                <option value="all">Tất cả nguồn</option>
                {(Object.keys(SOURCE_CFG) as LPSource[]).map(s => <option key={s} value={s}>{SOURCE_CFG[s].labelVi}</option>)}
              </select>
              <select value={String(filterMember)} onChange={e => setFilterMember(e.target.value === "all" ? "all" : Number(e.target.value))}
                style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 10, padding: "8px 12px", color: DS.text3, fontSize: 12, outline: "none" }}>
                <option value="all">Tất cả thành viên</option>
                {MOCK_MEMBERS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
              <select value={filterPeriod} onChange={e => setFilterPeriod(e.target.value)}
                style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 10, padding: "8px 12px", color: DS.text3, fontSize: 12, outline: "none" }}>
                {periods.map(p => <option key={p} value={p}>{p === "all" ? "Tất cả kỳ" : p}</option>)}
              </select>
              <span style={{ color: DS.text5, fontSize: 12, fontFamily: DS.mono, marginLeft: "auto" }}>{filtered.length} giao dịch</span>
            </div>

            {/* Table */}
            <div style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 16, overflow: "hidden" }}>
              {txLoading ? (
                <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
                  <div style={{ width: 32, height: 32, border: `2px solid ${DS.border}`, borderTop: `2px solid ${DS.blue}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                </div>
              ) : filtered.length === 0 ? (
                <div style={{ textAlign: "center", padding: "3rem", color: DS.text4 }}>Chưa có giao dịch LP</div>
              ) : (
                <div>
                  {/* Header row */}
                  <div style={{ display: "grid", gridTemplateColumns: "180px 1fr 120px 80px auto", gap: 0, padding: "10px 16px", borderBottom: `1px solid ${DS.border}` }}>
                    {["Thành viên", "Ghi chú", "Nguồn", "Kỳ", "LP / VND"].map(h => (
                      <div key={h} style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono, letterSpacing: "0.1em" }}>{h}</div>
                    ))}
                  </div>

                  {/* Rows */}
                  {filtered.map((tx: LPTransaction, i: number) => {
                    const m = MOCK_MEMBERS.find(x => x.id === tx.memberId);
                    const rc = RANKS[m?.rank ?? "iron"];
                    const sc = SOURCE_CFG[tx.source];
                    const SIcon = sc.icon;
                    return (
                      <div
                        key={tx.id}
                        style={{
                          display: "grid", gridTemplateColumns: "180px 1fr 120px 80px auto",
                          gap: 0, padding: "10px 16px", alignItems: "center",
                          borderBottom: i < filtered.length - 1 ? `1px solid ${DS.border}` : "none",
                        }}
                      >
                        {/* Member */}
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ width: 28, height: 28, borderRadius: "50%", overflow: "hidden", border: `1.5px solid ${rc.color}50` }}>
                            <img src={m?.img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          </div>
                          <div>
                            <div style={{ color: DS.text2, fontSize: 11, fontWeight: 600 }}>{m?.name ?? "N/A"}</div>
                            <div style={{ color: rc.color, fontSize: 9, fontFamily: DS.mono }}>{rc.symbol} {rc.label}</div>
                          </div>
                        </div>
                        {/* Note */}
                        <div style={{ color: DS.text3, fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tx.note}</div>
                        {/* Source */}
                        <div style={{ display: "flex", alignItems: "center", gap: 4, color: sc.color, background: `${sc.color}10`, border: `1px solid ${sc.color}25`, borderRadius: 6, padding: "2px 8px", fontSize: 9, fontFamily: DS.mono, whiteSpace: "nowrap" }}>
                          <SIcon size={9} /> {sc.labelVi}
                        </div>
                        {/* Period */}
                        <div style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono, whiteSpace: "nowrap" }}>{tx.period}</div>
                        {/* Amount */}
                        <div style={{ textAlign: "right" }}>
                          <div style={{ color: tx.amount > 0 ? DS.green : DS.red, fontSize: 12, fontFamily: DS.mono, fontWeight: 700 }}>
                            +{fmtLP(tx.amount)}
                          </div>
                          <div style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono }}>{fmtVND(tx.vndEquivalent)}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeView === "summary" && (
          <motion.div
            key="sum"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 16, overflow: "hidden" }}>
              <div style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.15em", padding: "14px 18px", borderBottom: `1px solid ${DS.border}` }}>
                ── TỔNG HỢP LP THEO THÀNH VIÊN
              </div>
              <div style={{ overflowY: "auto", maxHeight: 600 }}>
                {memberSummary.length === 0 && (
                  <div style={{ textAlign: "center", padding: "3rem", color: DS.text4 }}>Chưa có dữ liệu</div>
                )}
                {memberSummary.map((ms, i) => {
                  const rc = RANKS[ms.member.rank];
                  return (
                    <div key={ms.member.id} style={{ padding: "1rem", borderBottom: i < memberSummary.length - 1 ? `1px solid ${DS.border}` : "none" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                        <div style={{ width: 36, height: 36, borderRadius: "50%", overflow: "hidden", border: `2px solid ${rc.color}50` }}>
                          <img src={ms.member.img} alt={ms.member.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ color: DS.text, fontSize: 13, fontWeight: 700 }}>{ms.member.name}</div>
                          <div style={{ color: DS.text5, fontSize: 10 }}>{ms.member.rank} · {rc.symbol} {rc.label}</div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ color: DS.green, fontFamily: DS.mono, fontWeight: 700, fontSize: 14 }}>{fmtLP(ms.totalEarned)}</div>
                          <div style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono }}>{fmtVND(ms.totalEarned * rate.lp_to_vnd)} VND · {ms.txCount} tx</div>
                        </div>
                      </div>
                      {/* Source breakdown */}
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {(Object.keys(SOURCE_CFG) as LPSource[]).filter(s => ms.bySourceMap[s] > 0).map(s => {
                          const cfg = SOURCE_CFG[s];
                          const pct = (ms.bySourceMap[s] / ms.totalEarned) * 100;
                          const SIcon = cfg.icon;
                          return (
                            <div key={s} style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 8px", borderRadius: 10, background: `${cfg.color}08`, border: `1px solid ${cfg.color}20` }}>
                              <SIcon size={10} style={{ color: cfg.color }} />
                              <span style={{ color: cfg.color, fontSize: 10, fontFamily: DS.mono }}>{fmtLP(ms.bySourceMap[s])}</span>
                              <span style={{ color: DS.text5, fontSize: 9 }}>({pct.toFixed(0)}%)</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <AnimatePresence>
        {showConfig && <RateConfigModal rate={rate} onClose={() => setShowConfig(false)} onSave={handleSaveRate} isSaving={isSavingRate} />}
        {showAddLP && <AddLPModal rate={rate} onClose={() => setShowAddLP(false)} onSave={addTx} />}
      </AnimatePresence>
    </div>
  );
}

// ── Helper for display ──────────────────────────────────────────────────────

import { TrendingUp } from "lucide-react";
