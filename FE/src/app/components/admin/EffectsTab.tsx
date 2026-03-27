/**
 * EffectsTab — Quản lý hiệu ứng rank LOOP OS
 *
 * 4 tab:
 *  1. Hiệu ứng tích hợp  — 9 hiệu ứng hardcode từ MemberCard, preview THẬT
 *  2. Addon Effects       — loopStore custom effects + EffectRenderer
 *  3. Theo thành viên     — modal "Quản lý" hoạt động thật
 *  4. Hướng dẫn thêm mới — kiến trúc 4 lớp + code guide
 */
import { useState, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles, Eye, EyeOff, Plus, Edit3, Trash2, X, Save,
  Zap, Shield, Crown, Award, Star, Users, Code2,
  ChevronDown, ChevronUp, ToggleLeft, ToggleRight,
  Copy, Check, Monitor, BookOpen, Layers, Cpu,
  ChevronRight, Info, Lock,
} from 'lucide-react';
import { DS, GRD } from '../layout/ds';
import { RANKS, type RankKey, members } from '../team/memberData';
import { useLoopStore, type RankEffect } from '../../store/loopStore';
import { EffectRenderer } from '../ui/EffectRenderer';
import {
  GUILD_ANIMATIONS_CSS,
  CometLine, ElectricSparks, Particles,
  DiamondParticles, DiamondPrism, CornerDeco,
  BOX_SHADOW_ANIM, MemberCard,
} from '../team/MemberCard';
import { LEDRunner } from '../team/LEDRunner';

// ── Shared configs ──────────────────────────────────────────────────────────

export const RARITY_CFG = {
  common:    { label: 'Phổ thông',    color: DS.text3 },
  rare:      { label: 'Hiếm',          color: DS.blue },
  epic:      { label: 'Sử thi',        color: DS.purple },
  legendary: { label: 'Huyền thoại',  color: DS.amber },
};

export const TYPE_CFG: Record<string, { label: string; icon: ReactNode }> = {
  particle: { label: 'Particle', icon: <Sparkles size={12} /> },
  glow:     { label: 'Glow',     icon: <Zap size={12} /> },
  border:   { label: 'Border',   icon: <Shield size={12} /> },
  aura:     { label: 'Aura',     icon: <Crown size={12} /> },
  badge:    { label: 'Badge',    icon: <Award size={12} /> },
  trail:    { label: 'Trail',    icon: <Star size={12} /> },
};

export const RANK_ORDER: RankKey[] = ['iron', 'bronze', 'silver', 'gold', 'platinum', 'ruby', 'diamond'];

// ── Built-in Effect Definitions (9 hiệu ứng từ MemberCard) ─────────────────

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
    id: 'bi-led', name: 'LED Runner Border', nameVi: 'Viền LED Neon', emoji: '💡',
    rankMin: 'iron', ranksActive: RANK_ORDER,
    description: 'Vệt neon chạy vòng quanh viền card theo đường bo góc. Số lớp và tốc độ tăng theo level. Diamond có 5 lớp + gradient cầu vồng.',
    componentName: 'LEDRunner', file: 'components/team/LEDRunner.tsx',
    mountCode: '// Ngoài overflow:hidden, cuối MemberCard wrapper\n<LEDRunner member={member} />',
    cssKeyframe: '@keyframes led{id}n{i} CSS được inject động bởi LEDRunner.tsx (useEffect)',
    layer: 2,
  },
  {
    id: 'bi-glow', name: 'Box Shadow Pulse', nameVi: 'Aura Card Glow', emoji: '✨',
    rankMin: 'bronze', ranksActive: ['bronze', 'silver', 'gold', 'platinum', 'ruby', 'diamond'],
    description: 'Box-shadow pulse theo keyframe riêng mỗi rank: Bronze soft flow, Silver pulse, Gold 3-layer glow, Platinum teal+purple, Ruby heartbeat, Diamond spectral shift.',
    componentName: 'CSS animation (cardStyle)', file: 'components/team/MemberCard.tsx',
    mountCode: '// Trong cardStyle object của MemberCard:\nanimation: BOX_SHADOW_ANIM[member.rank],\n\n// BOX_SHADOW_ANIM map:\nconst BOX_SHADOW_ANIM: Record<RankKey, string | undefined> = {\n  iron:     undefined,\n  bronze:   \'guildBronzeFlow 2.5s ease-in-out infinite\',\n  gold:     \'guildGoldGlow 2s ease-in-out infinite\',\n  ...\n};',
    cssKeyframe: 'guildBronzeFlow | guildSilverPulse | guildGoldGlow | guildPlatinumPulse | guildHeartbeat | guildDiamondSpectral',
    layer: 1,
  },
  {
    id: 'bi-corner', name: 'Corner HUD Deco', nameVi: 'Góc HUD Cyberpunk', emoji: '⌗',
    rankMin: 'silver', ranksActive: ['silver', 'gold', 'platinum', 'ruby', 'diamond'],
    description: 'Bốn góc bracket kiểu HUD cyberpunk được vẽ bên ngoài overflow:hidden. Độ sáng tăng khi hover để tạo hiệu ứng scan.',
    componentName: 'CornerDeco', file: 'components/team/MemberCard.tsx',
    mountCode: '// Ngoài overflow:hidden, cuối MemberCard wrapper\n<CornerDeco color={cfg.color} opacity={hovered ? 1 : 0.5} />',
    cssKeyframe: null,
    layer: 2,
  },
  {
    id: 'bi-comet', name: 'Gold Comet Line', nameVi: 'Tia Sao Chổi Vàng', emoji: '☄️',
    rankMin: 'gold', ranksActive: ['gold'],
    description: 'Vệt sao chổi quét ngang qua đỉnh card, tạo hiệu ứng tốc độ. Gradient từ transparent → màu rank → transparent, sweep mãi mãi.',
    componentName: 'CometLine', file: 'components/team/MemberCard.tsx',
    mountCode: '// Bên trong card div, trước avatar section:\nconst hasComet = member.rank === \'gold\';\n{hasComet && <CometLine color={cfg.color} />}',
    cssKeyframe: 'guildCometSweep',
    layer: 2,
  },
  {
    id: 'bi-particles', name: 'Floating Rank Particles', nameVi: 'Hạt Nổi Rank', emoji: '🌟',
    rankMin: 'platinum', ranksActive: ['platinum', 'ruby'],
    description: 'Các hạt ánh sáng bay từ chân card lên trên theo preset cố định (không random → không flicker). Platinum 5 hạt, Ruby 6 hạt với nhịp tim nhanh hơn.',
    componentName: 'Particles', file: 'components/team/MemberCard.tsx',
    mountCode: '// Bên trong card div:\nconst hasParticles = [\'platinum\', \'ruby\'].includes(member.rank);\n{hasParticles && <Particles rank={member.rank} />}',
    cssKeyframe: 'guildFloatParticle',
    layer: 2,
  },
  {
    id: 'bi-sparks', name: 'Ruby Electric Sparks', nameVi: 'Tia Điện Ruby', emoji: '⚡',
    rankMin: 'ruby', ranksActive: ['ruby'],
    description: '4 tia điện ngang bùng sáng và tắt theo nhịp tim Ruby. Cùng màu với CometLine nhưng orientation ngang ở nhiều vị trí khác nhau.',
    componentName: 'ElectricSparks', file: 'components/team/MemberCard.tsx',
    mountCode: '// Bên trong card div:\nconst hasSparks = member.rank === \'ruby\';\n{hasSparks && <ElectricSparks color={cfg.color} />}',
    cssKeyframe: 'guildElectric',
    layer: 2,
  },
  {
    id: 'bi-diamond-p', name: 'Diamond Prismatic Particles', nameVi: 'Hạt Lăng Kính Kim Cương', emoji: '💎',
    rankMin: 'diamond', ranksActive: ['diamond'],
    description: '8 hạt đa màu (indigo, cyan, pink, white) bay lên từ chân card. Mỗi hạt có màu riêng tạo hiệu ứng quang phổ ánh sáng lăng kính.',
    componentName: 'DiamondParticles', file: 'components/team/MemberCard.tsx',
    mountCode: '// Bên trong card div:\nconst hasDiamondFX = member.rank === \'diamond\';\n{hasDiamondFX && <DiamondParticles />}',
    cssKeyframe: 'guildFloatParticle (dùng chung)',
    layer: 2,
  },
  {
    id: 'bi-diamond-prism', name: 'Diamond Prism Beams', nameVi: 'Tia Sáng Lăng Kính', emoji: '🔮',
    rankMin: 'diamond', ranksActive: ['diamond'],
    description: '4 luồng ánh sáng quét chéo xuyên suốt card với màu phổ khác nhau (indigo, cyan, pink, white). Góc nghiêng và delay khác nhau tạo hiệu ứng lăng kính liên tục.',
    componentName: 'DiamondPrism', file: 'components/team/MemberCard.tsx',
    mountCode: '// Bên trong card div:\n{hasDiamondFX && <DiamondPrism />}',
    cssKeyframe: 'guildDiamondBeam',
    layer: 2,
  },
  {
    id: 'bi-entrance', name: 'Rank Entrance Animation', nameVi: 'Hiệu Ứng Xuất Hiện', emoji: '🎬',
    rankMin: 'iron', ranksActive: RANK_ORDER,
    description: 'Mỗi rank có motion khác nhau khi card xuất hiện. Iron: fade. Bronze: slide up. Silver: slide left + scale. Gold: spring bounce. Platinum: rotateX flip. Ruby: spring từ phải. Diamond: zoom out + deblur.',
    componentName: 'getRankEntranceProps()', file: 'components/team/MemberCard.tsx',
    mountCode: '// Trong component render member card list:\n// Spread props vào motion.div wrapper\nconst entranceProps = getRankEntranceProps(member.rank, index * 0.06);\n<motion.div key={member.id} {...entranceProps}>\n  <MemberCard ... />\n</motion.div>',
    cssKeyframe: null,
    layer: 3,
  },
];

