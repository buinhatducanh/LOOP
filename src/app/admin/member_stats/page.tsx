"use client";

/**
 * Member Stats Admin Page — LOOP Solutions
 * Route: /admin/member_stats
 *
 * Admin management for the global MemberStatsPanel feature:
 * - Enable/disable the panel globally
 * - Configure which stats sections are visible
 * - Select default member (auto-selected on load)
 * - Auto-dismiss timeout setting
 * - Live preview with selected member
 *
 * Wire: MemberStatsPanel reads from loopStore.activeMember.
 * The admin page provides config persistence via SiteSetting API.
 */
import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import { adminApi } from "@/lib/api/client";
import { useLoopStore, type MemberStats } from "@/app/store/loopStore";
import { DS } from "@/lib/design-tokens";
import {
  Eye, EyeOff, X, Search, Check, Loader2,
  Settings, Sliders, Users, Zap, Clock,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────

interface MemberStatsConfig {
  enabled: boolean;
  defaultMemberId: string | null;
  showXpBar: boolean;
  showLpBalances: boolean;
  showRankHistory: boolean;
  showSkills: boolean;
  showMissions: boolean;
  showAchievements: boolean;
  autoDismissSeconds: number;
  positionMode: "click" | "center";
}

interface TeamMemberRow {
  id: string;
  name: string;
  role: string;
  avatar: string | null;
  rank?: string;
  level?: number;
  currentXp?: number;
  maxXp?: number;
  availableLp?: number;
  department?: string;
  systemRole?: string | null;
}

// ── Helpers ──────────────────────────────────────────────────────────────────────

const fmtLP = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
};

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const DEFAULTS: MemberStatsConfig = {
  enabled: true,
  defaultMemberId: null,
  showXpBar: true,
  showLpBalances: true,
  showRankHistory: true,
  showSkills: true,
  showMissions: true,
  showAchievements: true,
  autoDismissSeconds: 0,
  positionMode: "center",
};

// ── Section toggle component ─────────────────────────────────────────────────────

function ToggleRow({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "12px 16px",
      background: DS.bgCard,
      borderRadius: 10,
      border: `1px solid ${DS.border}`,
      marginBottom: 8,
    }}>
      <div>
        <div style={{ fontFamily: DS.mono, fontSize: 13, color: DS.text, fontWeight: 500 }}>
          {label}
        </div>
        {description && (
          <div style={{ fontFamily: DS.mono, fontSize: 11, color: DS.text3, marginTop: 2 }}>
            {description}
          </div>
        )}
      </div>
      <button
        onClick={() => onChange(!value)}
        style={{
          width: 44, height: 24, borderRadius: 12,
          background: value ? DS.blue : DS.border,
          border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", padding: 2,
          transition: "background 0.2s",
          flexShrink: 0,
        }}
      >
        <div style={{
          width: 20, height: 20, borderRadius: "50%",
          background: "#fff",
          transform: value ? "translateX(20px)" : "translateX(0)",
          transition: "transform 0.2s",
          boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
        }} />
      </button>
    </div>
  );
}

// ── Stats Panel Preview (subset for the admin preview) ─────────────────────────

