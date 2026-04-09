"use client";

import Link from "next/link";
import { X, ExternalLink, Info } from "lucide-react";
import { useLoopStore, type MemberStats, type RankKey } from "@/app/store/loopStore";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { DS } from "@/lib/design-tokens";

const RANKS: Record<RankKey, { label: string; color: string; symbol: string }> = {
  iron:     { label: "IRON",     color: "#9CA3AF", symbol: "⬡" },
  bronze:   { label: "BRONZE",   color: "#CD7F32", symbol: "◈" },
  silver:   { label: "SILVER",   color: "#CBD5E1", symbol: "◇" },
  gold:     { label: "GOLD",     color: "#FFD700", symbol: "★" },
  platinum: { label: "PLATINUM", color: "#14B8A6", symbol: "❋" },
  ruby:     { label: "RUBY",     color: "#EF4444", symbol: "♦" },
  diamond:  { label: "DIAMOND",  color: "#818CF8", symbol: "✦" },
};

const rankKeys = new Set<RankKey>(["iron","bronze","silver","gold","platinum","ruby","diamond"]);

function getRankCfg(rank: string) {
  const key = rankKeys.has(rank as RankKey) ? rank as RankKey : "iron";
  return RANKS[key];
}

function fmtLP(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function fmtDate(dateStr: string): string {
  try {
    return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "2-digit" })
      .format(new Date(dateStr));
  } catch {
    return dateStr;
  }
}

function StatusBadge({ status }: { status?: string }) {
  const colorMap: Record<string, string> = {
    active: "#22C55E", inactive: "#6B7280",
    "on-leave": "#F59E0B", probation: "#6B3DF5",
  };
  const color = colorMap[status ?? "active"] ?? "#22C55E";
  return (
    <span style={{
      padding: "2px 8px", borderRadius: 20,
      backgroundColor: color + "22",
      border: `1px solid ${color}55`,
      fontFamily: DS.mono, fontSize: 10, color,
    }}>
      {status === "active" ? "Active" : status ?? ""}
    </span>
  );
}

export function MemberStatsPanel() {
  const activeMember = useLoopStore((s) => s.activeMember);
  const clearActiveMember = useLoopStore((s) => s.clearActiveMember);
  const isOpen = activeMember !== null;
  const cfg = activeMember ? getRankCfg(activeMember.rank ?? "iron") : RANKS.iron;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => { if (!open) clearActiveMember(); }}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-sm overflow-y-auto p-0"
        style={{
          backgroundColor: DS.bg,
          borderLeft: `1px solid ${cfg.color}33`,
          boxShadow: `-4px 0 40px ${cfg.color}18`,
          height: "100vh",
          maxHeight: "100vh",
        }}
      >
        <DialogPrimitive.Title
          style={{
            position: "absolute", width: 1, height: 1, padding: 0,
            margin: -1, overflow: "hidden", clip: "rect(0,0,0,0)",
            whiteSpace: "nowrap", border: 0,
          }}
        >
          {activeMember?.name} - {cfg.label} Level {activeMember?.level}
        </DialogPrimitive.Title>
        {activeMember && (
          <PanelContent member={activeMember} cfg={cfg} onClose={clearActiveMember} />
        )}
      </SheetContent>
    </Sheet>
  );
}

