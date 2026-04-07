"use client";

/**
 * Effects Admin Page — LOOP Solutions
 * Route: /admin/effects
 *
 * Full admin interface for rank effects management.
 * 4 tabs: Built-in Effects Library · Addon Effects · Per-member Override · Add Guide
 */
import { useState, type ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import { adminApi } from "@/lib/api/client";
import { DS, GRD } from "@/lib/design-tokens";
import {
  Sparkles, Info, RefreshCw, ToggleLeft, ToggleRight,
  Cpu, Layers, BookOpen,  Edit3, Trash2, Save,
  Plus, X, SparklesIcon as SparkIcon, Eye, 
  Code2, Copy, Check, 
} from "lucide-react";

// ── Shared configs ────────────────────────────────────────────────────────────

const RARITY_CFG = {
  common:    { label: "Phổ thông",    color: DS.text3 },
  rare:      { label: "Hiếm",          color: DS.blue },
  epic:      { label: "Sử thi",        color: DS.purple },
  legendary: { label: "Huyền thoại",  color: DS.amber },
};

const TYPE_CFG: Record<string, { label: string; icon: ReactNode }> = {
  particle: { label: "Particle", icon: <Sparkles size={12} /> },
  glow:     { label: "Glow",     icon: <SparkIcon size={12} /> },
  border:   { label: "Border",   icon: <Layers size={12} /> },
  aura:     { label: "Aura",     icon: <Sparkles size={12} /> },
  badge:    { label: "Badge",    icon: <Sparkles size={12} /> },
  trail:    { label: "Trail",    icon: <Sparkles size={12} /> },
};

const RANK_ORDER = ["iron", "bronze", "silver", "gold", "platinum", "ruby", "diamond"] as const;
type RankKey = typeof RANK_ORDER[number];

const RANK_COLORS: Record<RankKey, string> = {
  iron:     "#9CA3AF",
  bronze:   "#CD7F32",
  silver:   "#CBD5E1",
  gold:     "#FFD700",
  platinum: "#14B8A6",
  ruby:     "#EF4444",
  diamond:  "#818CF8",
};

const RANK_LABELS: Record<RankKey, string> = {
  iron: "Iron", bronze: "Bronze", silver: "Silver", gold: "Gold",
  platinum: "Platinum", ruby: "Ruby", diamond: "Diamond",
};

// ── Built-in Effect Definitions ────────────────────────────────────────────────

interface BuiltinEffect {
  id: string;
  name: string;
  nameVi: string;
  emoji: string;
  rankMin: RankKey;
  ranksActive: RankKey[];
  description: string;
  componentName: string;
  file: string;
  mountCode: string;
  cssKeyframe: string | null;
  layer: 1 | 2 | 3;
}

const BUILTIN_EFFECTS: BuiltinEffect[] = [
  {
    id: "bi-led", name: "LED Runner Border", nameVi: "Viền LED Neon", emoji: "💡",
    rankMin: "iron", ranksActive: [...RANK_ORDER],
    description: "Vệt neon chạy vòng quanh viền card theo đường bo góc. Số lớp và tốc độ tăng theo level. Diamond có 5 lớp + gradient cầu vồng.",
    componentName: "LEDRunner", file: "components/team/LEDRunner.tsx",
    mountCode: "// Ngoài overflow:hidden, cuối MemberCard wrapper\n<LEDRunner member={member} />",
    cssKeyframe: "@keyframes led{id}n{i} CSS được inject động bởi LEDRunner.tsx (useEffect)",
    layer: 2,
  },
  {
    id: "bi-glow", name: "Box Shadow Pulse", nameVi: "Aura Card Glow", emoji: "✨",
    rankMin: "bronze", ranksActive: ["bronze", "silver", "gold", "platinum", "ruby", "diamond"],
    description: "Box-shadow pulse theo keyframe riêng mỗi rank: Bronze soft flow, Silver pulse, Gold 3-layer glow, Platinum teal+purple, Ruby heartbeat, Diamond spectral shift.",
    componentName: "CSS animation (cardStyle)", file: "components/team/MemberCard.tsx",
    mountCode: "// Trong cardStyle object của MemberCard:\nanimation: BOX_SHADOW_ANIM[member.rank],\n\n// BOX_SHADOW_ANIM map:\nconst BOX_SHADOW_ANIM: Record<RankKey, string | undefined> = {\n  iron: undefined,\n  bronze: 'guildBronzeFlow 2.5s ease-in-out infinite',\n  gold: 'guildGoldGlow 2s ease-in-out infinite',\n  ...\n};",
    cssKeyframe: "guildBronzeFlow | guildSilverPulse | guildGoldGlow | guildPlatinumPulse | guildHeartbeat | guildDiamondSpectral",
    layer: 1,
  },
  {
    id: "bi-corner", name: "Corner HUD Deco", nameVi: "Góc HUD Cyberpunk", emoji: "⌗",
    rankMin: "silver", ranksActive: ["silver", "gold", "platinum", "ruby", "diamond"],
    description: "Bốn góc bracket kiểu HUD cyberpunk được vẽ bên ngoài overflow:hidden. Độ sáng tăng khi hover để tạo hiệu ứng scan.",
    componentName: "CornerDeco", file: "components/team/MemberCard.tsx",
    mountCode: "// Ngoài overflow:hidden, cuối MemberCard wrapper\n<CornerDeco color={cfg.color} opacity={hovered ? 1 : 0.5} />",
    cssKeyframe: null,
    layer: 2,
  },
  {
    id: "bi-comet", name: "Gold Comet Line", nameVi: "Tia Sao Chổi Vàng", emoji: "☄️",
    rankMin: "gold", ranksActive: ["gold"],
    description: "Vệt sao chổi quét ngang qua đỉnh card, tạo hiệu ứng tốc độ. Gradient từ transparent → màu rank → transparent, sweep mãi mãi.",
    componentName: "CometLine", file: "components/team/MemberCard.tsx",
    mountCode: "// Bên trong card div, trước avatar section:\nconst hasComet = member.rank === 'gold';\n{hasComet && <CometLine color={cfg.color} />}",
    cssKeyframe: "guildCometSweep",
    layer: 2,
  },
  {
    id: "bi-particles", name: "Floating Rank Particles", nameVi: "Hạt Nổi Rank", emoji: "🌟",
    rankMin: "platinum", ranksActive: ["platinum", "ruby"],
    description: "Các hạt ánh sáng bay từ chân card lên trên theo preset cố định. Platinum 5 hạt, Ruby 6 hạt với nhịp tim nhanh hơn.",
    componentName: "Particles", file: "components/team/MemberCard.tsx",
    mountCode: "// Bên trong card div:\nconst hasParticles = ['platinum', 'ruby'].includes(member.rank);\n{hasParticles && <Particles rank={member.rank} />}",
    cssKeyframe: "guildFloatParticle",
    layer: 2,
  },
  {
    id: "bi-sparks", name: "Ruby Electric Sparks", nameVi: "Tia Điện Ruby", emoji: "⚡",
    rankMin: "ruby", ranksActive: ["ruby"],
    description: "4 tia điện ngang bùng sáng và tắt theo nhịp tim Ruby. Cùng màu với CometLine nhưng orientation ngang ở nhiều vị trí khác nhau.",
    componentName: "ElectricSparks", file: "components/team/MemberCard.tsx",
    mountCode: "// Bên trong card div:\nconst hasSparks = member.rank === 'ruby';\n{hasSparks && <ElectricSparks color={cfg.color} />}",
    cssKeyframe: "guildElectric",
    layer: 2,
  },
  {
    id: "bi-diamond-p", name: "Diamond Prismatic Particles", nameVi: "Hạt Lăng Kính Kim Cương", emoji: "💎",
    rankMin: "diamond", ranksActive: ["diamond"],
    description: "8 hạt đa màu (indigo, cyan, pink, white) bay lên từ chân card. Mỗi hạt có màu riêng tạo hiệu ứng quang phổ ánh sáng lăng kính.",
    componentName: "DiamondParticles", file: "components/team/MemberCard.tsx",
    mountCode: "// Bên trong card div:\nconst hasDiamondFX = member.rank === 'diamond';\n{hasDiamondFX && <DiamondParticles />}",
    cssKeyframe: "guildFloatParticle (dùng chung)",
    layer: 2,
  },
  {
    id: "bi-diamond-prism", name: "Diamond Prism Beams", nameVi: "Tia Sáng Lăng Kính", emoji: "🔮",
    rankMin: "diamond", ranksActive: ["diamond"],
    description: "4 luồng ánh sáng quét chéo xuyên suốt card với màu phổ khác nhau (indigo, cyan, pink, white). Góc nghiêng và delay khác nhau tạo hiệu ứng lăng kính liên tục.",
    componentName: "DiamondPrism", file: "components/team/MemberCard.tsx",
    mountCode: "// Bên trong card div:\n{hasDiamondFX && <DiamondPrism />}",
    cssKeyframe: "guildDiamondBeam",
    layer: 2,
  },
  {
    id: "bi-entrance", name: "Rank Entrance Animation", nameVi: "Hiệu Ứng Xuất Hiện", emoji: "🎬",
    rankMin: "iron", ranksActive: [...RANK_ORDER],
    description: "Mỗi rank có motion khác nhau khi card xuất hiện. Iron: fade. Bronze: slide up. Silver: slide left + scale. Gold: spring bounce. Platinum: rotateX flip. Ruby: spring từ phải. Diamond: zoom out + deblur.",
    componentName: "getRankEntranceProps()", file: "components/team/MemberCard.tsx",
    mountCode: "// Trong component render member card list:\n// Spread props vào motion.div wrapper\nconst entranceProps = getRankEntranceProps(member.rank, index * 0.06);\n<motion.div key={member.id} {...entranceProps}>\n  <MemberCard ... />\n</motion.div>",
    cssKeyframe: null,
    layer: 3,
  },
];

// ── Types ─────────────────────────────────────────────────────────────────────

type RankEffect = {
  id: string;
  name: string;
  description: string;
  type: string;
  unlockRank: RankKey;
  unlockLevel: number;
  rarity: "common" | "rare" | "epic" | "legendary";
  enabled: boolean;
  cssConfig: string;
  color?: string;
  preview: string;
};

// ── Formatters ────────────────────────────────────────────────────────────────

const _fmtLP = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(2)}M` :
  n >= 1_000 ? `${(n / 1_000).toFixed(1)}K` : String(n);

// ── Code Block ────────────────────────────────────────────────────────────────

function CodeBlock({ code, title }: { code: string; title?: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    void navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  const lines = code.split("\n");
  return (
    <div style={{ borderRadius: 12, overflow: "hidden", border: `1px solid ${DS.border}` }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", background: "rgba(0,0,0,0.4)", borderBottom: `1px solid ${DS.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Code2 size={11} style={{ color: DS.text5 }} />
          <span style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono, letterSpacing: "0.12em" }}>{title ?? "REACT · MOTION"}</span>
        </div>
        <button onClick={handleCopy} style={{
          display: "flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 8,
          background: copied ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.06)",
          border: `1px solid ${copied ? "rgba(34,197,94,0.4)" : DS.border}`,
          color: copied ? DS.green : DS.text4, fontSize: 10, cursor: "pointer", fontFamily: DS.mono,
        }}>
          {copied ? <><Check size={10} /> Đã copy</> : <><Copy size={10} /> Copy</>}
        </button>
      </div>
      <div style={{ overflowX: "auto", overflowY: "auto", maxHeight: 260, background: "rgba(0,0,0,0.5)", padding: "12px 16px" }}>
        <pre style={{ margin: 0, fontFamily: DS.mono, fontSize: 11, lineHeight: 1.7, color: DS.text3 }}>
          {lines.map((line, i) => {
            let color: string = DS.text3;
            if (line.trim().startsWith("//")) color = DS.text5;
            else if (line.includes("import ") || line.includes("export ") || line.includes("function ") || line.includes("const ")) color = DS.purple;
            else if (line.includes('"') || line.includes("'")) color = DS.green;
            else if (line.includes("motion") || line.includes("animate") || line.includes("transition") || line.includes("style") || line.includes("keyframes")) color = DS.cyan;
            return (
              <div key={i}>
                <span style={{ color: DS.text5, marginRight: 12, userSelect: "none", fontSize: 9 }}>{String(i + 1).padStart(2, "0")}</span>
                <span style={{ color }}>{line}</span>
              </div>
            );
          })}
        </pre>
      </div>
    </div>
  );
}