function StatsPreview({ member, config }: { member: MemberStats; config: MemberStatsConfig }) {
  const cfg = {
    iron: { label: "IRON", color: "#9CA3AF", symbol: "⬡" },
    bronze: { label: "BRONZE", color: "#CD7F32", symbol: "◈" },
    silver: { label: "SILVER", color: "#CBD5E1", symbol: "◇" },
    gold: { label: "GOLD", color: "#FFD700", symbol: "★" },
    platinum: { label: "PLATINUM", color: "#14B8A6", symbol: "❋" },
    ruby: { label: "RUBY", color: "#EF4444", symbol: "♦" },
    diamond: { label: "DIAMOND", color: "#818CF8", symbol: "✦" },
  } as const;
  const rCfg = cfg[member.rank as keyof typeof cfg] ?? cfg.iron;
  const pct = member.maxXp > 0 ? Math.round((member.currentXp / member.maxXp) * 100) : 0;

  return (
    <div style={{
      background: DS.bg,
      borderRadius: 16,
      border: `1px solid ${rCfg.color}44`,
      overflow: "hidden",
      maxWidth: 500,
    }}>
      {/* Mini banner */}
      <div style={{
        height: 64,
        background: `linear-gradient(135deg, ${rCfg.color}22, ${rCfg.color}08)`,
        borderBottom: `1px solid ${rCfg.color}22`,
        position: "relative",
        display: "flex", alignItems: "flex-end", padding: "0 16px 8px",
        gap: 10,
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: "50%",
          backgroundColor: rCfg.color + "33",
          border: `2px solid ${rCfg.color}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: DS.heading, fontSize: 14, color: rCfg.color,
          overflow: "hidden", flexShrink: 0,
        }}>
          {member.avatar ? (
            <img src={member.avatar} alt={member.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : member.name.slice(0, 2).toUpperCase()}
        </div>
        <div>
          <div style={{ fontFamily: DS.heading, fontSize: 14, color: DS.text }}>
            {member.name}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ fontSize: 11 }}>{rCfg.symbol}</span>
            <span style={{ fontFamily: DS.mono, fontSize: 11, color: rCfg.color }}>
              {rCfg.label} · Level {member.level}
            </span>
          </div>
        </div>
      </div>

      <div style={{ padding: "12px 16px" }}>
        {/* XP Bar */}
        {config.showXpBar && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontFamily: DS.mono, fontSize: 9, color: DS.text3 }}>XP</span>
              <span style={{ fontFamily: DS.mono, fontSize: 9, color: DS.text2 }}>{pct}%</span>
            </div>
            <div style={{ height: 5, borderRadius: 3, backgroundColor: DS.border, overflow: "hidden" }}>
              <div style={{
                height: "100%", width: `${pct}%`,
                background: `linear-gradient(90deg, ${rCfg.color}88, ${rCfg.color})`,
                borderRadius: 3,
              }} />
            </div>
          </div>
        )}

        {/* LP stats */}
        {config.showLpBalances && (
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(2, 1fr)",
            gap: 6, marginBottom: 12,
          }}>
            {[
              { label: "LP Khả dụng", value: fmtLP(member.availableLp), color: "#E6C75F" },
              { label: "LP Bị khóa", value: fmtLP(member.lockedLp), color: DS.text3 },
            ].map(({ label, value, color }) => (
              <div key={label} style={{
                background: DS.bgCard, borderRadius: 8,
                border: `1px solid ${DS.border}`,
                padding: "8px 10px", textAlign: "center",
              }}>
                <div style={{ fontFamily: DS.mono, fontSize: 8, color: DS.text3 }}>{label}</div>
                <div style={{ fontFamily: DS.mono, fontSize: 14, color, fontWeight: 700 }}>{value}</div>
              </div>
            ))}
          </div>
        )}

        {/* Skills */}
        {config.showSkills && member.skills.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontFamily: DS.mono, fontSize: 9, color: DS.text3, marginBottom: 5 }}>KỸ NĂNG</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {member.skills.slice(0, 4).map((s, i) => (
                <span key={i} style={{
                  padding: "2px 8px", borderRadius: 20,
                  backgroundColor: rCfg.color + "18",
                  border: `1px solid ${rCfg.color}44`,
                  fontFamily: DS.mono, fontSize: 10, color: rCfg.color,
                }}>
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Achievements */}
        {config.showAchievements && member.achievements.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontFamily: DS.mono, fontSize: 9, color: DS.text3, marginBottom: 5 }}>THÀNH TỰU</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {member.achievements.slice(0, 3).map((a, i) => (
                <span key={i} style={{
                  padding: "2px 8px", borderRadius: 6,
                  backgroundColor: "#E6C75F18",
                  border: `1px solid #E6C75F44`,
                  fontFamily: DS.mono, fontSize: 10, color: "#E6C75F",
                }}>
                  {a}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Missions */}
        {config.showMissions && member.missionsCompleted > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 10px", background: DS.bgCard, borderRadius: 8, border: `1px solid ${DS.border}`, marginBottom: 8 }}>
            <span style={{ fontFamily: DS.mono, fontSize: 11, color: DS.text }}>Nhiệm vụ</span>
            <span style={{ fontFamily: DS.mono, fontSize: 11, color: "#7CB5A0" }}>{member.missionsCompleted} hoàn thành</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function MemberStatsAdminPage() {
  const queryClient = useQueryClient();
  const { activeMember, setActiveMember, clearActiveMember } = useLoopStore();

  // ── Config state ───────────────────────────────────────────────────────────
  const [config, setConfig] = useState<MemberStatsConfig>(DEFAULTS);
  const [saved, setSaved] = useState(false);
  const [search, setSearch] = useState("");

  // ── Fetch config ──────────────────────────────────────────────────────────
  const { data: configData, isLoading: configLoading } = useQuery({
    queryKey: ["member-stats-config"],
    queryFn: async () => {
      return await adminApi.get<MemberStatsConfig>("/api/admin/settings/member-stats");
    },
  });

  useEffect(() => {
    if (configData) setConfig(configData);
  }, [configData]);

  // ── Fetch members ──────────────────────────────────────────────────────────
  const { data: membersData, isLoading: membersLoading } = useQuery({
    queryKey: ["admin-team-members"],
    queryFn: async () => {
      return await adminApi.get<TeamMemberRow[]>("/api/admin/team?limit=100");
    },
  });

  // ── Save config mutation ───────────────────────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: async (cfg: MemberStatsConfig) => {
      return await adminApi.post("/api/admin/settings/member-stats", cfg);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["member-stats-config"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const handleSave = () => {
    saveMutation.mutate(config);
  };

  // ── Build MemberStats for preview ──────────────────────────────────────────
  const previewMember: MemberStats = {
    id: membersData?.[0]?.id ?? "1",
    slug: "preview",
    name: membersData?.[0]?.name ?? "Akira Sato",
    role: membersData?.[0]?.role ?? "Project Manager",
    avatar: membersData?.[0]?.avatar ?? null,
    rank: "diamond",
    level: 118,
    currentXp: 92,
    maxXp: 100,
    availableLp: 98000,
    lockedLp: 15000,
    department: "engineering",
    systemRole: "member",
    skills: ["React", "TypeScript", "Next.js", "System Design"],
    achievements: ["Top Performer 2025", "Hackathon Winner", "Diamond Rank"],
    rankHistory: [
      { date: "2026-01-15", from: "ruby", to: "diamond", reason: "Đạt Diamond Rank" },
      { date: "2025-08-20", from: "platinum", to: "ruby", reason: "Đạt Ruby Rank" },
    ],
    missionLogs: [
      { date: "2026-04-05", task: "TaskKanban VNRetail API Integration", lpEarned: 2500 },
      { date: "2026-04-03", task: "Code Review Sprint 14", lpEarned: 800 },
      { date: "2026-04-01", task: "Deploy FinCorp Dashboard v2", lpEarned: 3200 },
    ],
    missionsCompleted: 47,
    totalApprovedLp: 98000,
    teamTag: "Engineering",
    status: "active",
  };

  const filteredMembers = (membersData ?? []).filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    (m.role ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const updateConfig = <K extends keyof MemberStatsConfig>(key: K, value: MemberStatsConfig[K]) => {
    setConfig((c) => ({ ...c, [key]: value }));
  };

  return (
    <div style={{ padding: "0 4px" }}>
      {/* Page header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: `linear-gradient(135deg, ${DS.blue}33, ${DS.purple}33)`,
            border: `1px solid ${DS.blue}44`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Sliders size={18} color={DS.blue} />
          </div>
          <div>
            <h1 style={{ fontFamily: DS.heading, fontSize: 18, color: DS.text, margin: 0 }}>
              Member Stats Panel
            </h1>
            <p style={{ fontFamily: DS.mono, fontSize: 11, color: DS.text3, margin: 0 }}>
              Quản lý panel thống kê thành viên — click bất kỳ member nào để xem stats
            </p>
          </div>
        </div>
      </div>

      {/* Top CTA: enable/disable + quick actions */}
      <div style={{
        display: "flex", alignItems: "center", gap: 12, marginBottom: 20,
        padding: "12px 16px",
        background: config.enabled ? `${DS.green}11` : `${DS.red}11`,
        borderRadius: 12,
        border: `1px solid ${config.enabled ? DS.green : DS.red}33`,
      }}>
        <button
          onClick={() => updateConfig("enabled", !config.enabled)}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "8px 16px", borderRadius: 8,
            background: config.enabled ? `${DS.green}22` : `${DS.red}22`,
            border: `1px solid ${config.enabled ? DS.green : DS.red}44`,
            color: config.enabled ? DS.green : DS.red,
            fontFamily: DS.mono, fontSize: 12, cursor: "pointer",
            transition: "all 0.2s",
          }}
        >
          {config.enabled ? <Eye size={14} /> : <EyeOff size={14} />}
          {config.enabled ? "Panel đang bật" : "Panel đang tắt"}
        </button>
        <div style={{ fontFamily: DS.mono, fontSize: 11, color: DS.text3 }}>
          Click bất kỳ member card ở đâu trong app để hiện stats panel
        </div>
        <div style={{ marginLeft: "auto" }}>
          <button
            onClick={() => {
              if (activeMember) clearActiveMember();
              else setActiveMember(previewMember, { x: 0, y: 0 });
            }}
            style={{
              padding: "7px 14px", borderRadius: 8,
              background: `${DS.blue}22`,
              border: `1px solid ${DS.blue}44`,
              color: DS.blue, fontFamily: DS.mono, fontSize: 11,
              cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
            }}
          >
            {activeMember ? <X size={12} /> : <Eye size={12} />}
            {activeMember ? "Đóng Panel" : "Xem trước Panel"}
          </button>
        </div>
      </div>

      {/* Main content: left (config) + right (member list + preview) */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20, alignItems: "start" }}>
        {/* ── Left: Configuration ──────────────────────────────────────────── */}
        <div>
          {/* Display sections */}
          <div style={{ marginBottom: 20 }}>
            <div style={{
              fontFamily: DS.mono, fontSize: 10, color: DS.text3,
              textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10,
            }}>
              Hiển thị
            </div>
            <ToggleRow
              label="Thanh XP"
              description="Thanh kinh nghiệm level hiện tại"
              value={config.showXpBar}
              onChange={(v) => updateConfig("showXpBar", v)}
            />
            <ToggleRow
              label="Số dư LP"
              description="LP khả dụng, bị khóa, tổng"
              value={config.showLpBalances}
              onChange={(v) => updateConfig("showLpBalances", v)}
            />
            <ToggleRow
              label="Lịch sử hạng"
              description="Các bước thăng hạng của member"
              value={config.showRankHistory}
              onChange={(v) => updateConfig("showRankHistory", v)}
            />
            <ToggleRow
              label="Kỹ năng"
              description="Tags kỹ năng của member"
              value={config.showSkills}
              onChange={(v) => updateConfig("showSkills", v)}
            />
            <ToggleRow
              label="Nhiệm vụ"
              description="Số nhiệm vụ đã hoàn thành + log gần đây"
              value={config.showMissions}
              onChange={(v) => updateConfig("showMissions", v)}
            />
            <ToggleRow
              label="Thành tựu"
              description="Awards và achievements của member"
              value={config.showAchievements}
              onChange={(v) => updateConfig("showAchievements", v)}
            />
          </div>

          {/* Behavior */}
          <div style={{ marginBottom: 20 }}>
            <div style={{
              fontFamily: DS.mono, fontSize: 10, color: DS.text3,
              textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10,
            }}>
              Hành vi
            </div>

            <div style={{
              padding: "12px 16px", background: DS.bgCard,
              borderRadius: 10, border: `1px solid ${DS.border}`, marginBottom: 8,
            }}>
              <div style={{ fontFamily: DS.mono, fontSize: 11, color: DS.text, marginBottom: 8 }}>
                Auto-dismiss sau (giây)
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {[0, 5, 10, 15, 30].map((sec) => (
                  <button
                    key={sec}
                    onClick={() => updateConfig("autoDismissSeconds", sec)}
                    style={{
                      padding: "5px 12px", borderRadius: 6, cursor: "pointer",
                      background: config.autoDismissSeconds === sec ? `${DS.blue}22` : DS.bg,
                      border: `1px solid ${config.autoDismissSeconds === sec ? DS.blue : DS.border}`,
                      color: config.autoDismissSeconds === sec ? DS.blue : DS.text3,
                      fontFamily: DS.mono, fontSize: 11,
                      transition: "all 0.15s",
                    }}
                  >
                    {sec === 0 ? "Never" : `${sec}s`}
                  </button>
                ))}
              </div>
            </div>

            <div style={{
              padding: "12px 16px", background: DS.bgCard,
              borderRadius: 10, border: `1px solid ${DS.border}`,
            }}>
              <div style={{ fontFamily: DS.mono, fontSize: 11, color: DS.text, marginBottom: 8 }}>
                Vị trí panel
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {(["center", "click"] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => updateConfig("positionMode", mode)}
                    style={{
                      padding: "5px 12px", borderRadius: 6, cursor: "pointer",
                      background: config.positionMode === mode ? `${DS.purple}22` : DS.bg,
                      border: `1px solid ${config.positionMode === mode ? DS.purple : DS.border}`,
                      color: config.positionMode === mode ? DS.purple : DS.text3,
                      fontFamily: DS.mono, fontSize: 11,
                      transition: "all 0.15s",
                    }}
                  >
                    {mode === "center" ? "Giữa màn hình" : "Theo vị trí click"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={saveMutation.isPending}
            style={{
              width: "100%", padding: "12px",
              borderRadius: 10, cursor: saveMutation.isPending ? "not-allowed" : "pointer",
              background: saved ? `${DS.green}22` : `${DS.blue}22`,
              border: `1px solid ${saved ? DS.green : DS.blue}44`,
              color: saved ? DS.green : DS.blue,
              fontFamily: DS.mono, fontSize: 13, fontWeight: 600,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              transition: "all 0.2s",
            }}
          >
            {saveMutation.isPending ? (
              <><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Đang lưu...</>
            ) : saved ? (
              <><Check size={14} /> Đã lưu!</>
            ) : (
              <><Settings size={14} /> Lưu cấu hình</>
            )}
          </button>
        </div>

        {/* ── Right: Member list + Live Preview ─────────────────────────────── */}
        <div>
          {/* Member selector */}
          <div style={{ marginBottom: 16 }}>
            <div style={{
              fontFamily: DS.mono, fontSize: 10, color: DS.text3,
              textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8,
            }}>
              Chọn member xem trước
            </div>
            <div style={{ position: "relative", marginBottom: 8 }}>
              <Search size={13} style={{
                position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)",
                color: DS.text3, pointerEvents: "none",
              }} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm member..."
                style={{
                  width: "100%", padding: "8px 10px 8px 32px",
                  background: DS.bgCard, border: `1px solid ${DS.border}`,
                  borderRadius: 8, color: DS.text,
                  fontFamily: DS.mono, fontSize: 12,
                  outline: "none", boxSizing: "border-box",
                }}
              />
            </div>

            {/* Member list */}
            <div style={{
              maxHeight: 240, overflowY: "auto",
              background: DS.bgCard, borderRadius: 10,
              border: `1px solid ${DS.border}`,
            }}>
              {membersLoading ? (
                <div style={{ padding: 20, textAlign: "center", color: DS.text3, fontFamily: DS.mono, fontSize: 11 }}>
                  <Loader2 size={14} style={{ animation: "spin 1s linear infinite", display: "inline" }} /> Đang tải...
                </div>
              ) : filteredMembers.length === 0 ? (
                <div style={{ padding: 16, textAlign: "center", color: DS.text3, fontFamily: DS.mono, fontSize: 11 }}>
                  Không tìm thấy member
                </div>
              ) : (
                filteredMembers.slice(0, 20).map((m) => (
                  <div
                    key={m.id}
                    onClick={() => {
                      // Build a MemberStats from the row for preview
                      const stats: MemberStats = {
                        id: m.id,
                        slug: m.id,
                        name: m.name,
                        role: m.role ?? "Member",
                        avatar: m.avatar ?? null,
                        rank: m.rank?.toLowerCase() ?? "iron",
                        level: m.level ?? 1,
                        currentXp: m.currentXp ?? 0,
                        maxXp: m.maxXp ?? 100,
                        availableLp: m.availableLp ?? 0,
                        lockedLp: 0,
                        department: m.department ?? "engineering",
                        systemRole: m.systemRole ?? "member",
                        skills: [],
                        achievements: [],
                        rankHistory: [],
                        missionLogs: [],
                        missionsCompleted: 0,
                        totalApprovedLp: m.availableLp ?? 0,
                        teamTag: m.department ? capitalize(m.department) : "—",
                        status: "active",
                      };
                      setActiveMember(stats, { x: 0, y: 0 });
                    }}
                    style={{
                      padding: "8px 12px",
                      display: "flex", alignItems: "center", gap: 10,
                      cursor: "pointer",
                      borderBottom: `1px solid ${DS.border}`,
                      transition: "background 0.1s",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = DS.bg; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                  >
                    <div style={{
                      width: 28, height: 28, borderRadius: "50%",
                      background: DS.bg, border: `1.5px solid ${DS.border}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontFamily: DS.heading, fontSize: 10, color: DS.text3,
                      overflow: "hidden", flexShrink: 0,
                    }}>
                      {m.avatar ? (
                        <img src={m.avatar} alt={m.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : m.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{
                        fontFamily: DS.mono, fontSize: 11, color: DS.text,
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}>
                        {m.name}
                      </div>
                      <div style={{ fontFamily: DS.mono, fontSize: 10, color: DS.text3 }}>
                        {m.role ?? "Member"} · Lv.{m.level ?? 1}
                      </div>
                    </div>
                    <Eye size={12} color={DS.blue} />
                  </div>
                ))
              )}
            </div>
            <div style={{ fontFamily: DS.mono, fontSize: 10, color: DS.text4, marginTop: 6, textAlign: "center" }}>
              Click member để xem trước panel stats
            </div>
          </div>

          {/* Live preview */}
          {activeMember && (
            <div>
              <div style={{
                fontFamily: DS.mono, fontSize: 10, color: DS.text3,
                textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8,
              }}>
                Xem trước (live)
              </div>
              <StatsPreview member={activeMember} config={config} />
              <button
                onClick={clearActiveMember}
                style={{
                  width: "100%", marginTop: 8, padding: "7px",
                  borderRadius: 8, background: `${DS.red}11`,
                  border: `1px solid ${DS.red}33`,
                  color: DS.red, fontFamily: DS.mono, fontSize: 11,
                  cursor: "pointer", display: "flex", alignItems: "center",
                  justifyContent: "center", gap: 6,
                }}
              >
                <X size={12} /> Đóng preview
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