// ── Code block component ────────────────────────────────────────────────────

function CodeBlock({ code, title }: { code: string; title?: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  const lines = code.split('\n');
  return (
    <div style={{ borderRadius: 12, overflow: 'hidden', border: `1px solid ${DS.border}` }}>
      <div className="flex items-center justify-between px-3 py-2" style={{ background: 'rgba(0,0,0,0.4)', borderBottom: `1px solid ${DS.border}` }}>
        <div className="flex items-center gap-2">
          <Code2 size={11} style={{ color: DS.text5 }} />
          <span style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono, letterSpacing: '0.12em' }}>{title ?? 'REACT · MOTION'}</span>
        </div>
        <button onClick={handleCopy} className="flex items-center gap-1.5 px-2 py-1 rounded-lg"
          style={{ background: copied ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.06)', border: `1px solid ${copied ? DS.green + '40' : DS.border}`, color: copied ? DS.green : DS.text4, fontSize: 10, cursor: 'pointer', fontFamily: DS.mono }}>
          {copied ? <><Check size={10} /> Đã copy</> : <><Copy size={10} /> Copy</>}
        </button>
      </div>
      <div className="overflow-x-auto scrollbar-zen" style={{ background: 'rgba(0,0,0,0.5)', padding: '12px 16px', maxHeight: 260, overflowY: 'auto' }}>
        <pre style={{ margin: 0, fontFamily: DS.mono, fontSize: 11, lineHeight: 1.7, color: DS.text3 }}>
          {lines.map((line, i) => {
            let color = DS.text3;
            if (line.trim().startsWith('//') || line.trim().startsWith('#')) color = DS.text5;
            else if (line.includes('import ') || line.includes('export ') || line.includes('function ') || line.includes('const ') || line.includes('return ') || line.includes('interface ')) color = DS.purple;
            else if (line.includes('"') || line.includes("'") || line.includes('`')) color = DS.green;
            else if (line.includes('motion') || line.includes('animate') || line.includes('transition') || line.includes('style') || line.includes('keyframes') || line.includes('@keyframe')) color = DS.cyan;
            return (
              <div key={i}>
                <span style={{ color: DS.text5, marginRight: 12, userSelect: 'none', fontSize: 9 }}>{String(i + 1).padStart(2, '0')}</span>
                <span style={{ color }}>{line}</span>
              </div>
            );
          })}
        </pre>
      </div>
    </div>
  );
}

// ── Live effect demo card — renders ACTUAL components ──────────────────────

function LiveEffectDemoCard({ effect }: { effect: BuiltinEffect }) {
  const demoMember = members.find(m => m.rank === effect.rankMin) ?? members.find(m => effect.ranksActive.includes(m.rank)) ?? members[0];
  const rc = RANKS[demoMember.rank];

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: 200, margin: '0 auto' }}>
      {/* Inject keyframes */}
      <style>{GUILD_ANIMATIONS_CSS}</style>

      {/* Glow ring */}
      <div style={{ position: 'absolute', inset: 0, borderRadius: 12, boxShadow: `0 0 24px ${rc.glowColor}`, pointerEvents: 'none' }} />

      {/* Card */}
      <div style={{
        backgroundColor: '#0F172A',
        border: `1px solid ${rc.color}40`,
        borderRadius: 12,
        overflow: 'hidden',
        animation: BOX_SHADOW_ANIM[demoMember.rank],
        position: 'relative',
      }}>
        {/* Show the specific effect */}
        {effect.id === 'bi-comet'          && <CometLine color={rc.color} />}
        {effect.id === 'bi-sparks'         && <ElectricSparks color={rc.color} />}
        {effect.id === 'bi-particles'      && <Particles rank={demoMember.rank} />}
        {effect.id === 'bi-diamond-p'      && <DiamondParticles />}
        {effect.id === 'bi-diamond-prism'  && <DiamondPrism />}
        {(effect.id === 'bi-glow' || effect.id === 'bi-diamond-p' || effect.id === 'bi-diamond-prism') && null}

        {/* Avatar */}
        <div style={{ position: 'relative', paddingBottom: '90%' }}>
          <img src={demoMember.img} alt={demoMember.name} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', borderRadius: '10px 10px 0 0' }} />
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(to top, #0F172A 0%, #0F172A55 35%, transparent 62%)', borderRadius: '10px 10px 0 0' }} />
          {/* Rank badge */}
          <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 4, background: `${rc.color}18`, border: `1px solid ${rc.color}55` }}>
            <span style={{ color: rc.color, fontSize: 9 }}>{rc.symbol}</span>
            <span style={{ color: rc.color, fontSize: 8, fontFamily: DS.mono, letterSpacing: '0.1em' }}>{rc.label}</span>
          </div>
          {/* Level */}
          <div style={{ position: 'absolute', bottom: 10, left: 10 }}>
            <span style={{ color: rc.color, fontSize: 18, fontWeight: 700, fontFamily: "'Cinzel', serif", textShadow: `0 0 14px ${rc.glowColor}` }}>{demoMember.level}</span>
            <span style={{ color: '#64748B', fontSize: 8, fontFamily: DS.mono, marginLeft: 3 }}>LVL</span>
          </div>
        </div>

        {/* Info */}
        <div style={{ padding: '8px 12px 10px' }}>
          <div style={{ color: '#fff', fontSize: 12, fontWeight: 700, fontFamily: "'Cinzel', serif", whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{demoMember.name}</div>
          <div style={{ color: '#64748B', fontSize: 9, fontFamily: DS.mono, marginTop: 2 }}>{demoMember.role}</div>
          <div style={{ height: 3, background: '#1F2937', borderRadius: 99, overflow: 'hidden', marginTop: 6 }}>
            <div style={{ height: '100%', width: `${Math.round((demoMember.currentXP / demoMember.maxXP) * 100)}%`, backgroundImage: `linear-gradient(90deg, ${rc.gradientFrom}, ${rc.gradientTo})`, borderRadius: 99 }} />
          </div>
        </div>
      </div>

      {/* LEDRunner outside overflow */}
      {(effect.id === 'bi-led' || effect.id !== 'bi-corner') && <LEDRunner member={demoMember} />}

      {/* CornerDeco */}
      {(effect.id === 'bi-corner' || effect.id === 'bi-led') && <CornerDeco color={rc.color} opacity={0.85} />}
    </div>
  );
}

// ── Builtin Effect Detail Panel ─────────────────────────────────────────────