// ── Effect Edit Modal ─────────────────────────────────────────────────────────

function EffectEditModal({ effect, onClose, onSave }: {
  effect: RankEffect;
  onClose: () => void;
  onSave: (e: RankEffect) => void;
}) {
  const [draft, setDraft] = useState({ ...effect });
  const inputStyle = {
    width: "100%", background: DS.bgCard2, border: `1px solid ${DS.border}`,
    borderRadius: 8, padding: "8px 12px", color: DS.text, fontSize: 13, outline: "none", boxSizing: "border-box" as const,
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center",
      padding: "1rem", background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)",
    }}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        style={{ width: "100%", maxWidth: "32rem", borderRadius: "1rem", overflow: "hidden", background: DS.bgCard, border: `1px solid ${DS.border}`, maxHeight: "90vh", display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1.25rem", borderBottom: `1px solid ${DS.border}` }}>
          <div style={{ color: DS.text, fontSize: 15, fontWeight: 700 }}>
            {draft.id.startsWith("new") ? "Thêm Addon Effect" : "Chỉnh sửa Addon Effect"}
          </div>
          <button onClick={onClose} style={{ color: DS.text4, background: "none", border: "none", cursor: "pointer" }}><X size={18} /></button>
        </div>
        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, display: "block", marginBottom: 5 }}>TÊN HIỆU ỨNG</label>
            <input value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} style={inputStyle} placeholder="VD: Ruby Aura Surge" />
          </div>
          <div>
            <label style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, display: "block", marginBottom: 5 }}>MÔ TẢ</label>
            <textarea value={draft.description} onChange={e => setDraft({ ...draft, description: e.target.value })} rows={2}
              style={{ ...inputStyle, resize: "vertical" as const, fontFamily: DS.body }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div>
              <label style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, display: "block", marginBottom: 5 }}>LOẠI</label>
              <select value={draft.type} onChange={e => setDraft({ ...draft, type: e.target.value })} style={inputStyle}>
                {Object.entries(TYPE_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div>
              <label style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, display: "block", marginBottom: 5 }}>ĐỘ HIẾM</label>
              <select value={draft.rarity} onChange={e => setDraft({ ...draft, rarity: e.target.value as RankEffect["rarity"] })} style={inputStyle}>
                {Object.entries(RARITY_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div>
              <label style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, display: "block", marginBottom: 5 }}>MỞ KHÓA TẠI RANK</label>
              <select value={draft.unlockRank} onChange={e => setDraft({ ...draft, unlockRank: e.target.value as RankKey })} style={inputStyle}>
                {RANK_ORDER.map(r => <option key={r} value={r}>{RANK_LABELS[r]}</option>)}
              </select>
            </div>
            <div>
              <label style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, display: "block", marginBottom: 5 }}>MỞ KHÓA TẠI LEVEL</label>
              <input type="number" value={draft.unlockLevel} onChange={e => setDraft({ ...draft, unlockLevel: Number(e.target.value) })} style={inputStyle} />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div>
              <label style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, display: "block", marginBottom: 5 }}>ICON PREVIEW (emoji)</label>
              <input value={draft.preview} onChange={e => setDraft({ ...draft, preview: e.target.value })} style={{ ...inputStyle, fontSize: 22, textAlign: "center" as const }} />
            </div>
            <div>
              <label style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, display: "block", marginBottom: 5 }}>MÀU SẮC (hex, tùy chọn)</label>
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <input value={draft.color ?? ""} onChange={e => setDraft({ ...draft, color: e.target.value || undefined })}
                  placeholder={RANK_COLORS[draft.unlockRank]}
                  style={{ ...inputStyle, flex: 1, fontFamily: DS.mono, color: draft.color ?? RANK_COLORS[draft.unlockRank] }} />
                {draft.color && <div style={{ width: 38, height: 38, borderRadius: 8, background: draft.color, border: `1px solid ${DS.border}`, flexShrink: 0 }} />}
              </div>
            </div>
          </div>
          <div>
            <label style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, display: "block", marginBottom: 5 }}>CẤU HÌNH (config string)</label>
            <textarea value={draft.cssConfig} onChange={e => setDraft({ ...draft, cssConfig: e.target.value })} rows={2}
              placeholder="VD: count: 10; speed: 2s; neon: true"
              style={{ ...inputStyle, resize: "vertical" as const, fontFamily: DS.mono, fontSize: 12 }} />
          </div>
        </div>
        {/* Footer */}
        <div style={{ display: "flex", gap: "0.75rem", padding: "1.25rem", borderTop: `1px solid ${DS.border}` }}>
          <button onClick={onClose} style={{ flex: 1, background: "none", border: `1px solid ${DS.border}`, borderRadius: 10, padding: "10px", color: DS.text3, fontSize: 13, cursor: "pointer" }}>Hủy</button>
          <button onClick={() => onSave(draft)}
            style={{ flex: 1, background: GRD.primary, color: "#fff", border: "none", borderRadius: 10, padding: "10px", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <Save size={14} /> Lưu hiệu ứng
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Tab 1: Built-in Effects ──────────────────────────────────────────────────

function BuiltinTab() {
  const [selected, setSelected] = useState<BuiltinEffect>(BUILTIN_EFFECTS[0]);

  const layerColors: Record<number, string> = { 1: DS.amber, 2: DS.blue, 3: DS.purple };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1.25rem", alignItems: "start" }}>
      {/* Header + Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "0.75rem" }}>
        {[
          { label: "Hiệu ứng tích hợp", value: BUILTIN_EFFECTS.length, color: DS.blue },
          { label: "Ranks hỗ trợ", value: RANK_ORDER.length, color: DS.purple },
          { label: "CSS Keyframes", value: BUILTIN_EFFECTS.filter(e => e.cssKeyframe).length, color: DS.amber },
          { label: "React Components", value: BUILTIN_EFFECTS.filter(e => e.layer === 2).length, color: DS.green },
        ].map(s => (
          <div key={s.label} style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 12, padding: "1rem" }}>
            <div style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.1em", marginBottom: "0.5rem" }}>{s.label}</div>
            <div style={{ color: s.color, fontFamily: DS.heading, fontSize: 24, fontWeight: 700 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Effects list */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
          <span style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.15em" }}>── 9 HIỆU ỨNG TÍCH HỢP</span>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            {[1, 2, 3].map(l => (
              <span key={l} style={{ color: layerColors[l], background: `${layerColors[l]}12`, border: `1px solid ${layerColors[l]}25`, borderRadius: 4, padding: "1px 7px", fontSize: 9, fontFamily: DS.mono }}>
                {l === 1 ? "CSS KF" : l === 2 ? "Component" : "Motion"}
              </span>
            ))}
          </div>
        </div>

        {BUILTIN_EFFECTS.map(eff => {
          const isSelected = selected.id === eff.id;
          const rankColor = RANK_COLORS[eff.rankMin];
          const lc = layerColors[eff.layer];
          return (
            <motion.div key={eff.id} onClick={() => setSelected(eff)}
              style={{
                background: isSelected ? `${rankColor}08` : DS.bgCard,
                border: `1px solid ${isSelected ? `${rankColor}50` : DS.border}`,
                borderRadius: 12, padding: "0.875rem", cursor: "pointer",
                display: "flex", gap: "0.75rem", alignItems: "flex-start",
              }}
              whileHover={{ borderColor: `${rankColor}35`, x: 3 }}>
              <span style={{ fontSize: 22, flexShrink: 0 }}>{eff.emoji}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.25rem" }}>
                  <span style={{ color: DS.text, fontSize: 13, fontWeight: 700 }}>{eff.nameVi}</span>
                  <span style={{ color: rankColor, fontSize: 9, fontFamily: DS.mono }}>{eff.rankMin.toUpperCase()}+</span>
                  <span style={{ color: lc, background: `${lc}12`, border: `1px solid ${lc}25`, borderRadius: 4, padding: "1px 6px", fontSize: 8, fontFamily: DS.mono }}>
                    {eff.layer === 1 ? "CSS KF" : eff.layer === 2 ? "Component" : "Motion"}
                  </span>
                </div>
                <div style={{ color: DS.text4, fontSize: 11, marginBottom: "0.5rem", lineHeight: 1.5 }}>
                  {eff.description.slice(0, 90)}{eff.description.length > 90 ? "…" : ""}
                </div>
                <div style={{ display: "flex", gap: "0.25rem" }}>
                  {eff.ranksActive.slice(0, 6).map(rk => (
                    <span key={rk} style={{ color: RANK_COLORS[rk], fontSize: 11 }}>⬡</span>
                  ))}
                </div>
              </div>
              <div style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono, textAlign: "right", flexShrink: 0, marginTop: 2 }}>
                <div style={{ color: isSelected ? DS.blue : DS.text5, fontSize: 10 }}>{eff.componentName}</div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Detail panel */}
      <div style={{
        background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 12, padding: "1.5rem",
        display: "flex", flexDirection: "column", gap: "1rem",
      }}>
        <AnimatePresence mode="wait">
          <motion.div key={selected.id} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <span style={{ fontSize: 28 }}>{selected.emoji}</span>
              <div>
                <div style={{ color: DS.text, fontSize: 16, fontWeight: 700 }}>{selected.nameVi}</div>
                <div style={{ color: DS.text4, fontSize: 11 }}>{selected.name}</div>
              </div>
              <div style={{ marginLeft: "auto", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.25rem" }}>
                <span style={{
                  color: layerColors[selected.layer], background: `${layerColors[selected.layer]}12`,
                  border: `1px solid ${layerColors[selected.layer]}25`, borderRadius: 6, padding: "2px 8px",
                  fontSize: 9, fontFamily: DS.mono,
                }}>
                  {selected.layer === 1 ? "CSS Keyframe" : selected.layer === 2 ? "React Component" : "Motion Props"}
                </span>
              </div>
            </div>

            {/* Description */}
            <div style={{ background: DS.bgCard2, border: `1px solid ${DS.border}`, borderRadius: 10, padding: "0.75rem" }}>
              <div style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono, letterSpacing: "0.12em", marginBottom: "0.5rem" }}>MÔ TẢ HIỆU ỨNG</div>
              <p style={{ color: DS.text3, fontSize: 12, lineHeight: 1.65, margin: 0 }}>{selected.description}</p>
            </div>

            {/* Ranks active */}
            <div>
              <div style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono, letterSpacing: "0.12em", marginBottom: "0.5rem" }}>ACTIVE TẠI RANK</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                {RANK_ORDER.map(rk => {
                  const active = selected.ranksActive.includes(rk);
                  return (
                    <span key={rk} style={{
                      color: active ? RANK_COLORS[rk] : DS.text5,
                      background: active ? `${RANK_COLORS[rk]}12` : "rgba(255,255,255,0.02)",
                      border: `1px solid ${active ? `${RANK_COLORS[rk]}40` : DS.border}`,
                      borderRadius: 6, padding: "3px 9px", fontSize: 9, fontFamily: DS.mono,
                      opacity: active ? 1 : 0.4,
                    }}>
                      ⬡ {RANK_LABELS[rk]}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* File location */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.75rem", background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: 10 }}>
              <Cpu size={13} style={{ color: DS.blue, flexShrink: 0 }} />
              <div>
                <div style={{ color: DS.blue, fontSize: 10, fontFamily: DS.mono, fontWeight: 700 }}>VỊ TRÍ FILE</div>
                <div style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, marginTop: 2 }}>/{selected.file}</div>
              </div>
            </div>

            {/* Mount code */}
            <div>
              <div style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono, letterSpacing: "0.12em", marginBottom: "0.5rem" }}>CÁCH MOUNT TRONG MEMBERCARD</div>
              <CodeBlock code={selected.mountCode} title="MemberCard.tsx" />
            </div>

            {/* CSS keyframe note */}
            {selected.cssKeyframe && (
              <div style={{ padding: "0.75rem", background: `${DS.amber}08`, border: `1px solid ${DS.amber}20`, borderRadius: 10 }}>
                <div style={{ color: DS.amber, fontSize: 10, fontFamily: DS.mono, marginBottom: "0.5rem" }}>⚡ CSS KEYFRAME</div>
                <div style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono }}>{selected.cssKeyframe}</div>
                <div style={{ color: DS.text5, fontSize: 10, marginTop: "0.5rem" }}>Định nghĩa trong <code style={{ color: DS.cyan, fontFamily: DS.mono }}>GUILD_ANIMATIONS_CSS</code> cuối MemberCard.tsx</div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// ── Tab 2: Addon Effects ───────────────────────────────────────────────────────

