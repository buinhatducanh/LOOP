/**
 * EffectsInventoryTab — Kho hiệu ứng người dùng (Customer)
 * Giao diện game inventory: grid trái + preview avatar phải
 */
import { useState, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles, Lock, CheckCircle2, Zap, Shield, Crown, Award, Star,
  RotateCcw, Save,
} from 'lucide-react';
import { DS, GRD } from '../layout/ds';
import { RANKS, type RankKey } from '../team/memberData';
import { useLoopStore, type RankEffect } from '../../store/loopStore';
import { EffectRenderer } from '../ui/EffectRenderer';

// ── Config ──────────────────────────────────────────────────────────────────

const RARITY_CFG = {
  common:    { label: 'Phổ thông',   color: '#9CA3AF', bg: 'rgba(156,163,175,0.1)' },
  rare:      { label: 'Hiếm',        color: '#3B82F6', bg: 'rgba(59,130,246,0.1)' },
  epic:      { label: 'Sử thi',      color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)' },
  legendary: { label: 'Huyền thoại', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
};

const TYPE_ICON: Record<string, ReactNode> = {
  particle: <Sparkles size={11} />,
  glow:     <Zap size={11} />,
  border:   <Shield size={11} />,
  aura:     <Crown size={11} />,
  badge:    <Award size={11} />,
  trail:    <Star size={11} />,
};

// ── Customer info ───────────────────────────────────────────────────────────
const CUSTOMER = {
  name: 'Nguyễn Minh Tuấn',
  rank: 'gold' as RankKey,
  level: 12,
  avatar: 'https://images.unsplash.com/photo-1746105625407-5d49d69a2a47?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
};

// ── Effect Slot indicator ────────────────────────────────────────────────────
function EquipSlots({ equippedIds, effects, onUnequip }: {
  equippedIds: string[];
  effects: RankEffect[];
  onUnequip: (id: string) => void;
}) {
  const SLOTS = 3;
  return (
    <div className="flex gap-2">
      {Array.from({ length: SLOTS }, (_, i) => {
        const eff = effects.find(e => e.id === equippedIds[i]);
        const rankColor = eff ? (eff.color ?? RANKS[eff.unlockRank].color) : DS.border;
        return (
          <div key={i} style={{ flex: 1 }}>
            {eff ? (
              <motion.button
                onClick={() => onUnequip(eff.id)}
                className="w-full flex flex-col items-center gap-1 p-2 rounded-xl"
                style={{ background: `${rankColor}12`, border: `1.5px solid ${rankColor}50`, cursor: 'pointer', minHeight: 60, position: 'relative' }}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}>
                <span style={{ fontSize: 20 }}>{eff.preview}</span>
                <span style={{ color: rankColor, fontSize: 8, fontFamily: DS.mono, textAlign: 'center', lineHeight: 1.2 }}>{eff.name.slice(0, 12)}{eff.name.length > 12 ? '…' : ''}</span>
                <div style={{ position: 'absolute', top: 3, right: 3, width: 14, height: 14, borderRadius: '50%', background: DS.red, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ color: '#fff', fontSize: 9, lineHeight: 1 }}>×</span>
                </div>
              </motion.button>
            ) : (
              <div className="w-full flex flex-col items-center justify-center rounded-xl"
                style={{ border: `1.5px dashed ${DS.border}`, minHeight: 60, opacity: 0.5 }}>
                <span style={{ color: DS.text5, fontSize: 18 }}>·</span>
                <span style={{ color: DS.text5, fontSize: 8, fontFamily: DS.mono }}>Slot {i + 1}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Avatar Preview with effects ──────────────────────────────────────────────
function AvatarPreview({ equippedEffects }: { equippedEffects: RankEffect[] }) {
  const rc = RANKS[CUSTOMER.rank];
  return (
    <div className="flex flex-col items-center gap-4 py-6 px-4 rounded-2xl relative overflow-hidden"
      style={{ background: DS.bgCard2, border: `1px solid ${DS.border}` }}>
      {/* Animated BG */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {equippedEffects.map((eff, i) => {
          const c = eff.color ?? RANKS[eff.unlockRank].color;
          return (
            <motion.div key={eff.id}
              style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at ${30 + i * 20}% ${40 + i * 15}%, ${c}08, transparent 55%)` }}
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 3 + i, repeat: Infinity }} />
          );
        })}
      </div>

      {/* Label */}
      <div style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono, letterSpacing: '0.2em', zIndex: 1 }}>PREVIEW TRỰC TIẾP</div>

      {/* Avatar with effects */}
      <EffectRenderer effects={equippedEffects} size={110} borderRadius={22}>
        <img src={CUSTOMER.avatar} alt={CUSTOMER.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 22, display: 'block' }} />
      </EffectRenderer>

      {/* Name & Rank */}
      <div style={{ textAlign: 'center', zIndex: 1 }}>
        <div style={{ color: DS.text, fontSize: 15, fontWeight: 700 }}>{CUSTOMER.name}</div>
        <div style={{ color: rc.color, fontSize: 10, fontFamily: DS.mono, marginTop: 2 }}>{rc.symbol} {rc.label} · Lv.{CUSTOMER.level}</div>
      </div>

      {/* Active effect labels */}
      {equippedEffects.length > 0 && (
        <div className="flex flex-wrap gap-1.5 justify-center" style={{ zIndex: 1 }}>
          {equippedEffects.map(eff => {
            const c = eff.color ?? RANKS[eff.unlockRank].color;
            return (
              <span key={eff.id} style={{ color: c, background: `${c}15`, border: `1px solid ${c}30`, borderRadius: 6, padding: '2px 8px', fontSize: 9, fontFamily: DS.mono }}>
                {eff.preview} {eff.name}
              </span>
            );
          })}
        </div>
      )}
      {equippedEffects.length === 0 && (
        <div style={{ color: DS.text5, fontSize: 11, fontFamily: DS.mono, zIndex: 1 }}>Chưa trang bị hiệu ứng nào</div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-2 w-full" style={{ zIndex: 1 }}>
        {[
          { label: 'Đang dùng', value: `${equippedEffects.length}/3`, color: DS.blue },
          { label: 'Rank',     value: rc.label, color: rc.color },
        ].map(s => (
          <div key={s.label} className="rounded-xl p-2.5 text-center" style={{ background: `${s.color}08`, border: `1px solid ${s.color}20` }}>
            <div style={{ color: s.color, fontFamily: DS.mono, fontSize: 13, fontWeight: 700 }}>{s.value}</div>
            <div style={{ color: DS.text5, fontSize: 9 }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Effect Card (inventory item) ────────────────────────────────────────────
function EffectCard({
  effect, isUnlocked, isEquipped, isSelected, onSelect, onEquip,
}: {
  effect: RankEffect;
  isUnlocked: boolean;
  isEquipped: boolean;
  isSelected: boolean;
  onSelect: () => void;
  onEquip: () => void;
}) {
  const rc = RANKS[effect.unlockRank];
  const rr = RARITY_CFG[effect.rarity];
  const rankColor = effect.color ?? rc.color;

  return (
    <motion.div
      onClick={isUnlocked ? onSelect : undefined}
      className="rounded-xl p-3 cursor-pointer relative overflow-hidden"
      style={{
        background: isSelected ? `${rankColor}15` : isEquipped ? `${rankColor}08` : DS.bgCard2,
        border: `1.5px solid ${isSelected ? rankColor : isEquipped ? rankColor + '50' : DS.border}`,
        opacity: isUnlocked ? 1 : 0.45,
        filter: isUnlocked ? 'none' : 'grayscale(0.6)',
        cursor: isUnlocked ? 'pointer' : 'not-allowed',
      }}
      whileHover={isUnlocked ? { scale: 1.02, y: -1 } : {}}
      whileTap={isUnlocked ? { scale: 0.98 } : {}}
    >
      {/* Rarity glow bg */}
      {isUnlocked && (effect.rarity === 'legendary' || effect.rarity === 'epic') && (
        <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at top, ${rr.color}10, transparent 70%)`, pointerEvents: 'none' }} />
      )}

      {/* Lock overlay */}
      {!isUnlocked && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(2,6,23,0.4)', zIndex: 5, borderRadius: 10 }}>
          <Lock size={18} style={{ color: DS.text5 }} />
        </div>
      )}

      {/* Equipped checkmark */}
      {isEquipped && (
        <div style={{ position: 'absolute', top: 6, right: 6, zIndex: 6 }}>
          <motion.div
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 2, repeat: Infinity }}>
            <CheckCircle2 size={14} style={{ color: rankColor, filter: `drop-shadow(0 0 4px ${rankColor})` }} />
          </motion.div>
        </div>
      )}

      {/* Content */}
      <div className="flex items-start gap-2.5 relative" style={{ zIndex: 2 }}>
        {/* Icon */}
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-xl"
          style={{ background: `linear-gradient(135deg, ${rc.gradientFrom}50, ${rc.gradientTo}50)`, border: `1px solid ${rankColor}30` }}>
          {effect.preview}
        </div>

        <div className="flex-1 min-w-0">
          <div style={{ color: isUnlocked ? DS.text : DS.text5, fontSize: 12, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{effect.name}</div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span style={{ color: rr.color, fontSize: 8, fontFamily: DS.mono, background: rr.bg, border: `1px solid ${rr.color}25`, borderRadius: 4, padding: '1px 5px' }}>{rr.label}</span>
            <span className="flex items-center gap-0.5" style={{ color: DS.text5, fontSize: 9 }}>
              {TYPE_ICON[effect.type]}{' '}{effect.type}
            </span>
          </div>
          {!isUnlocked && (
            <div className="flex items-center gap-1 mt-1">
              <Lock size={8} style={{ color: DS.text5 }} />
              <span style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono }}>{rc.label} Lv.{effect.unlockLevel}+</span>
            </div>
          )}
        </div>
      </div>

      {/* Quick equip button (shown when selected) */}
      <AnimatePresence>
        {isSelected && isUnlocked && (
          <motion.button
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: 32, marginTop: 8 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            onClick={e => { e.stopPropagation(); onEquip(); }}
            className="w-full rounded-lg flex items-center justify-center gap-1.5"
            style={{
              background: isEquipped ? `${DS.red}15` : `${rankColor}20`,
              border: `1px solid ${isEquipped ? DS.red + '40' : rankColor + '50'}`,
              color: isEquipped ? DS.red : rankColor,
              fontSize: 11, fontWeight: 700, fontFamily: DS.mono, cursor: 'pointer',
              overflow: 'hidden',
            }}
          >
            {isEquipped ? <>× Tháo ra</> : <><Sparkles size={11} /> Trang bị</>}
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── MAIN ────────────────────────────────────────────────────────────────────

export function EffectsInventoryTab() {
  const { effects, globalEffectsEnabled, userEquippedEffects, equipUserEffect, clearUserEffects } = useLoopStore();
  const [selectedId, setSelectedId] = useState<string | null>(userEquippedEffects[0] ?? null);
  const [filterRarity, setFilterRarity] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'unlocked' | 'equipped'>('all');
  const [saved, setSaved] = useState(false);

  const rc = RANKS[CUSTOMER.rank];

  // Which effects is this customer tier-unlocked (rank tier check, ignoring level for customers)
  const isEffectUnlocked = (eff: RankEffect) => {
    const effTier = RANKS[eff.unlockRank].tier;
    const customerTier = rc.tier;
    return customerTier >= effTier && eff.enabled && globalEffectsEnabled;
  };

  const equippedEffectObjects = effects.filter(e => userEquippedEffects.includes(e.id));
  const selectedEffect = effects.find(e => e.id === selectedId) ?? null;

  // Filter
  const filteredEffects = effects.filter(eff => {
    if (!eff.enabled) return false;
    if (filterRarity !== 'all' && eff.rarity !== filterRarity) return false;
    if (filterStatus === 'unlocked' && !isEffectUnlocked(eff)) return false;
    if (filterStatus === 'equipped' && !userEquippedEffects.includes(eff.id)) return false;
    return true;
  });

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const unlockedCount = effects.filter(e => isEffectUnlocked(e)).length;

  return (
    <div className="space-y-5">
      {/* Header stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {[
          { label: 'Đã mở khóa',  value: `${unlockedCount}/${effects.length}`, color: DS.blue,   icon: <Sparkles size={16} /> },
          { label: 'Đang trang bị', value: `${userEquippedEffects.length}/3`,   color: rc.color,  icon: <CheckCircle2 size={16} /> },
          { label: 'Huyền thoại', value: String(effects.filter(e => e.rarity === 'legendary' && isEffectUnlocked(e)).length), color: DS.amber, icon: <Crown size={16} /> },
          { label: 'Rank hiện tại', value: rc.label,                           color: rc.color,  icon: <Shield size={16} /> },
        ].map(s => (
          <div key={s.label} className="p-4 rounded-2xl" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-2" style={{ background: `${s.color}15`, border: `1px solid ${s.color}25` }}>
              <span style={{ color: s.color }}>{s.icon}</span>
            </div>
            <div style={{ color: s.color, fontFamily: DS.heading, fontSize: 20, fontWeight: 700 }}>{s.value}</div>
            <div style={{ color: DS.text4, fontSize: 11, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Main 2-col layout */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">

        {/* LEFT: Inventory grid (3 cols) */}
        <div className="xl:col-span-3 space-y-4">

          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            {/* Status filter */}
            {[
              { id: 'all',      label: 'Tất cả' },
              { id: 'unlocked', label: 'Đã mở' },
              { id: 'equipped', label: 'Đang dùng' },
            ].map(f => (
              <button key={f.id}
                onClick={() => setFilterStatus(f.id as any)}
                className="px-3 py-1.5 rounded-xl"
                style={{ background: filterStatus === f.id ? 'rgba(59,130,246,0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid ${filterStatus === f.id ? DS.blue + '40' : DS.border}`, color: filterStatus === f.id ? DS.blue : DS.text4, fontSize: 11, cursor: 'pointer', fontFamily: DS.mono }}>
                {f.label}
              </button>
            ))}
            <div style={{ width: 1, background: DS.border, margin: '0 2px' }} />
            {/* Rarity filter */}
            {[{ id: 'all', label: 'Tất cả độ hiếm', color: DS.text4 }, ...Object.entries(RARITY_CFG).map(([k, v]) => ({ id: k, label: v.label, color: v.color }))].map(f => (
              <button key={f.id}
                onClick={() => setFilterRarity(f.id)}
                className="px-3 py-1.5 rounded-xl"
                style={{ background: filterRarity === f.id ? `${f.color}12` : 'rgba(255,255,255,0.03)', border: `1px solid ${filterRarity === f.id ? f.color + '40' : DS.border}`, color: filterRarity === f.id ? f.color : DS.text4, fontSize: 11, cursor: 'pointer' }}>
                {f.label}
              </button>
            ))}
          </div>

          {/* Grid */}
          <div className="rounded-2xl p-4" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
            <div className="flex items-center justify-between mb-4">
              <div style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: '0.15em' }}>
                ── KHO HIỆU ỨNG · {filteredEffects.length} hiệu ứng
              </div>
              <div style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono }}>
                Nhấp để chọn · Nhấp lại để trang bị
              </div>
            </div>

            {filteredEffects.length === 0 ? (
              <div className="py-12 text-center" style={{ color: DS.text5 }}>
                <Sparkles size={28} style={{ opacity: 0.3, margin: '0 auto 10px' }} />
                <div style={{ fontSize: 13 }}>Không có hiệu ứng phù hợp</div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2.5">
                {filteredEffects.map(eff => (
                  <EffectCard
                    key={eff.id}
                    effect={eff}
                    isUnlocked={isEffectUnlocked(eff)}
                    isEquipped={userEquippedEffects.includes(eff.id)}
                    isSelected={selectedId === eff.id}
                    onSelect={() => setSelectedId(prev => prev === eff.id ? null : eff.id)}
                    onEquip={() => { equipUserEffect(eff.id); }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Unlock roadmap teaser */}
          <div className="rounded-2xl p-4" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
            <div style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: '0.15em', marginBottom: 12 }}>── LỘ TRÌNH MỞ KHÓA</div>
            <div className="flex gap-2 overflow-x-auto scrollbar-zen pb-1">
              {(['iron','bronze','silver','gold','platinum','ruby','diamond'] as RankKey[]).map(rk => {
                const rankCfg = RANKS[rk];
                const rankEffects = effects.filter(e => e.unlockRank === rk);
                const unlocked = rc.tier >= rankCfg.tier;
                return (
                  <div key={rk} className="flex flex-col items-center gap-1.5 flex-shrink-0"
                    style={{ opacity: unlocked ? 1 : 0.4, minWidth: 64 }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-base"
                      style={{ background: unlocked ? `linear-gradient(135deg, ${rankCfg.gradientFrom}, ${rankCfg.gradientTo})` : DS.bgCard2, border: `1px solid ${unlocked ? rankCfg.color : DS.border}`, boxShadow: unlocked ? `0 0 10px ${rankCfg.glowColor}` : 'none' }}>
                      {unlocked ? rankCfg.symbol : <Lock size={12} style={{ color: DS.text5 }} />}
                    </div>
                    <div style={{ color: unlocked ? rankCfg.color : DS.text5, fontSize: 8, fontFamily: DS.mono, textAlign: 'center' }}>{rankCfg.label}</div>
                    <div style={{ color: DS.text5, fontSize: 8 }}>{rankEffects.length} HU</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT: Preview + equip panel (2 cols) */}
        <div className="xl:col-span-2 space-y-4" style={{ position: 'sticky', top: 0 }}>

          {/* Equip slots */}
          <div className="rounded-2xl p-4" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
            <div className="flex items-center justify-between mb-3">
              <div style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: '0.15em' }}>── ĐANG TRANG BỊ</div>
              <button onClick={clearUserEffects}
                className="flex items-center gap-1"
                style={{ color: DS.text5, background: 'none', border: 'none', cursor: 'pointer', fontSize: 10, fontFamily: DS.mono }}>
                <RotateCcw size={10} /> Xóa tất cả
              </button>
            </div>
            <EquipSlots equippedIds={userEquippedEffects} effects={effects} onUnequip={equipUserEffect} />
          </div>

          {/* Live avatar preview */}
          <AvatarPreview equippedEffects={equippedEffectObjects} />

          {/* Selected effect detail */}
          <AnimatePresence mode="wait">
            {selectedEffect && (
              <motion.div
                key={selectedEffect.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="rounded-2xl p-4"
                style={{ background: DS.bgCard, border: `1px solid ${(selectedEffect.color ?? RANKS[selectedEffect.unlockRank].color) + '30'}` }}>
                <div style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: '0.15em', marginBottom: 12 }}>── CHI TIẾT HIỆU ỨNG</div>

                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                    style={{ background: `linear-gradient(135deg, ${RANKS[selectedEffect.unlockRank].gradientFrom}60, ${RANKS[selectedEffect.unlockRank].gradientTo}60)`, border: `1px solid ${(selectedEffect.color ?? RANKS[selectedEffect.unlockRank].color)}30` }}>
                    {selectedEffect.preview}
                  </div>
                  <div>
                    <div style={{ color: DS.text, fontSize: 14, fontWeight: 700 }}>{selectedEffect.name}</div>
                    <div style={{ color: DS.text4, fontSize: 12, marginTop: 2 }}>{selectedEffect.description}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-3">
                  {[
                    { label: 'Loại', value: selectedEffect.type, color: DS.cyan },
                    { label: 'Độ hiếm', value: RARITY_CFG[selectedEffect.rarity].label, color: RARITY_CFG[selectedEffect.rarity].color },
                    { label: 'Yêu cầu Rank', value: RANKS[selectedEffect.unlockRank].label, color: RANKS[selectedEffect.unlockRank].color },
                    { label: 'Yêu cầu Lv.', value: `${selectedEffect.unlockLevel}+`, color: DS.text3 },
                  ].map(item => (
                    <div key={item.label} className="rounded-lg p-2.5" style={{ background: DS.bgCard2, border: `1px solid ${DS.border}` }}>
                      <div style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono, marginBottom: 2 }}>{item.label}</div>
                      <div style={{ color: item.color, fontSize: 12, fontWeight: 700, fontFamily: DS.mono }}>{item.value}</div>
                    </div>
                  ))}
                </div>

                <motion.button
                  onClick={() => equipUserEffect(selectedEffect.id)}
                  className="w-full py-3 rounded-xl flex items-center justify-center gap-2"
                  style={{
                    background: userEquippedEffects.includes(selectedEffect.id)
                      ? `${DS.red}15`
                      : isEffectUnlocked(selectedEffect)
                        ? `linear-gradient(135deg, ${RANKS[selectedEffect.unlockRank].gradientFrom}40, ${RANKS[selectedEffect.unlockRank].gradientTo}40)`
                        : DS.bgCard2,
                    border: `1.5px solid ${userEquippedEffects.includes(selectedEffect.id) ? DS.red + '40' : isEffectUnlocked(selectedEffect) ? (selectedEffect.color ?? RANKS[selectedEffect.unlockRank].color) + '50' : DS.border}`,
                    color: userEquippedEffects.includes(selectedEffect.id) ? DS.red : isEffectUnlocked(selectedEffect) ? (selectedEffect.color ?? RANKS[selectedEffect.unlockRank].color) : DS.text5,
                    cursor: isEffectUnlocked(selectedEffect) ? 'pointer' : 'not-allowed',
                    fontSize: 13, fontWeight: 700,
                  }}
                  whileHover={isEffectUnlocked(selectedEffect) ? { scale: 1.01 } : {}}
                  whileTap={isEffectUnlocked(selectedEffect) ? { scale: 0.99 } : {}}>
                  {!isEffectUnlocked(selectedEffect) ? (
                    <><Lock size={14} /> Chưa mở khóa</>
                  ) : userEquippedEffects.includes(selectedEffect.id) ? (
                    <>× Tháo hiệu ứng</>
                  ) : userEquippedEffects.length >= 3 ? (
                    <><Sparkles size={14} /> Thay thế slot cũ nhất</>
                  ) : (
                    <><Sparkles size={14} /> Trang bị ngay</>
                  )}
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Save button */}
          <motion.button
            onClick={handleSave}
            className="w-full py-3 rounded-2xl flex items-center justify-center gap-2"
            style={{
              background: saved ? 'rgba(34,197,94,0.15)' : GRD.primary,
              border: saved ? `1px solid ${DS.green}40` : 'none',
              color: saved ? DS.green : '#fff',
              fontSize: 14, fontWeight: 700, cursor: 'pointer',
              boxShadow: saved ? 'none' : '0 0 20px rgba(129,140,248,0.35)',
            }}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}>
            {saved ? (
              <><CheckCircle2 size={16} /> Đã lưu cài đặt!</>
            ) : (
              <><Save size={15} /> Lưu cài đặt hiệu ứng</>
            )}
          </motion.button>
        </div>
      </div>
    </div>
  );
}