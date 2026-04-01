/**
 * EffectRenderer — Renders rank effects visually on an avatar/card
 * Used by both AdminEffectsTab (preview) and CustomerEffectsInventory
 */
import { useRef, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { RANKS } from '@/components/landing/guild/memberData';
import type { RankEffect } from '@/app/store/loopStore';

// ── Particle Effect ────────────────────────────────────────────────────────
function ParticleEffect({ color, count = 6, size = 120 }: { color: string; count?: number; size?: number }) {
  const particles = Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * 360;
    const radius = size * 0.42;
    const x = Math.cos((angle * Math.PI) / 180) * radius;
    const y = Math.sin((angle * Math.PI) / 180) * radius;
    const delay = (i / count) * 2;
    return { x, y, delay, angle };
  });

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      {particles.map((p, i) => (
        <motion.div
          key={i}
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: 5,
            height: 5,
            borderRadius: '50%',
            backgroundColor: color,
            boxShadow: `0 0 6px ${color}, 0 0 12px ${color}`,
            translateX: p.x - 2.5,
            translateY: p.y - 2.5,
          }}
          animate={{
            scale: [0.6, 1.2, 0.6],
            opacity: [0.4, 1, 0.4],
            translateX: [p.x - 2.5, p.x * 1.2 - 2.5, p.x - 2.5],
            translateY: [p.y - 2.5, p.y * 1.2 - 2.5, p.y - 2.5],
          }}
          transition={{ duration: 2 + p.delay * 0.3, repeat: Infinity, delay: p.delay, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

// ── Aura Effect ────────────────────────────────────────────────────────────
function AuraEffect({ color }: { color: string }) {
  return (
    <motion.div
      style={{
        position: 'absolute',
        inset: -12,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${color}30 0%, ${color}10 50%, transparent 75%)`,
        pointerEvents: 'none',
      }}
      animate={{ scale: [1, 1.12, 1], opacity: [0.6, 1, 0.6] }}
      transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
    />
  );
}

// ── Glow Effect ────────────────────────────────────────────────────────────
function GlowEffect({ color }: { color: string }) {
  return (
    <motion.div
      style={{
        position: 'absolute',
        inset: 0,
        borderRadius: 'inherit',
        pointerEvents: 'none',
      }}
      animate={{
        boxShadow: [
          `0 0 0px ${color}00`,
          `0 0 20px ${color}80, 0 0 40px ${color}40`,
          `0 0 0px ${color}00`,
        ],
      }}
      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
    />
  );
}

// ── Border Effect ──────────────────────────────────────────────────────────
function BorderEffect({ color, neon = false }: { color: string; neon?: boolean }) {
  return (
    <motion.div
      style={{
        position: 'absolute',
        inset: -2,
        borderRadius: 'inherit',
        padding: 2,
        background: `conic-gradient(from 0deg, ${color}, ${color}44, ${color}88, ${color}44, ${color})`,
        WebkitMaskImage: 'linear-gradient(#fff 0 0)',
        maskImage: 'linear-gradient(#fff 0 0)',
        WebkitMaskComposite: 'xor',
        maskComposite: 'exclude',
        pointerEvents: 'none',
      }}
      animate={{ rotate: 360 }}
      transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
    >
      {neon && (
        <motion.div
          style={{ position: 'absolute', inset: 0, borderRadius: 'inherit' }}
          animate={{ boxShadow: [`0 0 6px ${color}`, `0 0 14px ${color}, 0 0 28px ${color}50`, `0 0 6px ${color}`] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      )}
    </motion.div>
  );
}

// ── Badge Effect ───────────────────────────────────────────────────────────
function BadgeEffect({ emoji = '🌟', color }: { emoji: string; color: string }) {
  return (
    <motion.div
      style={{
        position: 'absolute',
        top: -8,
        right: -8,
        width: 24,
        height: 24,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${color}40, ${color}10)`,
        border: `1.5px solid ${color}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 12,
        boxShadow: `0 0 10px ${color}`,
        pointerEvents: 'none',
        zIndex: 10,
      }}
      animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
    >
      {emoji}
    </motion.div>
  );
}

// ── Trail Effect ───────────────────────────────────────────────────────────
function TrailEffect({ color }: { color: string }) {
  return (
    <>
      {[0, 1, 2].map(i => (
        <motion.div
          key={i}
          style={{
            position: 'absolute',
            left: -20 - i * 12,
            top: '50%',
            width: 10 - i * 2,
            height: 3,
            borderRadius: 99,
            backgroundColor: color,
            opacity: 0.7 - i * 0.2,
            translateY: -1.5,
            pointerEvents: 'none',
          }}
          animate={{ scaleX: [1, 0.6, 1], opacity: [0.7 - i * 0.2, 0.2, 0.7 - i * 0.2] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </>
  );
}

// ── Main EffectRenderer ────────────────────────────────────────────────────

interface EffectRendererProps {
  effects: RankEffect[];
  children: ReactNode;
  size?: number;
  borderRadius?: number | string;
}

export function EffectRenderer({ effects, children, size = 80, borderRadius = 16 }: EffectRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: size,
        height: size,
        borderRadius,
        flexShrink: 0,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {effects.map(effect => {
        const rankColor = effect.color ?? RANKS[effect.unlockRank].color;
        switch (effect.type) {
          case 'particle': return <ParticleEffect key={effect.id} color={rankColor} count={effect.rarity === 'epic' ? 12 : 6} size={size} />;
          case 'aura':     return <AuraEffect key={effect.id} color={rankColor} />;
          case 'glow':     return <GlowEffect key={effect.id} color={rankColor} />;
          case 'border':   return <BorderEffect key={effect.id} color={rankColor} neon={effect.cssConfig.includes('neon')} />;
          case 'badge':    return <BadgeEffect key={effect.id} emoji={effect.preview} color={rankColor} />;
          case 'trail':    return <TrailEffect key={effect.id} color={rankColor} />;
          default:         return null;
        }
      })}
      <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', borderRadius }}>
        {children}
      </div>
    </div>
  );
}

// ── Standalone Effect Preview (admin/shop card use) ───────────────────────

interface EffectPreviewCardProps {
  effect: RankEffect;
  avatarSrc?: string;
  size?: number;
  showLabel?: boolean;
}

export function EffectPreviewCard({ effect, avatarSrc, size = 80, showLabel = false }: EffectPreviewCardProps) {
  const rankColor = effect.color ?? RANKS[effect.unlockRank].color;
  const rc = RANKS[effect.unlockRank];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <EffectRenderer effects={[effect]} size={size} borderRadius={size * 0.2}>
        {avatarSrc ? (
          <img
            src={avatarSrc}
            alt="preview"
            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit', display: 'block' }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              borderRadius: 'inherit',
              background: `linear-gradient(135deg, ${rc.gradientFrom}, ${rc.gradientTo})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: size * 0.35,
            }}
          >
            {effect.preview}
          </div>
        )}
      </EffectRenderer>
      {showLabel && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: rankColor, fontSize: 11, fontWeight: 700 }}>{effect.name}</div>
          <div style={{ color: '#6B7280', fontSize: 9, fontFamily: 'monospace' }}>{rc.label} Lv.{effect.unlockLevel}+</div>
        </div>
      )}
    </div>
  );
}
