"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import { qk } from "@/lib/query/provider";
import { adminApi } from "@/lib/api/client";
import { DS, GRD } from "@/lib/design-tokens";
import {
  X, Trophy, Crown, Zap, Star, ChevronDown,
  RefreshCw, Plus, ChevronUp, TrendingUp, Award,
  Medal, Shield,
} from "lucide-react";

// ─── Rank config (mirrors lib/rank/ranks.ts) ──────────────────────────────────

const RANKS = {
  iron:     { label: "Iron",     tier: 1, color: "#9CA3AF", bg: "rgba(156,163,175,0.1)",  symbol: "⬡", minLvl: 1,  maxLvl: 14 },
  bronze:   { label: "Bronze",   tier: 2, color: "#CD7F32", bg: "rgba(205,127,50,0.12)",  symbol: "◈", minLvl: 15, maxLvl: 34 },
  silver:   { label: "Silver",   tier: 3, color: "#CBD5E1", bg: "rgba(203,213,225,0.1)",  symbol: "◇", minLvl: 35, maxLvl: 54 },
  gold:     { label: "Gold",     tier: 4, color: "#FFD700", bg: "rgba(255,215,0,0.12)",   symbol: "★", minLvl: 55, maxLvl: 74 },
  platinum: { label: "Platinum", tier: 5, color: "#818CF8", bg: "rgba(129,140,248,0.12)", symbol: "✦", minLvl: 75, maxLvl: 94 },
  ruby:     { label: "Ruby",     tier: 6, color: "#F43F5E", bg: "rgba(244,63,94,0.12)",   symbol: "◆", minLvl: 95, maxLvl: 114 },
  diamond:  { label: "Diamond",  tier: 7, color: "#60A5FA", bg: "rgba(96,165,250,0.12)",  symbol: "❖", minLvl: 115, maxLvl: 999 },
} as const;

type RankKey = keyof typeof RANKS;

const RANK_ORDER = ["diamond", "ruby", "platinum", "gold", "silver", "bronze", "iron"];

// ─── Types ────────────────────────────────────────────────────────────────────

type LeaderboardEntry = {
  id: string;
  name: string;
  role: string;
  image: string | null;
  slug: string;
  level: number;
  currentXp: number;
  maxXp: number;
  rank: string;
  rankKey: string;
  tier: number;
  color: string;
  symbol: string;
  totalLp: number;
};

