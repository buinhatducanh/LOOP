"use client";

/**
 * Effects Admin Page — LOOP Solutions
 * Route: /admin/effects
 *
 * ⚠️  READ-ONLY DISPLAY — Effects are driven by CODE, NOT database ⚠️
 *
 * The DB tables RankEffect + MemberEffectOverride are kept for future use
 * but are NOT read by the UI. Visual effects are fixed in guildMemberData.ts.
 *
 * This page exists to satisfy the admin tab but shows the actual architecture.
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { adminApi } from "@/lib/api/client";
import { DS } from "@/lib/design-tokens";
import { Sparkles, Info, RefreshCw, ToggleLeft, ToggleRight } from "lucide-react";

// Ranks with their effect configs (mirrors guildMemberData.ts)
const RANK_EFFECTS = [
  {
    rank: "Iron",
    tier: 1,
    color: "#9CA3AF",
    boxShadow: "0 0 8px rgba(156,163,175,0.4)",
    particles: false,
    electricSparks: false,
    diamondParticles: false,
    description: "No visual effects",
  },
  {
    rank: "Bronze",
    tier: 2,
    color: "#CD7F32",
    boxShadow: "0 0 12px rgba(205,127,50,0.5)",
    particles: true,
    electricSparks: false,
    diamondParticles: false,
    description: "Mild particle glow",
  },
  {
    rank: "Silver",
    tier: 3,
    color: "#E5E7EB",
    boxShadow: "0 0 16px rgba(229,231,235,0.6)",
    particles: true,
    electricSparks: true,
    diamondParticles: false,
    description: "Particles + electric sparks",
  },
  {
    rank: "Gold",
    tier: 4,
    color: "#FBBF24",
    boxShadow: "0 0 20px rgba(251,191,36,0.7), 0 0 40px rgba(251,191,36,0.3)",
    particles: true,
    electricSparks: true,
    diamondParticles: false,
    description: "Full glow + electric sparks",
  },
  {
    rank: "Diamond",
    tier: 5,
    color: "#60A5FA",
    boxShadow: "0 0 24px rgba(96,165,250,0.8), 0 0 60px rgba(96,165,250,0.4)",
    particles: true,
    electricSparks: true,
    diamondParticles: true,
    description: "Max effects: particles + sparks + diamonds + prism",
  },
];

function EffectBadge({ active, label }: { active: boolean; label: string }) {
  return (
    <span style={{
      background: active ? "rgba(34,197,94,0.1)" : "rgba(107,114,128,0.1)",
      color: active ? DS.green : DS.text5,
      border: `1px solid ${active ? "rgba(34,197,94,0.3)" : "rgba(107,114,128,0.3)"}`,
      padding: "2px 8px",
      borderRadius: 9999,
      fontSize: 10,
      fontFamily: DS.mono,
      fontWeight: 600,
    }}>
      {active ? <ToggleRight size={10} style={{ display: "inline", verticalAlign: "middle" }} /> : <ToggleLeft size={10} style={{ display: "inline", verticalAlign: "middle" }} />}
      {" "}{label}
    </span>
  );
}

function RankEffectRow({ rank }: { rank: typeof RANK_EFFECTS[0] }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      style={{
        background: DS.bgCard,
        border: `1px solid ${rank.color}30`,
        borderRadius: 12,
        padding: "1rem",
        display: "flex",
        alignItems: "center",
        gap: "1rem",
      }}
    >
      {/* Rank orb preview */}
      <div style={{ flexShrink: 0 }}>
        <div style={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          background: `${rank.color}20`,
          border: `2px solid ${rank.color}60`,
          boxShadow: rank.boxShadow,
          display: "grid",
          placeItems: "center",
          fontSize: 18,
          fontWeight: 900,
          color: rank.color,
          fontFamily: DS.heading,
        }}>
          {rank.rank[0]}
        </div>
      </div>

      {/* Info */}
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <span style={{ color: rank.color, fontWeight: 700, fontSize: 14, fontFamily: DS.heading }}>{rank.rank}</span>
          <span style={{ color: DS.text5, fontSize: 11, fontFamily: DS.mono }}>Tier {rank.tier}</span>
        </div>
        <div style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono }}>{rank.description}</div>
      </div>

      {/* Effect badges */}
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", justifyContent: "flex-end" }}>
        <EffectBadge active={rank.particles} label="Particles" />
        <EffectBadge active={rank.electricSparks} label="Sparks" />
        <EffectBadge active={rank.diamondParticles} label="Diamonds" />
      </div>
    </motion.div>
  );
}

