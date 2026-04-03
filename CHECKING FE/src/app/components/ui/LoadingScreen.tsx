/**
 * LoadingScreen — Cyberpunk-zen loading effects
 * Full-screen, inline, skeleton variants
 */
import { motion } from 'motion/react';
import { DS, GRD } from '../layout/ds';

const rgba = (hex: string, a: number) => {
  const h = hex.replace('#', '');
  return `rgba(${parseInt(h.slice(0, 2), 16)},${parseInt(h.slice(2, 4), 16)},${parseInt(h.slice(4, 6), 16)},${a})`;
};

// ── Full-screen loading overlay ──────────────────────────────────────────
export function LoadingScreen({ message = 'Đang tải...' }: { message?: string }) {
  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{ background: 'rgba(2,6,23,0.97)', backdropFilter: 'blur(20px)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Hex pattern bg */}
      <div className="absolute inset-0" style={{ opacity: 0.03 }}>
        <svg width="100%" height="100%">
          <defs>
            <pattern id="hex-load" width="40" height="46" patternUnits="userSpaceOnUse">
              <path d="M20 2 L36 11 L36 29 L20 38 L4 29 L4 11 Z" fill="none" stroke="#3B82F6" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hex-load)" />
        </svg>
      </div>

      <div className="text-center relative">
        {/* Spinner */}
        <div className="relative w-20 h-20 mx-auto mb-6">
          {/* Outer ring */}
          <motion.svg width="80" height="80" viewBox="0 0 80 80" className="absolute inset-0"
            animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}>
            <circle cx="40" cy="40" r="36" fill="none" stroke={rgba(DS.blue, 0.1)} strokeWidth="2" />
            <circle cx="40" cy="40" r="36" fill="none" stroke="url(#spinGrad)" strokeWidth="2" strokeLinecap="round" strokeDasharray="60 170" />
            <defs>
              <linearGradient id="spinGrad" x1="0" y1="0" x2="80" y2="80" gradientUnits="userSpaceOnUse">
                <stop stopColor="#3B82F6" /><stop offset="1" stopColor="#818CF8" />
              </linearGradient>
            </defs>
          </motion.svg>

          {/* Inner ring */}
          <motion.svg width="80" height="80" viewBox="0 0 80 80" className="absolute inset-0"
            animate={{ rotate: -360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
            <circle cx="40" cy="40" r="26" fill="none" stroke={rgba(DS.purple, 0.08)} strokeWidth="1.5" />
            <circle cx="40" cy="40" r="26" fill="none" stroke={rgba(DS.purple, 0.6)} strokeWidth="1.5" strokeLinecap="round" strokeDasharray="30 133" />
          </motion.svg>

          {/* Center logo */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <svg width="24" height="24" viewBox="0 0 40 40" fill="none">
                <path d="M20 2 L36 11 L36 29 L20 38 L4 29 L4 11 Z" stroke={rgba(DS.blue, 0.5)} strokeWidth="1.5" fill="none" />
                <text x="20" y="25" textAnchor="middle" fontSize="14" fontWeight="900" fill={DS.blue} fontFamily="Georgia,serif">∞</text>
              </svg>
            </motion.div>
          </div>
        </div>

        {/* Text */}
        <motion.div
          style={{ color: DS.text, fontSize: 14, fontWeight: 600, marginBottom: 4 }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          {message}
        </motion.div>
        <div style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono, letterSpacing: '0.2em' }}>LOOP SOLUTIONS</div>

        {/* Progress bar */}
        <div className="mt-6 mx-auto overflow-hidden rounded-full" style={{ width: 200, height: 2, background: rgba(DS.blue, 0.1) }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: GRD.primary }}
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
      </div>
    </motion.div>
  );
}

// ── Inline spinner ───────────────────────────────────────────────────────
export function InlineLoader({ size = 20, color = DS.blue }: { size?: number; color?: string }) {
  return (
    <motion.svg width={size} height={size} viewBox="0 0 24 24" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
      <circle cx="12" cy="12" r="10" fill="none" stroke={rgba(color, 0.15)} strokeWidth="2" />
      <circle cx="12" cy="12" r="10" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeDasharray="20 43" />
    </motion.svg>
  );
}

// ── Skeleton shimmer ─────────────────────────────────────────────────────
export function Skeleton({ width, height = 16, radius = 8 }: { width?: number | string; height?: number; radius?: number }) {
  return (
    <div
      className="overflow-hidden relative"
      style={{ width: width ?? '100%', height, borderRadius: radius, background: rgba('#FFFFFF', 0.04) }}
    >
      <motion.div
        className="absolute inset-0"
        style={{ background: `linear-gradient(90deg, transparent, ${rgba('#FFFFFF', 0.06)}, transparent)` }}
        animate={{ x: ['-100%', '100%'] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}