function BuiltinEffectDetail({ effect }: { effect: BuiltinEffect }) {
  const layerLabel = effect.layer === 1 ? 'CSS Keyframe' : effect.layer === 2 ? 'React Component' : 'Motion Props';
  const layerColor = effect.layer === 1 ? DS.amber : effect.layer === 2 ? DS.blue : DS.purple;

  return (
    <motion.div key={effect.id} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
      {/* Header */}
      <div>
        <div style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: '0.15em', marginBottom: 4 }}>── DEMO TRỰC TIẾP (từ team page)</div>
        <div className="flex items-center gap-3 mb-4">
          <span style={{ fontSize: 24 }}>{effect.emoji}</span>
          <div>
            <div style={{ color: DS.text, fontSize: 15, fontWeight: 700 }}>{effect.nameVi}</div>
            <div style={{ color: DS.text4, fontSize: 11 }}>{effect.name}</div>
          </div>
          <div className="ml-auto flex flex-col gap-1 items-end">
            <span style={{ color: layerColor, background: `${layerColor}12`, border: `1px solid ${layerColor}25`, borderRadius: 6, padding: '2px 8px', fontSize: 9, fontFamily: DS.mono }}>{layerLabel}</span>
            <span style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono }}>
              {effect.ranksActive.map(r => RANKS[r].symbol).join(' ')}
            </span>
          </div>
        </div>

        {/* Live Demo */}
        <LiveEffectDemoCard effect={effect} />
      </div>

      {/* Description */}
      <div className="rounded-xl p-3" style={{ background: DS.bgCard2, border: `1px solid ${DS.border}` }}>
        <div style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono, letterSpacing: '0.12em', marginBottom: 6 }}>MÔ TẢ HIỆU ỨNG</div>
        <p style={{ color: DS.text3, fontSize: 12, lineHeight: 1.65 }}>{effect.description}</p>
      </div>

      {/* Ranks where active */}
      <div>
        <div style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono, letterSpacing: '0.12em', marginBottom: 6 }}>ACTIVE TẠI RANK</div>
        <div className="flex flex-wrap gap-2">
          {RANK_ORDER.map(rk => {
            const active = effect.ranksActive.includes(rk);
            const rc = RANKS[rk];
            return (
              <span key={rk} style={{ color: active ? rc.color : DS.text5, background: active ? `${rc.color}12` : 'rgba(255,255,255,0.02)', border: `1px solid ${active ? rc.color + '40' : DS.border}`, borderRadius: 6, padding: '3px 9px', fontSize: 9, fontFamily: DS.mono, opacity: active ? 1 : 0.4 }}>
                {rc.symbol} {rc.label}
              </span>
            );
          })}
        </div>
      </div>

      {/* File location */}
      <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.2)' }}>
        <Cpu size={13} style={{ color: DS.blue, flexShrink: 0 }} />
        <div>
          <div style={{ color: DS.blue, fontSize: 10, fontFamily: DS.mono, fontWeight: 700 }}>VỊ TRÍ FILE</div>
          <div style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, marginTop: 2 }}>/{effect.file}</div>
        </div>
      </div>

      {/* Mount code */}
      <div>
        <div style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono, letterSpacing: '0.12em', marginBottom: 6 }}>CÁCH MOUNT TRONG MEMBERCARD</div>
        <CodeBlock code={effect.mountCode} title="MemberCard.tsx" />
      </div>

      {/* CSS Keyframe note */}
      {effect.cssKeyframe && (
        <div className="rounded-xl p-3" style={{ background: `${DS.amber}08`, border: `1px solid ${DS.amber}20` }}>
          <div style={{ color: DS.amber, fontSize: 10, fontFamily: DS.mono, marginBottom: 4 }}>⚡ CSS KEYFRAME</div>
          <div style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono }}>{effect.cssKeyframe}</div>
          <div style={{ color: DS.text5, fontSize: 10, marginTop: 4 }}>Định nghĩa trong <code style={{ color: DS.cyan, fontFamily: DS.mono }}>GUILD_ANIMATIONS_CSS</code> cuối MemberCard.tsx</div>
        </div>
      )}
    </motion.div>
  );
}

// ── Tab 1: Built-in Effects ─────────────────────────────────────────────────

function BuiltinTab() {
  const [selected, setSelected] = useState<BuiltinEffect>(BUILTIN_EFFECTS[0]);

  const layerColors: Record<number, string> = { 1: DS.amber, 2: DS.blue, 3: DS.purple };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-5 gap-5" style={{ alignItems: 'start' }}>
      {/* Left: list */}
      <div className="xl:col-span-3 space-y-2">
        <div className="flex items-center justify-between mb-3">
          <div style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: '0.15em' }}>── 9 HIỆU ỨNG TÍCH HỢP (hardcode MemberCard)</div>
          <div className="flex items-center gap-2">
            {[1, 2, 3].map(l => (
              <span key={l} style={{ color: layerColors[l], background: `${layerColors[l]}12`, border: `1px solid ${layerColors[l]}25`, borderRadius: 4, padding: '1px 7px', fontSize: 9, fontFamily: DS.mono }}>
                {l === 1 ? 'CSS KF' : l === 2 ? 'Component' : 'Motion'}
              </span>
            ))}
          </div>
        </div>
        {BUILTIN_EFFECTS.map(eff => {
          const isSelected = selected.id === eff.id;
          const rankMin = RANKS[eff.rankMin];
          const lc = layerColors[eff.layer];
          return (
            <motion.div key={eff.id} onClick={() => setSelected(eff)}
              className="flex items-start gap-3 p-3.5 rounded-2xl cursor-pointer"
              style={{ background: isSelected ? `${rankMin.color}08` : DS.bgCard, border: `1px solid ${isSelected ? rankMin.color + '50' : DS.border}` }}
              whileHover={{ borderColor: rankMin.color + '35', x: 3 }}>
              <span style={{ fontSize: 22, flexShrink: 0 }}>{eff.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span style={{ color: DS.text, fontSize: 13, fontWeight: 700 }}>{eff.nameVi}</span>
                  <span style={{ color: rankMin.color, fontSize: 9, fontFamily: DS.mono }}>{rankMin.symbol} {rankMin.label}+</span>
                  <span style={{ color: lc, background: `${lc}12`, border: `1px solid ${lc}25`, borderRadius: 4, padding: '1px 6px', fontSize: 8, fontFamily: DS.mono }}>
                    {eff.layer === 1 ? 'CSS KF' : eff.layer === 2 ? 'Component' : 'Motion'}
                  </span>
                </div>
                <div style={{ color: DS.text4, fontSize: 11, marginTop: 3, lineHeight: 1.5 }}>{eff.description.slice(0, 80)}…</div>
                <div className="flex items-center gap-1 mt-2">
                  {eff.ranksActive.slice(0, 5).map(rk => (
                    <span key={rk} style={{ color: RANKS[rk].color, fontSize: 11 }}>{RANKS[rk].symbol}</span>
                  ))}
                  {eff.ranksActive.length > 5 && <span style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono }}>+{eff.ranksActive.length - 5}</span>}
                </div>
              </div>
              <div style={{ flexShrink: 0, color: DS.text5, fontSize: 10, fontFamily: DS.mono, textAlign: 'right', marginTop: 2 }}>
                <div style={{ color: isSelected ? DS.blue : DS.text5, fontSize: 10 }}>/{eff.file.split('/').pop()}</div>
              </div>
            </motion.div>
          );
        })}

        {/* Note */}
        <div className="flex gap-3 p-4 rounded-2xl" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
          <Info size={14} style={{ color: DS.text5, flexShrink: 0, marginTop: 1 }} />
          <div style={{ color: DS.text4, fontSize: 12, lineHeight: 1.6 }}>
            Các hiệu ứng này được <strong style={{ color: DS.text3 }}>hardcode vào MemberCard.tsx</strong> và không thể tắt qua admin UI. Để toggle per-member hoặc thêm hiệu ứng mới có thể quản lý, dùng tab <strong style={{ color: DS.blue }}>Addon Effects</strong> hoặc xem <strong style={{ color: DS.purple }}>Hướng dẫn thêm mới</strong>.
          </div>
        </div>
      </div>

      {/* Right: detail */}
      <div className="xl:col-span-2">
        <div className="rounded-2xl p-5 overflow-y-auto scrollbar-zen"
          style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, position: 'sticky', top: 0, maxHeight: '88vh' }}>
          <AnimatePresence mode="wait">
            <BuiltinEffectDetail key={selected.id} effect={selected} />
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// ── Custom Effect Edit Modal ─────────────────────────────────────────────────