export default function EffectsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "effects"],
    queryFn: () => adminApi.get<{ data: unknown[] }>("/api/admin/rank-effects", { params: { limit: 50 } }),
  });

  const dbEffects = (data?.data ?? []) as { id: string; name: string; type: string; minRank: string; color: string; isEnabled: boolean }[];

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h2 style={{ fontFamily: DS.heading, fontSize: 20, fontWeight: 800, color: DS.text, margin: "0 0 4px" }}>
            Hiệu ứng Rank
          </h2>
          <p style={{ color: DS.text4, fontSize: 12, fontFamily: DS.mono, margin: 0 }}>
            Visual effects per rank tier — source of truth: guildMemberData.ts
          </p>
        </div>
      </div>

      {/* Architecture note */}
      <div
        style={{
          background: "rgba(251,191,36,0.06)",
          border: `1px solid rgba(251,191,36,0.2)`,
          borderRadius: 10,
          padding: "1rem",
          marginBottom: "1.5rem",
          display: "flex",
          gap: "0.75rem",
          alignItems: "flex-start",
        }}
      >
        <Info size={16} style={{ color: DS.amber, flexShrink: 0, marginTop: 2 }} />
        <div style={{ fontSize: 12, color: DS.text3, fontFamily: DS.body, lineHeight: 1.6 }}>
          <strong style={{ color: DS.amber }}>Kiến trúc:</strong> Hiệu ứng rank được cố định trong code tại{" "}
          <code style={{ color: DS.blue, fontFamily: DS.mono, fontSize: 11 }}>guildMemberData.ts</code>.
          DB tables <code style={{ color: DS.text4, fontFamily: DS.mono, fontSize: 11 }}>RankEffect</code> +{" "}
          <code style={{ color: DS.text4, fontFamily: DS.mono, fontSize: 11 }}>MemberEffectOverride</code> được giữ
          cho tương lai nhưng UI KHÔNG đọc từ DB. Thêm/sửa hiệu ứng → cập nhật{" "}
          <code style={{ color: DS.blue, fontFamily: DS.mono, fontSize: 11 }}>guildMemberData.ts</code>.
        </div>
      </div>

      {/* Rank effects grid */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.5rem" }}>
        {RANK_EFFECTS.map(r => <RankEffectRow key={r.rank} rank={r} />)}
      </div>

      {/* DB table (read-only display, not used by UI) */}
      {dbEffects.length > 0 && (
        <div style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 12, padding: "1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "1rem" }}>
            <Sparkles size={14} style={{ color: DS.purple }} />
            <h3 style={{ color: DS.text2, fontSize: 14, fontWeight: 600, margin: 0 }}>DB RankEffects table (không dùng)</h3>
          </div>
          {isLoading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: 24 }}>
              <div style={{ width: 24, height: 24, border: `2px solid ${DS.border}`, borderTop: `2px solid ${DS.purple}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${DS.border}` }}>
                    {["Name", "Type", "Min Rank", "Color", "Enabled"].map(h => (
                      <th key={h} style={{ textAlign: "left", padding: "8px 12px", color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.1em", textTransform: "uppercase" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dbEffects.map((e) => (
                    <tr key={e.id} style={{ borderBottom: `1px solid ${DS.border}` }}>
                      <td style={{ padding: "10px 12px", color: DS.text, fontSize: 12, fontWeight: 600 }}>{e.name}</td>
                      <td style={{ padding: "10px 12px", color: DS.text3, fontSize: 12 }}>{e.type}</td>
                      <td style={{ padding: "10px 12px", color: DS.text3, fontSize: 12 }}>{e.minRank}</td>
                      <td style={{ padding: "10px 12px" }}>
                        <div style={{ width: 16, height: 16, borderRadius: "50%", background: e.color, boxShadow: `0 0 6px ${e.color}` }} />
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        <span style={{ color: e.isEnabled ? DS.green : DS.red, fontSize: 11, fontFamily: DS.mono }}>{e.isEnabled ? "ON" : "OFF"}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