function AddonEffectsTab({ effects, onUpdate }: {
  effects: RankEffect[];
  onUpdate: (effs: RankEffect[]) => void;
}) {
  const [editingEffect, setEditingEffect] = useState<RankEffect | null>(null);
  const [previewEffect, setPreviewEffect] = useState<RankEffect | null>(effects[0] ?? null);

  const handleSave = (e: RankEffect) => {
    const exists = effects.find(ef => ef.id === e.id);
    if (exists) {
      onUpdate(effects.map(ef => ef.id === e.id ? e : ef));
    } else {
      onUpdate([...effects, e]);
    }
    setEditingEffect(null);
    setPreviewEffect(e);
  };

  const toggleEffect = (id: string) => {
    onUpdate(effects.map(e => e.id === id ? { ...e, enabled: !e.enabled } : e));
  };

  const deleteEffect = (id: string) => {
    onUpdate(effects.filter(e => e.id !== id));
    if (previewEffect?.id === id) setPreviewEffect(effects.find(e => e.id !== id) ?? null);
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1.25rem" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.15em" }}>── ADDON EFFECTS (quản lý qua admin)</span>
        <button onClick={() => setEditingEffect({ id: `new-${Date.now()}`, name: "", description: "", type: "particle", unlockRank: "iron", unlockLevel: 1, enabled: true, cssConfig: "", preview: "✨", rarity: "common" })}
          style={{ background: GRD.primary, color: "#fff", border: "none", borderRadius: 10, padding: "7px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
          <Plus size={12} /> Thêm hiệu ứng
        </button>
      </div>

      {/* Effects list */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxHeight: 580, overflowY: "auto" }}>
        {effects.map(eff => {
          const rc = RANK_COLORS[eff.unlockRank];
          const rr = RARITY_CFG[eff.rarity];
          const tc = TYPE_CFG[eff.type] ?? { label: eff.type, icon: null };
          const isSelected = previewEffect?.id === eff.id;
          return (
            <motion.div key={eff.id}
              style={{
                background: isSelected ? `${rc}10` : DS.bgCard,
                border: `1px solid ${isSelected ? `${rc}40` : eff.enabled ? DS.border : `${DS.red}20`}`,
                borderRadius: 12, padding: "0.75rem", cursor: "pointer",
                display: "flex", alignItems: "center", gap: "0.75rem",
                opacity: eff.enabled ? 1 : 0.55,
              }}
              onClick={() => setPreviewEffect(eff)}
              whileHover={{ borderColor: `${rc}40` }}>
              <div style={{ fontSize: 20, flexShrink: 0, width: 32, textAlign: "center" }}>{eff.preview}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                  <span style={{ color: DS.text, fontSize: 13, fontWeight: 700 }}>{eff.name}</span>
                  <span style={{ color: rr.color, fontSize: 9, fontFamily: DS.mono, border: `1px solid ${rr.color}30`, padding: "1px 5px", borderRadius: 4, background: `${rr.color}10` }}>{rr.label}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <span style={{ color: DS.text5, fontSize: 10 }}>{tc.label}</span>
                  <span style={{ color: rc, fontSize: 10, fontFamily: DS.mono }}>{eff.unlockRank.toUpperCase()} Lv.{eff.unlockLevel}+</span>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", flexShrink: 0 }}>
                <button onClick={e => { e.stopPropagation(); toggleEffect(eff.id); }}
                  style={{ color: eff.enabled ? DS.green : DS.text5, background: "none", border: `1px solid ${DS.border}`, borderRadius: 6, padding: "4px 8px", cursor: "pointer", fontSize: 10, display: "flex", alignItems: "center", gap: 3 }}>
                  {eff.enabled ? <><ToggleRight size={13} /> Bật</> : <><ToggleLeft size={13} /> Tắt</>}
                </button>
                <button onClick={e => { e.stopPropagation(); setEditingEffect(eff); }}
                  style={{ color: DS.blue, background: `${DS.blue}12`, border: `1px solid ${DS.blue}25`, borderRadius: 6, padding: "4px 7px", cursor: "pointer" }}>
                  <Edit3 size={11} />
                </button>
                <button onClick={e => { e.stopPropagation(); deleteEffect(eff.id); }}
                  style={{ color: DS.red, background: `${DS.red}10`, border: `1px solid ${DS.red}20`, borderRadius: 6, padding: "4px 7px", cursor: "pointer" }}>
                  <Trash2 size={11} />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Info */}
      <div style={{ padding: "1rem", background: `${DS.blue}06`, border: `1px solid ${DS.blue}18`, borderRadius: 12 }}>
        <div style={{ color: DS.blue, fontSize: 11, fontFamily: DS.mono, marginBottom: "0.5rem" }}>💡 Addon Effects dùng EffectRenderer</div>
        <div style={{ color: DS.text4, fontSize: 12, lineHeight: 1.6 }}>
          Addon Effects được render qua component <code style={{ color: DS.cyan, fontFamily: DS.mono, background: `${DS.cyan}10`, padding: "1px 5px", borderRadius: 3 }}>{"<EffectRenderer>"}</code> từ <code style={{ color: DS.purple, fontFamily: DS.mono }}>ui/EffectRenderer.tsx</code>.
        </div>
      </div>

      <AnimatePresence>
        {editingEffect && (
          <EffectEditModal effect={editingEffect} onClose={() => setEditingEffect(null)} onSave={handleSave} />
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Tab 3: Add New Effect Guide ────────────────────────────────────────────────

const ADD_GUIDE_STEPS = [
  {
    num: 1, label: "CSS Keyframe",
    file: "components/team/MemberCard.tsx",
    color: DS.amber,
    description: "Thêm @keyframe vào chuỗi GUILD_ANIMATIONS_CSS. Chuỗi này được inject vào <style> trong Home.tsx và MemberDetailPage.tsx.",
    code: `// Tìm export const GUILD_ANIMATIONS_CSS = \`...\` ở cuối file\n// Thêm keyframe mới vào trong chuỗi:\n\nexport const GUILD_ANIMATIONS_CSS = \`\n  /* ... các keyframes hiện có ... */\n\n  @keyframes myNewEffect {\n    0%   { opacity: 0; transform: scale(0.8); }\n    50%  { opacity: 1; transform: scale(1.1); }\n    100% { opacity: 0; transform: scale(0.8); }\n  }\n\`;`,
  },
  {
    num: 2, label: "React Component",
    file: "components/team/MemberCard.tsx",
    color: DS.blue,
    description: "Tạo component React mới trong MemberCard.tsx.",
    code: `// Thêm ngay trước "// ── Main MemberCard ──" comment\n\nexport function MyNewEffect({ color }: { color: string }) {\n  return (\n    <div\n      style={{\n        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 30,\n        animation: 'myNewEffect 2s ease-in-out infinite',\n      }}\n    />\n  );\n}`,
  },
  {
    num: 3, label: "Mount trong MemberCard",
    file: "components/team/MemberCard.tsx",
    color: DS.green,
    description: "Thêm điều kiện render vào trong thân MemberCard.",
    code: `// Bên trong function MemberCard({ member, onClick }) {\n\n  // 1. Thêm điều kiện (dựa theo rank, level, hoặc cả hai)\n  const hasMyNewFX = member.rank === 'platinum' && member.level >= 80;\n\n  // 2. Mount bên trong <div style={cardStyle}>:\n  return (\n    <motion.div ...>\n      <div style={cardStyle}>\n        {hasComet && <CometLine color={cfg.color} />}   // đã có\n        {hasMyNewFX && <MyNewEffect color={cfg.color} />}  // ← THÊM ĐÂY\n        ...\n      </div>\n    </motion.div>\n  );`,
  },
  {
    num: 4, label: "Đăng ký Addon Effect (tùy chọn)",
    file: "store/loopStore.ts",
    color: DS.purple,
    description: "Nếu muốn hiệu ứng có thể toggle per-member qua admin, đăng ký vào INIT_EFFECTS trong loopStore.",
    code: `// Tìm const INIT_EFFECTS: RankEffect[] = [ trong loopStore.ts\n// Thêm entry mới:\n\n{\n  id: 'eff-NEW',\n  name: 'My New Effect',\n  description: 'Mô tả hiệu ứng của bạn',\n  type: 'particle',\n  unlockRank: 'platinum',\n  unlockLevel: 80,\n  enabled: true,\n  cssConfig: 'count: 8; speed: 2s; color: #14B8A6',\n  preview: '🌊',\n  rarity: 'epic',\n},`,
  },
  {
    num: 5, label: "Inject CSS vào trang mới (nếu cần)",
    file: "Home.tsx / MemberDetailPage.tsx",
    color: DS.cyan,
    description: "Đảm bảo GUILD_ANIMATIONS_CSS được inject ở trang sử dụng.",
    code: `// Trong component trang:\nimport { GUILD_ANIMATIONS_CSS } from './components/team/MemberCard';\n\n// Option A: JSX inline\nreturn (\n  <div>\n    <style>{GUILD_ANIMATIONS_CSS}</style>\n    {/* ... */}\n  </div>\n);\n\n// Option B: useEffect + document.head\nuseEffect(() => {\n  const el = document.createElement('style');\n  el.id = 'guild-animations';\n  el.textContent = GUILD_ANIMATIONS_CSS;\n  document.head.appendChild(el);\n  return () => el.remove();\n}, []);`,
  },
];

function AddGuideTab() {
  const [expandedStep, setExpandedStep] = useState<number | null>(1);

  return (
    <div style={{ maxWidth: "48rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* Architecture overview */}
      <div style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 12, padding: "1.25rem" }}>
        <div style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.15em", marginBottom: "1rem" }}>── KIẾN TRÚC HỆ THỐNG HIỆU ỨNG (4 LAYERS)</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "0.75rem" }}>
          {[
            { layer: 1, name: "CSS Keyframes", desc: "GUILD_ANIMATIONS_CSS string trong MemberCard", color: DS.amber, icon: "⚡" },
            { layer: 2, name: "React Components", desc: "CometLine, Particles, DiamondPrism... trong MemberCard", color: DS.blue, icon: "⚛" },
            { layer: 3, name: "Motion Props", desc: "getRankEntranceProps() per-rank entrance animations", color: DS.purple, icon: "🎬" },
            { layer: 4, name: "Addon Store", desc: "loopStore INIT_EFFECTS → EffectRenderer", color: DS.green, icon: "🔌" },
          ].map(l => (
            <div key={l.layer} style={{ background: DS.bgCard2, border: `1px solid ${l.color}20`, borderRadius: 10, padding: "0.75rem" }}>
              <div style={{ fontSize: 24, marginBottom: "0.5rem" }}>{l.icon}</div>
              <div style={{ color: l.color, fontSize: 11, fontFamily: DS.mono, fontWeight: 700, marginBottom: "0.25rem" }}>Layer {l.layer}: {l.name}</div>
              <div style={{ color: DS.text4, fontSize: 11, lineHeight: 1.5 }}>{l.desc}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: "1rem", padding: "0.75rem", background: `${DS.blue}06`, border: `1px solid ${DS.blue}18`, borderRadius: 10, display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
          <Info size={14} style={{ color: DS.blue, flexShrink: 0, marginTop: 2 }} />
          <div style={{ color: DS.text4, fontSize: 12, lineHeight: 1.6 }}>
            Layer 1–3 là <strong style={{ color: DS.text3 }}>hardcode</strong> — hiệu ứng luôn có mặt theo rank. Layer 4 là <strong style={{ color: DS.text3 }}>plugin-style</strong> — thêm qua loopStore, toggle per-member, preview qua EffectRenderer.
          </div>
        </div>
      </div>

      {/* Steps */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {ADD_GUIDE_STEPS.map(step => (
          <div key={step.num} style={{
            background: DS.bgCard, border: `1px solid ${expandedStep === step.num ? `${step.color}40` : DS.border}`,
            borderRadius: 12, overflow: "hidden",
          }}>
            <button onClick={() => setExpandedStep(expandedStep === step.num ? null : step.num)}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: "1rem", padding: "1rem",
                background: "none", border: "none", cursor: "pointer", textAlign: "left",
              }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                background: `${step.color}15`, border: `1px solid ${step.color}30`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <span style={{ color: step.color, fontFamily: DS.mono, fontSize: 14, fontWeight: 700 }}>{step.num}</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ color: step.color, fontSize: 13, fontWeight: 700 }}>Step {step.num}: {step.label}</div>
                <div style={{ color: DS.text5, fontSize: 11, fontFamily: DS.mono, marginTop: 2 }}>/{step.file}</div>
              </div>
              <div style={{ color: DS.text5 }}>
                {expandedStep === step.num ? <svg width="16" height="16" viewBox="0 0 16 16"><path d="M3 10l5-5 5 5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" /></svg> : <svg width="16" height="16" viewBox="0 0 16 16"><path d="M3 6l5 5 5-5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" /></svg>}
              </div>
            </button>
            <AnimatePresence>
              {expandedStep === step.num && (
                <motion.div
                  initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
                  style={{ overflow: "hidden" }}>
                  <div style={{ padding: "0 1rem 1rem", borderTop: `1px solid ${DS.border}`, paddingTop: "0.75rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
                      <span style={{ color: step.color, fontSize: 12, flexShrink: 0, marginTop: 2 }}>→</span>
                      <p style={{ color: DS.text3, fontSize: 13, lineHeight: 1.65, margin: 0 }}>{step.description}</p>
                    </div>
                    <CodeBlock code={step.code} title={step.file} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function EffectsPage() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<"builtin" | "addon" | "guide">("builtin");
  const [effects, setEffects] = useState<RankEffect[]>([
    { id: "eff-1", name: "Ruby Aura Surge", description: "Aura màu ruby bùng nổ khi đạt rank Ruby", type: "aura", unlockRank: "ruby", unlockLevel: 95, rarity: "epic", enabled: true, cssConfig: "count: 6; speed: 1.5s; neon: true", preview: "💥", color: "#EF4444" },
    { id: "eff-2", name: "Platinum Shimmer", description: "Lớp shimmer màu platinum lấp lánh", type: "shimmer", unlockRank: "platinum", unlockLevel: 75, rarity: "epic", enabled: true, cssConfig: "count: 12; speed: 2s", preview: "✨", color: "#14B8A6" },
    { id: "eff-3", name: "Gold Crown Glow", description: "Aura glow màu vàng hoàng gia", type: "glow", unlockRank: "gold", unlockLevel: 55, rarity: "rare", enabled: true, cssConfig: "count: 8; speed: 2.5s", preview: "👑", color: "#FFD700" },
  ]);

  const enabledCount = effects.filter(e => e.enabled).length;

  // Fetch DB effects
  const { data: dbData } = useQuery({
    queryKey: ["admin", "effects"],
    queryFn: () => adminApi.get<{ data: RankEffect[] }>("/api/admin/effects", { params: {} }),
  });

  // Persist to DB on change
  useMutation({
    mutationFn: (effs: RankEffect[]) =>
      adminApi.post("/api/admin/effects/bulk", { effects: effs }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "effects"] }),
  });

  const dbEffects = dbData?.data ?? [];
  const allEffects = dbEffects.length > 0 ? dbEffects : effects;

  const TABS = [
    { id: "builtin" as const, label: "Hiệu ứng tích hợp", icon: <Cpu size={13} />, badge: BUILTIN_EFFECTS.length },
    { id: "addon" as const, label: "Addon Effects", icon: <Sparkles size={13} />, badge: allEffects.length },
    { id: "guide" as const, label: "Hướng dẫn thêm mới", icon: <BookOpen size={13} />, badge: null },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h2 style={{ fontFamily: DS.heading, fontSize: 20, fontWeight: 800, color: DS.text, margin: "0 0 4px" }}>
            Quản lý Hiệu ứng Rank
          </h2>
          <p style={{ color: DS.text4, fontSize: 12, fontFamily: DS.mono, margin: 0 }}>
            {BUILTIN_EFFECTS.length} hiệu ứng tích hợp · {allEffects.length} addon · {enabledCount} đang bật
          </p>
        </div>
        <button
          onClick={() => qc.invalidateQueries({ queryKey: ["admin", "effects"] })}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 10, color: DS.text3, cursor: "pointer", fontSize: 12, fontFamily: DS.mono }}
        >
          <RefreshCw size={13} /> Làm mới
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "0.75rem" }}>
        {[
          { label: "Hiệu ứng tích hợp", value: BUILTIN_EFFECTS.length, color: DS.blue, icon: <Cpu size={16} /> },
          { label: "Addon Effects", value: allEffects.length, color: DS.purple, icon: <Sparkles size={16} /> },
          { label: "Addon đang bật", value: enabledCount, color: DS.green, icon: <Eye size={16} /> },
          { label: "CSS Keyframes", value: BUILTIN_EFFECTS.filter(e => e.cssKeyframe).length, color: DS.amber, icon: <Layers size={16} /> },
        ].map(s => (
          <div key={s.label} style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 12, padding: "1rem" }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "0.75rem", background: `${s.color}15`, border: `1px solid ${s.color}25` }}>
              <span style={{ color: s.color }}>{s.icon}</span>
            </div>
            <div style={{ color: s.color, fontFamily: DS.heading, fontSize: 22, fontWeight: 700 }}>{s.value}</div>
            <div style={{ color: DS.text3, fontSize: 12, marginTop: "0.25rem" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            style={{
              display: "flex", alignItems: "center", gap: "0.5rem", padding: "8px 16px", borderRadius: 10,
              background: activeTab === tab.id ? "rgba(59,130,246,0.12)" : "rgba(255,255,255,0.03)",
              border: `1px solid ${activeTab === tab.id ? `${DS.blue}40` : DS.border}`,
              color: activeTab === tab.id ? DS.blue : DS.text3, fontSize: 12, cursor: "pointer",
            }}>
            {tab.icon} {tab.label}
            {tab.badge !== null && (
              <span style={{
                background: activeTab === tab.id ? DS.blue : DS.border,
                color: activeTab === tab.id ? "#fff" : DS.text5, borderRadius: 99,
                padding: "0 6px", fontSize: 9, fontFamily: DS.mono,
              }}>
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}>
          {activeTab === "builtin" && <BuiltinTab />}
          {activeTab === "addon" && <AddonEffectsTab effects={allEffects} onUpdate={setEffects} />}
          {activeTab === "guide" && <AddGuideTab />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