function EffectEditModal({ effect, onClose, onSave }: {
  effect: RankEffect; onClose: () => void; onSave: (e: RankEffect) => void;
}) {
  const [draft, setDraft] = useState({ ...effect });
  const inputStyle = { width: '100%', background: DS.bgCard2, border: `1px solid ${DS.border}`, borderRadius: 8, padding: '8px 12px', color: DS.text, fontSize: 13, outline: 'none', boxSizing: 'border-box' as const };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg rounded-2xl overflow-hidden" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
        <div className="flex items-center justify-between p-5" style={{ borderBottom: `1px solid ${DS.border}` }}>
          <div style={{ color: DS.text, fontSize: 15, fontWeight: 700 }}>{draft.id.startsWith('new') ? 'Thêm Addon Effect' : 'Chỉnh sửa Addon Effect'}</div>
          <button onClick={onClose} style={{ color: DS.text4, background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
        </div>
        <div className="p-5 space-y-4 overflow-y-auto scrollbar-zen" style={{ maxHeight: '65vh' }}>
          <div>
            <label style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, display: 'block', marginBottom: 5 }}>TÊN HIỆU ỨNG</label>
            <input value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} style={inputStyle} placeholder="VD: Ruby Aura Surge" />
          </div>
          <div>
            <label style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, display: 'block', marginBottom: 5 }}>MÔ TẢ</label>
            <textarea value={draft.description} onChange={e => setDraft({ ...draft, description: e.target.value })} rows={2}
              style={{ ...inputStyle, resize: 'vertical' as const, fontFamily: DS.body }} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, display: 'block', marginBottom: 5 }}>LOẠI</label>
              <select value={draft.type} onChange={e => setDraft({ ...draft, type: e.target.value as any })} style={inputStyle}>
                {Object.entries(TYPE_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div>
              <label style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, display: 'block', marginBottom: 5 }}>ĐỘ HIẾM</label>
              <select value={draft.rarity} onChange={e => setDraft({ ...draft, rarity: e.target.value as any })} style={inputStyle}>
                {Object.entries(RARITY_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, display: 'block', marginBottom: 5 }}>MỞ KHÓA TẠI RANK</label>
              <select value={draft.unlockRank} onChange={e => setDraft({ ...draft, unlockRank: e.target.value as RankKey })} style={inputStyle}>
                {RANK_ORDER.map(r => <option key={r} value={r}>{RANKS[r].label}</option>)}
              </select>
            </div>
            <div>
              <label style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, display: 'block', marginBottom: 5 }}>MỞ KHÓA TẠI LEVEL</label>
              <input type="number" value={draft.unlockLevel} onChange={e => setDraft({ ...draft, unlockLevel: Number(e.target.value) })} style={inputStyle} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, display: 'block', marginBottom: 5 }}>ICON PREVIEW (emoji)</label>
              <input value={draft.preview} onChange={e => setDraft({ ...draft, preview: e.target.value })} style={{ ...inputStyle, fontSize: 22, textAlign: 'center' }} />
            </div>
            <div>
              <label style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, display: 'block', marginBottom: 5 }}>MÀU SẮC (hex, tuỳ chọn)</label>
              <div className="flex gap-2">
                <input value={draft.color ?? ''} onChange={e => setDraft({ ...draft, color: e.target.value || undefined })}
                  placeholder={RANKS[draft.unlockRank].color} style={{ ...inputStyle, flex: 1, fontFamily: DS.mono, color: draft.color ?? RANKS[draft.unlockRank].color }} />
                {draft.color && <div style={{ width: 38, height: 38, borderRadius: 8, background: draft.color, border: `1px solid ${DS.border}`, flexShrink: 0 }} />}
              </div>
            </div>
          </div>
          <div>
            <label style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, display: 'block', marginBottom: 5 }}>CẤU HÌNH (config string)</label>
            <textarea value={draft.cssConfig} onChange={e => setDraft({ ...draft, cssConfig: e.target.value })} rows={2}
              placeholder="VD: count: 10; speed: 2s; neon: true"
              style={{ ...inputStyle, resize: 'vertical' as const, fontFamily: DS.mono, fontSize: 12 }} />
          </div>
        </div>
        <div className="flex gap-3 p-5" style={{ borderTop: `1px solid ${DS.border}` }}>
          <button onClick={onClose} style={{ flex: 1, background: 'none', border: `1px solid ${DS.border}`, borderRadius: 10, padding: '10px', color: DS.text3, fontSize: 13, cursor: 'pointer' }}>Hủy</button>
          <button onClick={() => onSave(draft)}
            style={{ flex: 1, background: GRD.primary, color: '#fff', border: 'none', borderRadius: 10, padding: '10px', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <Save size={14} /> Lưu hiệu ứng
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Tab 2: Addon Effects (loopStore) ─────────────────────────────────────────

function AddonEffectsTab() {
  const { effects, toggleEffectEnabled, addEffect, updateEffect, deleteEffect } = useLoopStore();
  const [editingEffect, setEditingEffect] = useState<RankEffect | null>(null);
  const [previewEffect, setPreviewEffect] = useState<RankEffect | null>(effects[0] ?? null);

  const handleSave = (e: RankEffect) => {
    if (effects.find(ef => ef.id === e.id)) updateEffect(e.id, e);
    else addEffect(e);
    setEditingEffect(null);
    setPreviewEffect(e);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-5 gap-5" style={{ alignItems: 'start' }}>
      {/* Left: list */}
      <div className="xl:col-span-3 space-y-3">
        <div className="flex items-center justify-between">
          <div style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: '0.15em' }}>── ADDON EFFECTS (quản lý qua admin)</div>
          <button onClick={() => setEditingEffect({ id: `new-${Date.now()}`, name: '', description: '', type: 'particle', unlockRank: 'iron', unlockLevel: 1, enabled: true, cssConfig: '', preview: '✨', rarity: 'common' })}
            style={{ background: GRD.primary, color: '#fff', border: 'none', borderRadius: 10, padding: '7px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
            <Plus size={12} /> Thêm hiệu ứng
          </button>
        </div>

        <div className="space-y-2 overflow-y-auto scrollbar-zen" style={{ maxHeight: 580 }}>
          {effects.map(eff => {
            const rc = RANKS[eff.unlockRank];
            const rr = RARITY_CFG[eff.rarity];
            const tc = TYPE_CFG[eff.type];
            const isSelected = previewEffect?.id === eff.id;
            return (
              <motion.div key={eff.id}
                className="flex items-center gap-3 p-3 rounded-xl cursor-pointer"
                style={{ background: isSelected ? `${rc.color}10` : DS.bgCard, border: `1px solid ${isSelected ? rc.color + '40' : eff.enabled ? DS.border : DS.red + '20'}`, opacity: eff.enabled ? 1 : 0.55 }}
                onClick={() => setPreviewEffect(eff)} whileHover={{ borderColor: rc.color + '40' }}>
                <div style={{ fontSize: 20, flexShrink: 0, width: 32, textAlign: 'center' }}>{eff.preview}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span style={{ color: DS.text, fontSize: 13, fontWeight: 700 }}>{eff.name}</span>
                    <span style={{ color: rr.color, fontSize: 9, fontFamily: DS.mono, border: `1px solid ${rr.color}30`, padding: '1px 5px', borderRadius: 4, background: `${rr.color}10` }}>{rr.label}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1" style={{ color: DS.text5, fontSize: 10 }}>{tc.icon} {tc.label}</span>
                    <span style={{ color: rc.color, fontSize: 10, fontFamily: DS.mono }}>{rc.symbol} {rc.label} Lv.{eff.unlockLevel}+</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button onClick={e => { e.stopPropagation(); toggleEffectEnabled(eff.id); }}
                    style={{ color: eff.enabled ? DS.green : DS.text5, background: 'none', border: `1px solid ${DS.border}`, borderRadius: 6, padding: '4px 8px', cursor: 'pointer', fontSize: 10, display: 'flex', alignItems: 'center', gap: 3 }}>
                    {eff.enabled ? <><ToggleRight size={13} /> Bật</> : <><ToggleLeft size={13} /> Tắt</>}
                  </button>
                  <button onClick={e => { e.stopPropagation(); setEditingEffect(eff); }}
                    style={{ color: DS.blue, background: `${DS.blue}12`, border: `1px solid ${DS.blue}25`, borderRadius: 6, padding: '4px 7px', cursor: 'pointer' }}>
                    <Edit3 size={11} />
                  </button>
                  <button onClick={e => { e.stopPropagation(); deleteEffect(eff.id); if (previewEffect?.id === eff.id) setPreviewEffect(null); }}
                    style={{ color: DS.red, background: `${DS.red}10`, border: `1px solid ${DS.red}20`, borderRadius: 6, padding: '4px 7px', cursor: 'pointer' }}>
                    <Trash2 size={11} />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="p-4 rounded-2xl" style={{ background: `${DS.blue}06`, border: `1px solid ${DS.blue}18` }}>
          <div style={{ color: DS.blue, fontSize: 11, fontFamily: DS.mono, marginBottom: 6 }}>💡 Addon Effects dùng EffectRenderer</div>
          <div style={{ color: DS.text4, fontSize: 12, lineHeight: 1.6 }}>
            Addon Effects được render qua component{' '}
            <code style={{ color: DS.cyan, fontFamily: DS.mono, background: `${DS.cyan}10`, padding: '1px 5px', borderRadius: 3 }}>{'<EffectRenderer>'}</code>{' '}
            từ <code style={{ color: DS.purple, fontFamily: DS.mono }}>ui/EffectRenderer.tsx</code>. Chúng được lưu trong Zustand store và có thể thêm/xóa/toggle mà không cần sửa code.
          </div>
        </div>
      </div>

      {/* Right: preview */}
      <div className="xl:col-span-2">
        <div className="rounded-2xl p-5 overflow-y-auto scrollbar-zen"
          style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, position: 'sticky', top: 0, maxHeight: '85vh' }}>
          {previewEffect ? (
            <motion.div key={previewEffect.id} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
              <div style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: '0.15em' }}>── PREVIEW ADDON EFFECT</div>
              {/* Live preview */}
              <div className="rounded-2xl p-6 flex flex-col items-center gap-4" style={{ background: DS.bgCard2, border: `1px solid ${RARITY_CFG[previewEffect.rarity].color}25` }}>
                <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at center, ${RANKS[previewEffect.unlockRank].color}05, transparent 65%)`, pointerEvents: 'none', borderRadius: 16 }} />
                <EffectRenderer effects={[previewEffect]} size={100} borderRadius={20}>
                  <img src={(members.find(m => m.rank === previewEffect.unlockRank) ?? members[0]).img} alt="demo"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 20, display: 'block' }} />
                </EffectRenderer>
                <div className="flex flex-wrap gap-2 justify-center">
                  <span style={{ color: RARITY_CFG[previewEffect.rarity].color, background: `${RARITY_CFG[previewEffect.rarity].color}12`, border: `1px solid ${RARITY_CFG[previewEffect.rarity].color}30`, borderRadius: 6, padding: '3px 10px', fontSize: 10, fontFamily: DS.mono }}>
                    {RARITY_CFG[previewEffect.rarity].label}
                  </span>
                  <span style={{ color: RANKS[previewEffect.unlockRank].color, background: `${RANKS[previewEffect.unlockRank].color}12`, border: `1px solid ${RANKS[previewEffect.unlockRank].color}30`, borderRadius: 6, padding: '3px 10px', fontSize: 10, fontFamily: DS.mono }}>
                    {RANKS[previewEffect.unlockRank].symbol} {RANKS[previewEffect.unlockRank].label} Lv.{previewEffect.unlockLevel}+
                  </span>
                </div>
              </div>
              {/* Config */}
              {previewEffect.cssConfig && (
                <div className="rounded-xl p-3" style={{ background: DS.bgCard2, border: `1px solid ${DS.border}` }}>
                  <div style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono, letterSpacing: '0.12em', marginBottom: 4 }}>CONFIG</div>
                  <div style={{ color: DS.cyan, fontSize: 11, fontFamily: DS.mono }}>{previewEffect.cssConfig}</div>
                </div>
              )}
              {/* Usage */}
              <div className="rounded-xl p-3" style={{ background: `${DS.blue}06`, border: `1px solid ${DS.blue}18` }}>
                <div style={{ color: DS.blue, fontSize: 10, fontFamily: DS.mono, marginBottom: 4 }}>💡 Cách dùng trong code</div>
                <CodeBlock code={`// Trong bất kỳ component nào\nimport { EffectRenderer } from 'ui/EffectRenderer';\nimport { useLoopStore } from 'store/loopStore';\n\nconst { effects } = useLoopStore();\nconst memberEffects = effects.filter(e =>\n  e.enabled &&\n  RANKS[e.unlockRank].tier <= RANKS[member.rank].tier &&\n  member.level >= e.unlockLevel\n);\n\n<EffectRenderer effects={memberEffects} size={80}>\n  <img src={member.img} ... />\n</EffectRenderer>`} title="Sử dụng EffectRenderer" />
              </div>
            </motion.div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16" style={{ color: DS.text5 }}>
              <Monitor size={32} style={{ opacity: 0.3, marginBottom: 12 }} />
              <div style={{ fontSize: 13 }}>Chọn hiệu ứng để xem preview</div>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {editingEffect && <EffectEditModal effect={editingEffect} onClose={() => setEditingEffect(null)} onSave={handleSave} />}
      </AnimatePresence>
    </div>
  );
}

// ── Member Effects Modal ────────────────────────────────────────────────────

function MemberEffectsModal({ memberId, onClose }: { memberId: number; onClose: () => void }) {
  const m = members.find(x => x.id === memberId)!;
  const rc = RANKS[m.rank];
  const { effects, memberEffectOverrides, updateMemberOverride } = useLoopStore();

  // Built-in effects this member has based on rank
  const builtinForMember = BUILTIN_EFFECTS.filter(e => e.ranksActive.includes(m.rank));

  // Custom addon effects this member can unlock
  const addonUnlocked = effects.filter(e => {
    const effTier = RANKS[e.unlockRank].tier;
    const memberTier = rc.tier;
    return memberTier >= effTier && m.level >= e.unlockLevel;
  });
  const addonLocked = effects.filter(e => {
    const effTier = RANKS[e.unlockRank].tier;
    const memberTier = rc.tier;
    return !(memberTier >= effTier && m.level >= e.unlockLevel);
  });

  const getOverride = (effectId: string) =>
    memberEffectOverrides.find(o => o.memberId === m.id && o.effectId === effectId);

  const isVisible = (effectId: string) => {
    const ov = getOverride(effectId);
    return ov ? ov.visible : true; // default: visible
  };

  const toggle = (effectId: string) => {
    const ov = getOverride(effectId);
    updateMemberOverride({
      memberId: m.id, effectId,
      visible: ov ? !ov.visible : false,
      selectedByMember: ov ? ov.selectedByMember : true,
    });
  };

  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}>
      <div className="absolute inset-0" style={{ background: 'rgba(2,6,23,0.9)', backdropFilter: 'blur(12px)' }} />
      <motion.div className="relative w-full max-w-4xl rounded-2xl overflow-hidden"
        style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, maxHeight: '90vh' }}
        initial={{ scale: 0.95, y: 16 }} animate={{ scale: 1, y: 0 }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between p-5" style={{ borderBottom: `1px solid ${DS.border}`, background: DS.bgCard }}>
          <div className="flex items-center gap-3">
            <div style={{ width: 40, height: 40, borderRadius: '50%', overflow: 'hidden', border: `2px solid ${rc.color}`, boxShadow: `0 0 12px ${rc.glowColor}` }}>
              <img src={m.img} alt={m.name} className="w-full h-full object-cover" />
            </div>
            <div>
              <div style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono, letterSpacing: '0.15em' }}>── QUẢN LÝ HIỆU ỨNG</div>
              <div style={{ color: rc.color, fontSize: 15, fontWeight: 700 }}>{m.name}</div>
              <div style={{ color: DS.text4, fontSize: 11 }}>{rc.symbol} {rc.label} · Lv.{m.level} · {m.role}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: DS.text4, cursor: 'pointer', padding: 6 }}><X size={18} /></button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto scrollbar-zen" style={{ maxHeight: 'calc(90vh - 88px)' }}>
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-0">

            {/* Left: MemberCard live preview */}
            <div className="xl:col-span-2 p-5 flex flex-col items-center gap-4" style={{ borderRight: `1px solid ${DS.border}`, background: DS.bgCard2 }}>
              <div style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono, letterSpacing: '0.15em', alignSelf: 'flex-start' }}>── PREVIEW THỰC TẾ (team page)</div>
              <style>{GUILD_ANIMATIONS_CSS}</style>
              <div style={{ width: '100%', maxWidth: 200 }}>
                <MemberCard member={m} onClick={() => {}} />
              </div>
              <div className="w-full p-3 rounded-xl" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
                <div style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono, marginBottom: 6 }}>THÔNG TIN RANK</div>
                {[
                  { label: 'Rank', value: `${rc.symbol} ${rc.label}`, color: rc.color },
                  { label: 'Level', value: `${m.level} / ${rc.maxLevel}`, color: DS.text3 },
                  { label: 'LP', value: `${m.lpBalance.toLocaleString()} LP`, color: DS.amber },
                  { label: 'Addon mở khóa', value: `${addonUnlocked.length} hiệu ứng`, color: DS.green },
                ].map(s => (
                  <div key={s.label} className="flex justify-between py-1" style={{ borderBottom: `1px solid ${DS.border}` }}>
                    <span style={{ color: DS.text5, fontSize: 11 }}>{s.label}</span>
                    <span style={{ color: s.color, fontSize: 11, fontFamily: DS.mono, fontWeight: 700 }}>{s.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Effect management */}
            <div className="xl:col-span-3 p-5 space-y-5">

              {/* Section 1: Built-in effects */}
              <div>
                <div style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: '0.15em', marginBottom: 12 }}>── HIỆU ỨNG TÍCH HỢP ({builtinForMember.length})</div>
                <div className="space-y-2">
                  {builtinForMember.map(eff => (
                    <div key={eff.id} className="flex items-center gap-3 p-3 rounded-xl"
                      style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
                      <span style={{ fontSize: 18, flexShrink: 0 }}>{eff.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div style={{ color: DS.text2, fontSize: 12, fontWeight: 600 }}>{eff.nameVi}</div>
                        <div style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono }}>/{eff.file.split('/').pop()} · Layer {eff.layer}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Lock size={11} style={{ color: DS.text5 }} />
                        <span style={{ color: DS.text5, background: DS.bgCard2, border: `1px solid ${DS.border}`, borderRadius: 6, padding: '3px 9px', fontSize: 10, fontFamily: DS.mono }}>Tích hợp sẵn</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-2 p-2.5 rounded-xl flex items-center gap-2" style={{ background: `${DS.amber}06`, border: `1px solid ${DS.amber}18` }}>
                  <Info size={12} style={{ color: DS.amber, flexShrink: 0 }} />
                  <span style={{ color: DS.text5, fontSize: 11 }}>Hiệu ứng tích hợp không thể toggle per-member — chúng được hardcode theo rank.</span>
                </div>
              </div>

              {/* Section 2: Addon effects - unlocked */}
              <div>
                <div style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: '0.15em', marginBottom: 12 }}>── ADDON EFFECTS — ĐÃ MỞ KHÓA ({addonUnlocked.length})</div>
                {addonUnlocked.length === 0 ? (
                  <div style={{ color: DS.text5, fontSize: 12, textAlign: 'center', padding: '16px 0' }}>Chưa mở khóa addon nào</div>
                ) : (
                  <div className="space-y-2">
                    {addonUnlocked.map(eff => {
                      const visible = isVisible(eff.id);
                      const rr = RARITY_CFG[eff.rarity];
                      return (
                        <div key={eff.id} className="flex items-center gap-3 p-3 rounded-xl"
                          style={{ background: visible ? `${RANKS[eff.unlockRank].color}06` : DS.bgCard, border: `1px solid ${visible ? RANKS[eff.unlockRank].color + '30' : DS.border}` }}>
                          <span style={{ fontSize: 18, flexShrink: 0, opacity: visible ? 1 : 0.35 }}>{eff.preview}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span style={{ color: visible ? DS.text : DS.text4, fontSize: 12, fontWeight: 600 }}>{eff.name}</span>
                              <span style={{ color: rr.color, fontSize: 8, fontFamily: DS.mono, border: `1px solid ${rr.color}25`, padding: '1px 5px', borderRadius: 3, background: `${rr.color}10` }}>{rr.label}</span>
                            </div>
                            <div style={{ color: DS.text5, fontSize: 10 }}>{eff.description.slice(0, 55)}…</div>
                          </div>
                          <button onClick={() => toggle(eff.id)}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl flex-shrink-0"
                            style={{ background: visible ? 'rgba(34,197,94,0.12)' : DS.bgCard2, border: `1px solid ${visible ? DS.green + '40' : DS.border}`, color: visible ? DS.green : DS.text5, cursor: 'pointer', fontSize: 11, fontFamily: DS.mono }}>
                            {visible ? <><Eye size={12} /> Hiện</> : <><EyeOff size={12} /> Ẩn</>}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Section 3: Locked addons */}
              {addonLocked.length > 0 && (
                <div>
                  <div style={{ color: DS.text5, fontSize: 11, fontFamily: DS.mono, letterSpacing: '0.15em', marginBottom: 10 }}>── CHƯA MỞ KHÓA ({addonLocked.length})</div>
                  <div className="space-y-1.5">
                    {addonLocked.map(eff => (
                      <div key={eff.id} className="flex items-center gap-3 p-3 rounded-xl"
                        style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, opacity: 0.45 }}>
                        <span style={{ fontSize: 16, flexShrink: 0 }}>{eff.preview}</span>
                        <div className="flex-1">
                          <span style={{ color: DS.text4, fontSize: 12 }}>{eff.name}</span>
                        </div>
                        <span style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono }}>
                          {RANKS[eff.unlockRank].symbol} {RANKS[eff.unlockRank].label} Lv.{eff.unlockLevel}+
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Tab 3: By Member ─────────────────────────────────────────────────────────

function MembersTab() {
  const { effects, memberEffectOverrides } = useLoopStore();
  const [managing, setManaging] = useState<number | null>(null);
  const [search, setSearch] = useState('');

  const filtered = members.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    RANKS[m.rank].label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl flex-1"
          style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, maxWidth: 320 }}>
          <Users size={13} style={{ color: DS.text5 }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm thành viên..."
            style={{ background: 'none', border: 'none', outline: 'none', color: DS.text3, fontSize: 13, flex: 1 }} />
        </div>
        <span style={{ color: DS.text5, fontSize: 12, fontFamily: DS.mono }}>{filtered.length} thành viên</span>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
        {filtered.map(m => {
          const rc = RANKS[m.rank];
          const memberOverrides = memberEffectOverrides.filter(o => o.memberId === m.id);
          const addonUnlocked = effects.filter(e => {
            const effTier = RANKS[e.unlockRank].tier;
            return rc.tier >= effTier && m.level >= e.unlockLevel;
          });
          const activeAddons = memberOverrides.filter(o => o.visible).length;
          const builtinCount = BUILTIN_EFFECTS.filter(e => e.ranksActive.includes(m.rank)).length;

          return (
            <motion.div key={m.id} className="flex items-center gap-4 p-4 rounded-2xl"
              style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}
              whileHover={{ borderColor: `${rc.color}40`, x: 2 }}>
              {/* Avatar */}
              <div style={{ width: 44, height: 44, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, border: `2px solid ${rc.color}60`, boxShadow: `0 0 8px ${rc.glowColor}` }}>
                <img src={m.img} alt={m.name} className="w-full h-full object-cover" />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span style={{ color: DS.text, fontSize: 13, fontWeight: 700 }}>{m.name}</span>
                  <span style={{ color: rc.color, fontSize: 9, fontFamily: DS.mono }}>{rc.symbol} {rc.label}</span>
                </div>
                <div style={{ color: DS.text5, fontSize: 10, marginTop: 2 }}>{m.role} · Lv.{m.level}</div>
                <div className="flex items-center gap-3 mt-1.5">
                  <span style={{ color: DS.text5, fontSize: 10 }}>
                    <span style={{ color: DS.purple }}>⌂</span> {builtinCount} tích hợp
                  </span>
                  <span style={{ color: DS.text5, fontSize: 10 }}>
                    <span style={{ color: DS.green }}>✦</span> {addonUnlocked.length} addon mở khóa
                  </span>
                  {activeAddons > 0 && (
                    <span style={{ color: DS.green, fontSize: 10, fontFamily: DS.mono }}>👁 {activeAddons} đang bật</span>
                  )}
                </div>
              </div>

              {/* Effects chips */}
              <div className="flex items-center gap-1 flex-shrink-0">
                {BUILTIN_EFFECTS.filter(e => e.ranksActive.includes(m.rank)).slice(0, 3).map(e => (
                  <span key={e.id} title={e.nameVi} style={{ fontSize: 14 }}>{e.emoji}</span>
                ))}
                {builtinCount > 3 && <span style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono }}>+{builtinCount - 3}</span>}
              </div>

              {/* Quản lý button */}
              <button onClick={() => setManaging(m.id)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl flex-shrink-0"
                style={{ background: `${rc.color}10`, border: `1px solid ${rc.color}30`, color: rc.color, cursor: 'pointer', fontSize: 11, fontFamily: DS.mono, fontWeight: 700, whiteSpace: 'nowrap' }}>
                <Edit3 size={12} /> Quản lý
              </button>
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
        {managing !== null && (
          <MemberEffectsModal memberId={managing} onClose={() => setManaging(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Tab 4: Add New Effect Guide ─────────────────────────────────────────────

const ADD_GUIDE_STEPS = [
  {
    num: 1, label: 'CSS Keyframe',
    file: 'components/team/MemberCard.tsx',
    color: DS.amber,
    description: 'Thêm @keyframe vào chuỗi GUILD_ANIMATIONS_CSS. Chuỗi này được inject vào <style> trong Home.tsx và MemberDetailPage.tsx.',
    code: `// Tìm export const GUILD_ANIMATIONS_CSS = \`...\` ở cuối file\n// Thêm keyframe mới vào trong chuỗi:\n\nexport const GUILD_ANIMATIONS_CSS = \`\n  /* ... các keyframes hiện có ... */\n\n  @keyframes myNewEffect {\n    0%   { opacity: 0; transform: scale(0.8); }\n    50%  { opacity: 1; transform: scale(1.1); }\n    100% { opacity: 0; transform: scale(0.8); }\n  }\n\`;`,
  },
  {
    num: 2, label: 'React Component',
    file: 'components/team/MemberCard.tsx',
    color: DS.blue,
    description: 'Tạo component React mới trong MemberCard.tsx. Export nếu muốn dùng ở nơi khác (ví dụ EffectsTab admin preview).',
    code: `// Thêm ngay trước "// ── Main MemberCard ──" comment\n\nexport function MyNewEffect({ color }: { color: string }) {\n  return (\n    <div\n      className="absolute inset-0 pointer-events-none z-30"\n      style={{\n        // Dùng CSS animation từ GUILD_ANIMATIONS_CSS (Step 1)\n        animation: 'myNewEffect 2s ease-in-out infinite',\n      }}\n    >\n      {/* nội dung hiệu ứng */}\n    </div>\n  );\n}`,
  },
  {
    num: 3, label: 'Mount trong MemberCard',
    file: 'components/team/MemberCard.tsx',
    color: DS.green,
    description: 'Thêm điều kiện render vào trong thân MemberCard. Pattern: const hasX = condition; rồi {hasX && <Component />}.',
    code: `// Bên trong function MemberCard({ member, onClick }) {\n\n  // 1. Thêm điều kiện (dựa theo rank, level, hoặc cả hai)\n  const hasMyNewFX = member.rank === 'platinum' && member.level >= 80;\n  // Hoặc: const hasMyNewFX = ['gold', 'platinum'].includes(member.rank);\n\n  // 2. Mount bên trong <div style={cardStyle}>:\n  return (\n    <motion.div ...>\n      <div style={cardStyle}>\n        {hasComet && <CometLine color={cfg.color} />}   // đã có\n        {hasMyNewFX && <MyNewEffect color={cfg.color} />}  // ← THÊM ĐÂY\n        ...\n      </div>\n    </motion.div>\n  );\n}`,
  },
  {
    num: 4, label: 'Đăng ký Addon Effect (tuỳ chọn)',
    file: 'store/loopStore.ts',
    color: DS.purple,
    description: 'Nếu muốn hiệu ứng có thể toggle per-member qua admin và dùng EffectRenderer thay vì hardcode, đăng ký vào INIT_EFFECTS trong loopStore.',
    code: `// Tìm const INIT_EFFECTS: RankEffect[] = [ trong loopStore.ts\n// Thêm entry mới:\n\n{\n  id: 'eff-NEW',\n  name: 'My New Effect',\n  description: 'Mô tả hiệu ứng của bạn',\n  type: 'particle',           // particle | glow | border | aura | badge | trail\n  unlockRank: 'platinum',     // rank tối thiểu\n  unlockLevel: 80,            // level tối thiểu\n  enabled: true,              // bật mặc định\n  cssConfig: 'count: 8; speed: 2s; color: #14B8A6', // tuỳ chọn\n  preview: '🌊',              // emoji preview\n  rarity: 'epic',             // common | rare | epic | legendary\n},\n\n// Sau đó EffectRenderer sẽ tự render dựa theo type\n// hoặc bạn tự handle trong EffectRenderer.tsx`,
  },
  {
    num: 5, label: 'Inject CSS vào trang mới (nếu cần)',
    file: 'Home.tsx / MemberDetailPage.tsx',
    color: DS.cyan,
    description: 'Nếu hiệu ứng dùng CSS animation tên mới, đảm bảo GUILD_ANIMATIONS_CSS được inject ở trang bạn dùng. Đã có sẵn ở Home và MemberDetailPage.',
    code: `// Trong component trang (ví dụ MyNewPage.tsx):\nimport { GUILD_ANIMATIONS_CSS } from './components/team/MemberCard';\n\n// Option A: JSX inline (MemberDetailPage.tsx pattern)\nreturn (\n  <div>\n    <style>{GUILD_ANIMATIONS_CSS}</style>\n    {/* ... */}\n  </div>\n);\n\n// Option B: useEffect + document.head (Home.tsx pattern)\nuseEffect(() => {\n  const el = document.createElement('style');\n  el.id = 'guild-animations';\n  el.textContent = GUILD_ANIMATIONS_CSS;\n  document.head.appendChild(el);\n  return () => el.remove();\n}, []);`,
  },
];

function AddGuideTab() {
  const [expandedStep, setExpandedStep] = useState<number | null>(1);

  return (
    <div className="max-w-3xl space-y-5">
      {/* Architecture overview */}
      <div className="rounded-2xl p-5" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
        <div style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: '0.15em', marginBottom: 16 }}>── KIẾN TRÚC HỆ THỐNG HIỆU ỨNG (4 LAYERS)</div>
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
          {[
            { layer: 1, name: 'CSS Keyframes', desc: 'GUILD_ANIMATIONS_CSS string trong MemberCard', color: DS.amber, icon: '⚡' },
            { layer: 2, name: 'React Components', desc: 'CometLine, Particles, DiamondPrism... trong MemberCard', color: DS.blue, icon: '⚛' },
            { layer: 3, name: 'Motion Props', desc: 'getRankEntranceProps() per-rank entrance animations', color: DS.purple, icon: '🎬' },
            { layer: 4, name: 'Addon Store', desc: 'loopStore INIT_EFFECTS → EffectRenderer', color: DS.green, icon: '🔌' },
          ].map(l => (
            <div key={l.layer} className="rounded-xl p-3" style={{ background: DS.bgCard2, border: `1px solid ${l.color}20` }}>
              <div style={{ fontSize: 24, marginBottom: 6 }}>{l.icon}</div>
              <div style={{ color: l.color, fontSize: 11, fontFamily: DS.mono, fontWeight: 700, marginBottom: 4 }}>Layer {l.layer}: {l.name}</div>
              <div style={{ color: DS.text4, fontSize: 11, lineHeight: 1.5 }}>{l.desc}</div>
            </div>
          ))}
        </div>
        <div className="mt-4 p-3 rounded-xl flex items-start gap-3" style={{ background: `${DS.blue}06`, border: `1px solid ${DS.blue}18` }}>
          <Info size={14} style={{ color: DS.blue, flexShrink: 0, marginTop: 1 }} />
          <div style={{ color: DS.text4, fontSize: 12, lineHeight: 1.6 }}>
            Layer 1–3 là <strong style={{ color: DS.text3 }}>hardcode</strong> — hiệu ứng luôn có mặt theo rank, không cần admin quản lý. Layer 4 là <strong style={{ color: DS.text3 }}>plugin-style</strong> — thêm qua loopStore, toggle per-member, preview qua EffectRenderer.
          </div>
        </div>
      </div>

      {/* Steps */}
      <div style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: '0.15em' }}>── HƯỚNG DẪN THÊM HIỆU ỨNG MỚI</div>
      <div className="space-y-3">
        {ADD_GUIDE_STEPS.map(step => (
          <div key={step.num} className="rounded-2xl overflow-hidden" style={{ background: DS.bgCard, border: `1px solid ${expandedStep === step.num ? step.color + '40' : DS.border}` }}>
            <button onClick={() => setExpandedStep(expandedStep === step.num ? null : step.num)}
              className="w-full flex items-center gap-4 p-4 text-left"
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${step.color}15`, border: `1px solid ${step.color}30` }}>
                <span style={{ color: step.color, fontFamily: DS.mono, fontSize: 14, fontWeight: 700 }}>{step.num}</span>
              </div>
              <div className="flex-1">
                <div style={{ color: step.color, fontSize: 13, fontWeight: 700 }}>Step {step.num}: {step.label}</div>
                <div style={{ color: DS.text5, fontSize: 11, fontFamily: DS.mono, marginTop: 2 }}>/{step.file}</div>
              </div>
              <div style={{ color: DS.text5 }}>
                {expandedStep === step.num ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
            </button>
            <AnimatePresence>
              {expandedStep === step.num && (
                <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} style={{ overflow: 'hidden' }}>
                  <div className="px-4 pb-4 space-y-3" style={{ borderTop: `1px solid ${DS.border}` }}>
                    <div className="flex items-start gap-2 pt-3">
                      <ChevronRight size={12} style={{ color: step.color, flexShrink: 0, marginTop: 2 }} />
                      <p style={{ color: DS.text3, fontSize: 13, lineHeight: 1.65 }}>{step.description}</p>
                    </div>
                    <CodeBlock code={step.code} title={step.file} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      {/* Quick reference */}
      <div className="rounded-2xl p-5" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
        <div style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: '0.15em', marginBottom: 14 }}>── QUICK REFERENCE: FILES QUAN TRỌNG</div>
        <div className="space-y-2">
          {[
            { file: 'components/team/MemberCard.tsx', desc: 'Tất cả Layer 1–3 effects, GUILD_ANIMATIONS_CSS, component effects', color: DS.blue },
            { file: 'components/team/LEDRunner.tsx',  desc: 'LED border neon effect (SVG animation, resize-aware)', color: DS.cyan },
            { file: 'components/ui/EffectRenderer.tsx', desc: 'Layer 4 addon renderer (particle, glow, border, aura, badge, trail)', color: DS.purple },
            { file: 'store/loopStore.ts → INIT_EFFECTS', desc: 'Danh sách addon effects mặc định, thêm entry mới ở đây', color: DS.green },
            { file: 'Home.tsx → useEffect(GUILD_ANIMATIONS_CSS)', desc: 'Inject keyframes cho trang /doi-ngu', color: DS.amber },
          ].map(r => (
            <div key={r.file} className="flex items-start gap-3 p-3 rounded-xl" style={{ background: DS.bgCard2, border: `1px solid ${DS.border}` }}>
              <Layers size={13} style={{ color: r.color, flexShrink: 0, marginTop: 2 }} />
              <div>
                <div style={{ color: r.color, fontSize: 11, fontFamily: DS.mono, fontWeight: 700 }}>/{r.file}</div>
                <div style={{ color: DS.text4, fontSize: 11, marginTop: 2 }}>{r.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── MAIN ────────────────────────────────────────────────────────────────────

export function EffectsTab() {
  const { effects, globalEffectsEnabled, memberEffectOverrides, setGlobalEffectsEnabled } = useLoopStore();
  const [activeTab, setActiveTab] = useState<'builtin' | 'addon' | 'members' | 'guide'>('builtin');

  const enabledCount = effects.filter(e => e.enabled).length;
  const stats = [
    { label: 'Hiệu ứng tích hợp', value: String(BUILTIN_EFFECTS.length), color: DS.blue,   icon: <Cpu size={16} /> },
    { label: 'Addon Effects',      value: String(effects.length),         color: DS.purple,  icon: <Sparkles size={16} /> },
    { label: 'Addon đang bật',     value: String(enabledCount),           color: DS.green,   icon: <Eye size={16} /> },
    { label: 'TV có override',     value: String(new Set(memberEffectOverrides.map(o => o.memberId)).size), color: DS.amber, icon: <Users size={16} /> },
  ];

  const TABS = [
    { id: 'builtin' as const,  label: 'Hiệu ứng tích hợp', icon: <Cpu size={13} />,      badge: BUILTIN_EFFECTS.length },
    { id: 'addon' as const,    label: 'Addon Effects',       icon: <Sparkles size={13} />, badge: effects.length },
    { id: 'members' as const,  label: 'Theo thành viên',     icon: <Users size={13} />,    badge: null },
    { id: 'guide' as const,    label: 'Hướng dẫn thêm mới', icon: <BookOpen size={13} />, badge: null },
  ];

  return (
    <div className="space-y-5">
      {/* Global toggle */}
      <div className="flex items-center justify-between p-5 rounded-2xl"
        style={{ background: DS.bgCard, border: `1px solid ${globalEffectsEnabled ? DS.green + '30' : DS.red + '30'}` }}>
        <div className="flex items-center gap-4">
          <motion.div className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ background: globalEffectsEnabled ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)', border: `1px solid ${globalEffectsEnabled ? DS.green : DS.red}30` }}
            animate={{ boxShadow: globalEffectsEnabled ? [`0 0 0px ${DS.green}00`, `0 0 16px ${DS.green}50`, `0 0 0px ${DS.green}00`] : 'none' }}
            transition={{ duration: 2, repeat: Infinity }}>
            <Sparkles size={20} style={{ color: globalEffectsEnabled ? DS.green : DS.red }} />
          </motion.div>
          <div>
            <div style={{ color: DS.text, fontSize: 16, fontWeight: 700 }}>Hiệu ứng Rank toàn cục</div>
            <div style={{ color: DS.text4, fontSize: 12, marginTop: 2 }}>
              {globalEffectsEnabled
                ? `${BUILTIN_EFFECTS.length} built-in + ${enabledCount} addon đang hiển thị trên toàn site`
                : 'Tất cả hiệu ứng đã bị tắt trên toàn bộ trang web'}
            </div>
          </div>
        </div>
        <button onClick={() => setGlobalEffectsEnabled(!globalEffectsEnabled)}
          className="w-14 h-7 rounded-full relative" style={{ background: globalEffectsEnabled ? DS.green : DS.border, border: 'none', cursor: 'pointer', flexShrink: 0 }}>
          <div className="absolute top-0.5 w-6 h-6 rounded-full" style={{ background: '#fff', left: globalEffectsEnabled ? 'calc(100% - 26px)' : 2, transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }} />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className="p-4 rounded-2xl" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: `${s.color}15`, border: `1px solid ${s.color}25` }}>
              <span style={{ color: s.color }}>{s.icon}</span>
            </div>
            <div style={{ color: s.color, fontFamily: DS.heading, fontSize: 22, fontWeight: 700 }}>{s.value}</div>
            <div style={{ color: DS.text3, fontSize: 12, marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl"
            style={{ background: activeTab === tab.id ? 'rgba(59,130,246,0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid ${activeTab === tab.id ? DS.blue + '40' : DS.border}`, color: activeTab === tab.id ? DS.blue : DS.text3, fontSize: 12, cursor: 'pointer' }}>
            {tab.icon} {tab.label}
            {tab.badge !== null && (
              <span style={{ background: activeTab === tab.id ? DS.blue : DS.border, color: activeTab === tab.id ? '#fff' : DS.text5, borderRadius: 99, padding: '0 6px', fontSize: 9, fontFamily: DS.mono }}>
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}>
          {activeTab === 'builtin'  && <BuiltinTab />}
          {activeTab === 'addon'    && <AddonEffectsTab />}
          {activeTab === 'members'  && <MembersTab />}
          {activeTab === 'guide'    && <AddGuideTab />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