type AwardForm = {
  memberId: string;
  projectId: string;
  lpAmount: string;
  source: string;
  note: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtLp(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function getRank(key: string): (typeof RANKS)[RankKey] {
  return RANKS[key as RankKey] ?? RANKS.iron;
}

// ─── Podium component ─────────────────────────────────────────────────────────

function Podium({
  entries,
  onAward,
}: {
  entries: LeaderboardEntry[];
  onAward: (entry: LeaderboardEntry) => void;
}) {
  const top3 = entries.slice(0, 3);

  if (top3.length === 0) return null;

  // 2nd, 1st, 3rd order for visual layout
  const ordered = top3.length >= 3
    ? [top3[1], top3[0], top3[2]]
    : top3;

  const podiumHeights = ["80px", "110px", "60px"];
  const podiumColors = ["#C0C0C0", "#FFD700", "#CD7F32"];
  const medals = ["🥈", "🥇", "🥉"];

  return (
    <div style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "flex-end",
      gap: "0 16px",
      marginBottom: 32,
      padding: "24px 0 0",
    }}>
      {ordered.map((member, idx) => {
        const rank = ordered.indexOf(member) + 1;
        const cfg = getRank(member.rank);
        const h = podiumHeights[rank - 1];
        const col = podiumColors[rank - 1];
        const medal = medals[rank - 1];

        return (
          <motion.div
            key={member.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: (rank - 1) * 0.1 }}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, maxWidth: 160 }}
          >
            {/* Avatar + rank badge */}
            <div style={{ textAlign: "center", marginBottom: 8 }}>
              <div style={{
                width: rank === 2 ? 72 : 60,
                height: rank === 2 ? 72 : 60,
                borderRadius: "50%",
                overflow: "hidden",
                background: "#111827",
                border: `3px solid ${col}`,
                boxShadow: `0 0 20px ${col}50`,
                margin: "0 auto 6px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: rank === 2 ? 24 : 20,
              }}>
                {member.image ? (
                  <img src={member.image} alt={member.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <span style={{ color: DS.text2, fontWeight: 800 }}>{member.name.charAt(0)}</span>
                )}
              </div>
              {/* Medal + name */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 3, marginBottom: 2 }}>
                <span style={{ fontSize: 14 }}>{medal}</span>
                <span style={{ color: DS.text, fontWeight: 700, fontSize: 13 }}>{member.name}</span>
              </div>
              <div style={{ color: cfg.color, fontSize: 10, fontFamily: DS.mono, fontWeight: 600 }}>
                {cfg.symbol} {cfg.label} · LV{member.level}
              </div>
              <div style={{ color: DS.amber, fontSize: 11, fontFamily: DS.mono, fontWeight: 700, marginTop: 2 }}>
                {fmtLp(member.totalLp)} LP
              </div>
              {/* Award button */}
              <button
                onClick={() => onAward(member)}
                title="Award LP"
                style={{
                  marginTop: 6,
                  padding: "3px 10px",
                  borderRadius: 99,
                  background: "rgba(251,191,36,0.1)",
                  border: "1px solid rgba(251,191,36,0.3)",
                  color: "#FBBF24",
                  cursor: "pointer",
                  fontSize: 11,
                  fontWeight: 600,
                  fontFamily: DS.mono,
                  display: "flex",
                  alignItems: "center",
                  gap: 3,
                }}
              >
                <Award size={10} /> Thưởng LP
              </button>
            </div>

            {/* Podium pillar */}
            <div style={{
              width: "100%",
              height: h,
              background: `linear-gradient(180deg, ${col}40 0%, ${col}15 100%)`,
              borderTop: `3px solid ${col}`,
              borderRadius: "8px 8px 0 0",
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "center",
              paddingTop: 8,
            }}>
              <span style={{ fontSize: 22, fontWeight: 900, color: col }}>#{rank}</span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// ─── Leaderboard row ──────────────────────────────────────────────────────────

function LeaderboardRow({
  entry,
  rank,
  onAward,
}: {
  entry: LeaderboardEntry;
  rank: number;
  onAward: (e: LeaderboardEntry) => void;
}) {
  const cfg = getRank(entry.rank);
  const xpPct = Math.min((entry.currentXp / entry.maxXp) * 100, 100);

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: Math.min(rank * 0.02, 0.5) }}
      style={{
        background: DS.bgCard,
        border: `1px solid ${DS.border}`,
        borderRadius: 12,
        padding: "12px 16px",
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}
    >
      {/* Rank badge */}
      <div style={{
        width: 32,
        height: 32,
        borderRadius: "50%",
        background: rank <= 3 ? `${cfg.color}20` : DS.bg,
        border: `2px solid ${rank <= 3 ? cfg.color : DS.border}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: rank <= 3 ? 14 : 11,
        fontFamily: DS.mono,
        fontWeight: 800,
        color: rank <= 3 ? cfg.color : DS.text4,
        flexShrink: 0,
      }}>
        {rank <= 3 ? cfg.symbol : rank}
      </div>

      {/* Avatar */}
      <div style={{
        width: 40, height: 40, borderRadius: "50%",
        overflow: "hidden", background: "#111827",
        border: `2px solid ${cfg.color}30`, flexShrink: 0,
      }}>
        {entry.image ? (
          <img src={entry.image} alt={entry.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "grid", placeItems: "center", color: DS.text5, fontSize: 14, fontWeight: 800 }}>
            {entry.name.charAt(0)}
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
          <span style={{ color: DS.text, fontWeight: 600, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {entry.name}
          </span>
          <span style={{
            padding: "1px 7px", borderRadius: 99,
            background: cfg.bg, border: `1px solid ${cfg.color}40`,
            color: cfg.color, fontSize: 10, fontFamily: DS.mono, fontWeight: 700,
          }}>
            {cfg.symbol} {cfg.label}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: DS.blue, fontSize: 11, fontFamily: DS.mono }}>{entry.role}</span>
          <span style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono }}>
            LV{entry.level}
          </span>
        </div>
        {/* XP bar */}
        <div style={{ marginTop: 5, display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ flex: 1, height: 4, background: DS.bg, borderRadius: 99, overflow: "hidden" }}>
            <div style={{
              width: `${xpPct}%`,
              height: "100%",
              background: `linear-gradient(90deg, ${cfg.color}80, ${cfg.color})`,
              borderRadius: 99,
              transition: "width 0.5s ease",
            }} />
          </div>
          <span style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, flexShrink: 0 }}>
            {entry.currentXp.toLocaleString()} / {entry.maxXp.toLocaleString()} XP
          </span>
        </div>
      </div>

      {/* LP */}
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div style={{ color: DS.amber, fontWeight: 800, fontSize: 16, fontFamily: DS.mono }}>
          {fmtLp(entry.totalLp)}
        </div>
        <div style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono }}>LP</div>
      </div>

      {/* Award button */}
      <button
        onClick={() => onAward(entry)}
        title="Award LP"
        style={{
          width: 34, height: 34, borderRadius: 9,
          background: "rgba(251,191,36,0.08)",
          border: "1px solid rgba(251,191,36,0.25)",
          color: "#FBBF24",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Award size={14} />
      </button>
    </motion.div>
  );
}

// ─── Award LP Modal ───────────────────────────────────────────────────────────

function AwardModal({
  entry,
  onClose,
}: {
  entry: LeaderboardEntry;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [form, setForm] = useState<AwardForm>({
    memberId: entry.id,
    projectId: "",
    lpAmount: "",
    source: "manual",
    note: "",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const cfg = getRank(entry.rank);

  const award = useMutation({
    mutationFn: async () => {
      const lp = parseInt(form.lpAmount);
      if (!lp || lp <= 0) throw new Error("LP amount must be a positive number");
      return adminApi.post("/api/admin/lp-awards", {
        memberId: form.memberId,
        projectId: form.projectId || undefined,
        lpAmount: lp,
        source: form.source || "manual",
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "rank", "leaderboard"] });
      qc.invalidateQueries({ queryKey: ["admin", "lp-awards"] });
      onClose();
    },
    onError: (err: unknown) => {
      setError(err instanceof Error ? err.message : "Award failed");
      setSaving(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.lpAmount || parseInt(form.lpAmount) <= 0) {
      setError("LP amount is required");
      return;
    }
    setSaving(true);
    award.mutate();
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
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            background: DS.bgCard, border: `1px solid ${DS.border}`,
            borderRadius: 16, padding: 24, width: "100%", maxWidth: 440,
          }}
        >
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 40, height: 40, borderRadius: "50%",
                background: `${cfg.color}20`, border: `2px solid ${cfg.color}60`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Award size={18} style={{ color: cfg.color }} />
              </div>
              <div>
                <h3 style={{ color: DS.text, fontWeight: 700, fontSize: 16, marginBottom: 1 }}>
                  Thưởng LP cho {entry.name}
                </h3>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ color: cfg.color, fontSize: 11, fontFamily: DS.mono, fontWeight: 700 }}>
                    {cfg.symbol} {cfg.label}
                  </span>
                  <span style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono }}>·</span>
                  <span style={{ color: DS.amber, fontSize: 11, fontFamily: DS.mono, fontWeight: 700 }}>
                    {fmtLp(entry.totalLp)} LP hiện tại
                  </span>
                </div>
              </div>
            </div>
            <button onClick={onClose} style={{ background: "none", border: "none", color: DS.text4, cursor: "pointer" }}>
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {/* LP Amount */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", color: DS.text4, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.08em", marginBottom: 6 }}>
                SỐ LP THƯỞNG *
              </label>
              <input
                type="number"
                min="1"
                placeholder="VD: 1000"
                value={form.lpAmount}
                onChange={(e) => setForm((f) => ({ ...f, lpAmount: e.target.value }))}
                style={{
                  width: "100%", background: DS.bg, border: `1px solid ${DS.border}`,
                  borderRadius: 10, padding: "10px 14px", color: DS.text, fontSize: 15,
                  outline: "none", fontFamily: DS.mono, fontWeight: 700, boxSizing: "border-box",
                }}
              />
            </div>

            {/* Source */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", color: DS.text4, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.08em", marginBottom: 6 }}>
                NGUỒN THƯỞNG
              </label>
              <select
                value={form.source}
                onChange={(e) => setForm((f) => ({ ...f, source: e.target.value }))}
                style={{
                  width: "100%", background: DS.bg, border: `1px solid ${DS.border}`,
                  borderRadius: 10, padding: "10px 14px", color: DS.text, fontSize: 13,
                  outline: "none", cursor: "pointer", fontFamily: DS.body,
                }}
              >
                <option value="manual">Manual (thưởng tay)</option>
                <option value="task_done">Task hoàn thành</option>
                <option value="commit_merge">Commit/Merge</option>
                <option value="seo_published">SEO bài viết</option>
                <option value="referral">Referral</option>
                <option value="bonus">Thưởng đặc biệt</option>
              </select>
            </div>

            {/* Project ID */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", color: DS.text4, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.08em", marginBottom: 6 }}>
                PROJECT ID (tùy chọn)
              </label>
              <input
                type="text"
                placeholder="Liên kết với dự án..."
                value={form.projectId}
                onChange={(e) => setForm((f) => ({ ...f, projectId: e.target.value }))}
                style={{
                  width: "100%", background: DS.bg, border: `1px solid ${DS.border}`,
                  borderRadius: 10, padding: "10px 14px", color: DS.text, fontSize: 13,
                  outline: "none", fontFamily: DS.body, boxSizing: "border-box",
                }}
              />
            </div>

            {/* Note */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", color: DS.text4, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.08em", marginBottom: 6 }}>
                GHI CHÚ
              </label>
              <textarea
                rows={2}
                placeholder="Lý do thưởng..."
                value={form.note}
                onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                style={{
                  width: "100%", background: DS.bg, border: `1px solid ${DS.border}`,
                  borderRadius: 10, padding: "10px 14px", color: DS.text, fontSize: 13,
                  outline: "none", fontFamily: DS.body, resize: "vertical", boxSizing: "border-box",
                }}
              />
            </div>

            {error && (
              <div style={{ padding: "10px 14px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, marginBottom: 14, color: "#EF4444", fontSize: 13 }}>
                {error}
              </div>
            )}

            <div style={{ display: "flex", gap: 10 }}>
              <button type="button" onClick={onClose}
                style={{ flex: 1, padding: "11px", background: DS.bg, color: DS.text3, border: `1px solid ${DS.border}`, borderRadius: 10, fontWeight: 600, cursor: "pointer", fontSize: 13 }}>
                Hủy
              </button>
              <button type="submit" disabled={saving}
                style={{
                  flex: 2, padding: "11px",
                  background: saving ? `${DS.amber}60` : "linear-gradient(135deg, #F59E0B, #FBBF24)",
                  color: "#000", border: "none", borderRadius: 10, fontWeight: 800,
                  cursor: saving ? "not-allowed" : "pointer", fontSize: 13,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                }}>
                <Award size={14} />
                {saving ? "Đang thưởng..." : `Thưởng ${form.lpAmount ? fmtLp(parseInt(form.lpAmount) || 0) : ""} LP`}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── KPI Stats ─────────────────────────────────────────────────────────────────

function KpiBar({ entries }: { entries: LeaderboardEntry[] }) {
  const totalLp = entries.reduce((s, e) => s + e.totalLp, 0);
  const avgLp = entries.length ? Math.round(totalLp / entries.length) : 0;
  const topLp = entries[0]?.totalLp ?? 0;
  const topName = entries[0]?.name ?? "—";
  const activeRankers = entries.filter((e) => e.totalLp > 0).length;
  const diamondCount = entries.filter((e) => e.rank === "diamond").length;

  const kpis = [
    { label: "Tổng LP", value: fmtLp(totalLp), color: DS.amber, icon: <Trophy size={14} /> },
    { label: "Trung bình", value: fmtLp(avgLp), color: DS.blue, icon: <TrendingUp size={14} /> },
    { label: "Top LP", value: fmtLp(topLp), color: DS.amber, icon: <Crown size={14} />, sub: topName },
    { label: "Có LP", value: `${activeRankers} members`, color: DS.green, icon: <Star size={14} /> },
    { label: "Diamond", value: `${diamondCount} members`, color: "#60A5FA", icon: <Shield size={14} /> },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10, marginBottom: 24 }}>
      {kpis.map((k) => (
        <div key={k.label} style={{
          background: DS.bgCard, border: `1px solid ${DS.border}`,
          borderRadius: 12, padding: "12px 14px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}>
            <span style={{ color: k.color }}>{k.icon}</span>
            <span style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.08em" }}>
              {k.label.toUpperCase()}
            </span>
          </div>
          <div style={{ color: DS.text, fontWeight: 800, fontSize: 16, fontFamily: DS.mono }}>{k.value}</div>
          {k.sub && <div style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, marginTop: 1 }}>{k.sub}</div>}
        </div>
      ))}
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function LeaderboardAdminPage() {
  const [sort, setSort] = useState<"rank" | "level" | "lp">("rank");
  const [awardTarget, setAwardTarget] = useState<LeaderboardEntry | null>(null);
  const [showTop, setShowTop] = useState(20);

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["admin", "rank", "leaderboard", { sort }],
    queryFn: async () => {
      const order = sort === "lp" ? "desc" : "asc";
      const res = await adminApi.get<{ data: LeaderboardEntry[] }>(
        "/api/admin/rank/leaderboard",
        { params: { sort, order, limit: 100 } }
      );
      return res;
    },
  });

  const entries = data?.data ?? [];

  // Apply local top-N filter
  const displayEntries = entries.slice(0, showTop);

  // Sorted by rank tier for default view
  const sortedByRank = [...entries].sort((a, b) => {
    const tierDiff = (RANKS[b.rank as RankKey]?.tier ?? 0) - (RANKS[a.rank as RankKey]?.tier ?? 0);
    if (tierDiff !== 0) return tierDiff;
    return b.totalLp - a.totalLp;
  });

  const displayList = sort === "rank" ? sortedByRank.slice(0, showTop) : displayEntries;

  // Rank tier stats
  const tierStats = RANK_ORDER.map((rk) => {
    const cfg = RANKS[rk as RankKey];
    const count = entries.filter((e) => e.rank === rk).length;
    return { rank: rk, cfg, count };
  });

  const SORT_OPTIONS: Array<{ value: "rank" | "level" | "lp"; label: string }> = [
    { value: "rank", label: "Hạng rank" },
    { value: "level", label: "Level" },
    { value: "lp", label: "Tổng LP" },
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <h2 style={{ fontFamily: DS.heading, fontSize: 20, fontWeight: 800, color: DS.text, marginBottom: 2 }}>
            Bảng xếp hạng LP
          </h2>
          <p style={{ color: DS.text4, fontSize: 12, fontFamily: DS.mono }}>
            {entries.length} thành viên · cập nhật real-time từ approved awards
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {/* Sort selector */}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as "rank" | "level" | "lp")}
            style={{
              background: DS.bgCard, border: `1px solid ${DS.border}`,
              borderRadius: 10, padding: "8px 12px", color: DS.text3,
              fontSize: 12, outline: "none", cursor: "pointer", fontFamily: DS.mono,
            }}
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <button
            onClick={() => refetch()}
            style={{
              display: "flex", alignItems: "center", gap: 6, padding: "8px 14px",
              background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 10,
              color: DS.text3, cursor: "pointer", fontSize: 12, fontFamily: DS.mono,
            }}
          >
            <RefreshCw size={13} className={isFetching ? "animate-spin" : ""} />
            Làm mới
          </button>
        </div>
      </div>

      {/* KPI Bar */}
      {!isLoading && entries.length > 0 && <KpiBar entries={entries} />}

      {/* Rank tier chips */}
      <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
        {tierStats.map(({ rank, cfg, count }) => (
          <button
            key={rank}
            style={{
              padding: "4px 10px", borderRadius: 99, cursor: "default",
              fontSize: 11, fontFamily: DS.mono, fontWeight: 700,
              background: count > 0 ? cfg.bg : DS.bg,
              border: `1px solid ${count > 0 ? cfg.color + "40" : DS.border}`,
              color: count > 0 ? cfg.color : DS.text4,
            }}
          >
            {cfg.symbol} {cfg.label} ({count})
          </button>
        ))}
      </div>

      {/* Podium */}
      {!isLoading && entries.length >= 3 && (
        <Podium
          entries={sortedByRank}
          onAward={setAwardTarget}
        />
      )}

      {/* Loading */}
      {isLoading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
          <div style={{
            width: 36, height: 36,
            border: `3px solid ${DS.border}`,
            borderTopColor: DS.amber,
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }} />
        </div>
      ) : entries.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: DS.text4 }}>
          <Trophy size={40} style={{ margin: "0 auto 12px", opacity: 0.4 }} />
          <p style={{ fontSize: 14, fontWeight: 600 }}>Chưa có dữ liệu xếp hạng</p>
          <p style={{ fontSize: 12, marginTop: 4 }}>Awards LP sẽ hiển thị ở đây</p>
        </div>
      ) : (
        <>
          {/* Table header */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {displayList.map((entry, idx) => (
              <LeaderboardRow
                key={entry.id}
                entry={entry}
                rank={sort === "rank" ? sortedByRank.indexOf(entry) + 1 : idx + 1}
                onAward={setAwardTarget}
              />
            ))}
          </div>

          {/* Show more */}
          {entries.length > showTop && (
            <div style={{ textAlign: "center", marginTop: 16 }}>
              <button
                onClick={() => setShowTop((n) => n + 20)}
                style={{
                  padding: "8px 24px",
                  background: DS.bgCard,
                  border: `1px solid ${DS.border}`,
                  borderRadius: 99,
                  color: DS.text3,
                  cursor: "pointer",
                  fontSize: 12,
                  fontFamily: DS.mono,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <ChevronDown size={14} />
                Hiển thị thêm ({entries.length - showTop} còn lại)
              </button>
            </div>
          )}
        </>
      )}

      {/* Award Modal */}
      {awardTarget && (
        <AwardModal
          entry={awardTarget}
          onClose={() => setAwardTarget(null)}
        />
      )}
    </div>
  );
}