function PanelContent({
  member,
  cfg,
  onClose,
}: {
  member: MemberStats;
  cfg: { label: string; color: string; symbol: string };
  onClose: () => void;
}) {
  const pct = member.maxXp > 0 ? Math.round(((member.currentXp ?? 0) / member.maxXp) * 100) : 0;
  const skills = member.skills.length > 0
    ? member.skills
    : ["React", "TypeScript", "Design", "Communication"];

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{
        padding: "16px 16px 0",
        background: `linear-gradient(135deg, ${cfg.color}15, transparent)`,
        borderBottom: `1px solid ${cfg.color}22`,
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <span style={{ fontFamily: DS.mono, fontSize: 10, color: DS.text3 }}>MEMBER</span>
          <button
            onClick={onClose}
            style={{
              width: 28, height: 28, borderRadius: "50%",
              background: DS.bgCard, border: `1px solid ${DS.border}`,
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              color: DS.text3,
            }}
          >
            <X size={13} />
          </button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, paddingBottom: 16 }}>
          <div style={{
            width: 56, height: 56, borderRadius: "50%",
            backgroundColor: cfg.color + "22",
            border: `2.5px solid ${cfg.color}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: DS.heading, fontSize: 18, color: cfg.color,
            overflow: "hidden", flexShrink: 0,
          }}>
            {member.avatar ? (
              <img src={member.avatar} alt={member.name}
                style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : member.name.slice(0, 2).toUpperCase()}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <h2 style={{
              fontFamily: DS.heading, fontSize: 16, color: DS.text,
              margin: 0, lineHeight: 1.2,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {member.name}
            </h2>
            {member.email && (
              <div style={{ fontFamily: DS.mono, fontSize: 10, color: DS.text4, marginTop: 2 }}>
                {member.email}
              </div>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
              <span style={{ fontSize: 13 }}>{cfg.symbol}</span>
              <span style={{ fontFamily: DS.mono, fontSize: 11, color: cfg.color }}>
                {cfg.label} Lv.{member.level}
              </span>
              {member.status && <StatusBadge status={member.status} />}
            </div>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
            <span style={{ fontFamily: DS.mono, fontSize: 9, color: DS.text3, textTransform: "uppercase", letterSpacing: "0.08em" }}>XP</span>
            <span style={{ fontFamily: DS.mono, fontSize: 9, color: DS.text2 }}>
              {member.currentXp ?? 0}/{member.maxXp ?? 100} XP {pct}%
            </span>
          </div>
          <div style={{ height: 6, borderRadius: 3, backgroundColor: DS.border, overflow: "hidden" }}>
            <div style={{
              height: "100%", width: `${pct}%`,
              background: `linear-gradient(90deg, ${cfg.color}88, ${cfg.color})`,
              borderRadius: 3,
            }} />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
          {([
            { label: "LP Available", value: fmtLP(member.availableLp ?? 0), color: "#E6C75F" },
            { label: "LP Locked", value: fmtLP(member.lockedLp ?? 0), color: DS.text3 },
            { label: "Missions", value: String(member.missionsCompleted ?? 0), color: "#7CB5A0" },
            { label: "Total LP", value: fmtLP(member.totalApprovedLp ?? 0), color: "#818CF8" },
          ] as const).map(({ label, value, color }) => (
            <div key={label} style={{
              background: DS.bgCard, borderRadius: 10,
              border: `1px solid ${DS.border}`, padding: "10px 12px",
              textAlign: "center",
            }}>
              <div style={{ fontFamily: DS.mono, fontSize: 9, color: DS.text3, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
              <div style={{ fontFamily: DS.mono, fontSize: 15, color, fontWeight: 700, marginTop: 3 }}>{value}</div>
            </div>
          ))}
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontFamily: DS.mono, fontSize: 9, color: DS.text3, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Classification</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {([
              { label: "Department", value: member.teamTag ?? member.department ?? "—" },
              { label: "Role", value: member.role ?? "—" },
            ] as const).map(({ label, value }) => (
              <div key={label} style={{
                background: DS.bgCard, borderRadius: 8,
                border: `1px solid ${DS.border}`, padding: "7px 12px", flex: 1, minWidth: 100,
              }}>
                <div style={{ fontFamily: DS.mono, fontSize: 9, color: DS.text3, textTransform: "uppercase" }}>{label}</div>
                <div style={{ fontFamily: DS.mono, fontSize: 11, color: DS.text, marginTop: 2 }}>{value}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 6, display: "flex", flexWrap: "wrap", gap: 4 }}>
            <span style={{ fontFamily: DS.mono, fontSize: 9, color: DS.text3, alignSelf: "center" }}>System:</span>
            {(member.systemRole ? [member.systemRole] : []).map((r) => {
              const roleColors: Record<string, string> = {
                ceo: "#FFD700", super_admin: "#6B3DF5", admin: DS.blue,
                hr: "#14B8A6", project_manager: "#EC4899", media: "#F59E0B",
                qa: "#22C55E", member: DS.text3,
              };
              const color = roleColors[r] ?? DS.text3;
              return (
                <span key={r} style={{
                  padding: "2px 8px", borderRadius: 20,
                  backgroundColor: color + "18",
                  border: `1px solid ${color}44`,
                  fontFamily: DS.mono, fontSize: 10, color,
                }}>
                  {r.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                </span>
              );
            })}
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontFamily: DS.mono, fontSize: 9, color: DS.text3, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Skills</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {skills.map((s, i) => (
              <span key={i} style={{
                padding: "3px 10px", borderRadius: 20,
                backgroundColor: cfg.color + "18",
                border: `1px solid ${cfg.color}44`,
                fontFamily: DS.mono, fontSize: 11, color: cfg.color,
              }}>
                {s}
              </span>
            ))}
          </div>
        </div>

        {member.achievements && member.achievements.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontFamily: DS.mono, fontSize: 9, color: DS.text3, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Achievements</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {member.achievements.map((a, i) => (
                <span key={i} style={{
                  padding: "3px 10px", borderRadius: 6,
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

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontFamily: DS.mono, fontSize: 9, color: DS.text3, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Rank History</div>
          {member.rankHistory.length === 0 ? (
            <div style={{
              background: DS.bgCard, borderRadius: 10,
              border: `1px solid ${DS.border}`, padding: "12px",
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <Info size={13} color={DS.text3} />
              <span style={{ fontFamily: DS.mono, fontSize: 11, color: DS.text3 }}>No rank history yet</span>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {member.rankHistory.slice(0, 4).map((h, i) => {
                const fromCfg = getRankCfg(h.from ?? "iron");
                const toCfg = getRankCfg(h.to ?? "iron");
                return (
                  <div key={i} style={{
                    background: DS.bgCard, borderRadius: 8,
                    border: `1px solid ${DS.border}`, padding: "8px 12px",
                    display: "flex", alignItems: "center", gap: 8,
                  }}>
                    <span style={{ fontSize: 11, color: fromCfg.color }}>{fromCfg.symbol}</span>
                    <span style={{ color: DS.text3, fontSize: 10 }}>-&gt;</span>
                    <span style={{ fontSize: 11, color: toCfg.color }}>{toCfg.symbol}</span>
                    <span style={{ fontFamily: DS.mono, fontSize: 10, color: DS.text3, flex: 1 }}>{h.reason}</span>
                    <span style={{ fontFamily: DS.mono, fontSize: 9, color: DS.text4 }}>{fmtDate(h.date)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontFamily: DS.mono, fontSize: 9, color: DS.text3, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Recent Missions</div>
          {member.missionLogs.length === 0 ? (
            <div style={{
              background: DS.bgCard, borderRadius: 10,
              border: `1px solid ${DS.border}`, padding: "12px",
              fontFamily: DS.mono, fontSize: 11, color: DS.text3,
            }}>No mission data yet</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {member.missionLogs.slice(0, 5).map((log, i) => (
                <div key={i} style={{
                  background: DS.bgCard, borderRadius: 8,
                  border: `1px solid ${DS.border}`, padding: "8px 12px",
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                }}>
                  <span style={{ fontFamily: DS.mono, fontSize: 10, color: DS.text }}>{log.task}</span>
                  <span style={{ fontFamily: DS.mono, fontSize: 10, color: "#E6C75F", flexShrink: 0, marginLeft: 8 }}>
                    +{fmtLP(log.lpEarned)} LP
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <Link
          href={`/team/${member.slug}`}
          onClick={onClose}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            padding: "10px", borderRadius: 10,
            background: `${cfg.color}15`,
            border: `1px solid ${cfg.color}44`,
            color: cfg.color,
            fontFamily: DS.mono, fontSize: 12,
            textDecoration: "none",
            transition: "all 0.15s",
          }}
        >
          View Full Profile <ExternalLink size={12} />
        </Link>
      </div>
    </div>
  );
}
