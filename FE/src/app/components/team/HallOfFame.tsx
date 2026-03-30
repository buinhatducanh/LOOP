import { motion } from 'motion/react';
import { Member, RANKS } from './memberData';
import { Trophy, Zap, Target } from 'lucide-react';

interface HallOfFameProps {
  mvp: Member;
  bugSlayer: Member;
  topPerformer: Member;
  onMemberClick: (member: Member) => void;
}

// ── Prismatic beams config (fixed — no Math.random to avoid re-renders) ──
const PRISM_BEAMS = [
  { left: '-8%',  width: '38%', color: '#818CF8', angle: '14deg',  delay: '0s',   dur: '14s', opacity: 0.10 },
  { left: '15%',  width: '28%', color: '#7DD3FC', angle: '-9deg',  delay: '2.5s', dur: '11s', opacity: 0.08 },
  { left: '38%',  width: '32%', color: '#F0ABFC', angle: '22deg',  delay: '5s',   dur: '13s', opacity: 0.09 },
  { left: '60%',  width: '26%', color: '#FFFFFF', angle: '-15deg', delay: '1.2s', dur: '9s',  opacity: 0.06 },
  { left: '78%',  width: '34%', color: '#818CF8', angle: '11deg',  delay: '3.8s', dur: '12s', opacity: 0.08 },
  { left: '92%',  width: '22%', color: '#7DD3FC', angle: '-18deg', delay: '0.6s', dur: '10s', opacity: 0.07 },
];

const PRISM_FLARES = [
  { top: '12%', left: '18%',  size: 160, color: '#818CF8', delay: '0s',   dur: '8s'  },
  { top: '55%', left: '70%',  size: 200, color: '#7DD3FC', delay: '3s',   dur: '10s' },
  { top: '80%', left: '38%',  size: 140, color: '#F0ABFC', delay: '1.5s', dur: '7s'  },
];

const CRYSTAL_SPARKS = [
  { left: '5%',   delay: '0s',   dur: '7s',  size: 2.5, color: '#818CF8' },
  { left: '14%',  delay: '2.2s', dur: '6s',  size: 1.5, color: '#FFFFFF' },
  { left: '26%',  delay: '1s',   dur: '8s',  size: 2.0, color: '#7DD3FC' },
  { left: '40%',  delay: '3.5s', dur: '5.5s',size: 1.5, color: '#F0ABFC' },
  { left: '54%',  delay: '0.7s', dur: '7.5s',size: 2.0, color: '#818CF8' },
  { left: '67%',  delay: '2.8s', dur: '6.5s',size: 1.5, color: '#7DD3FC' },
  { left: '79%',  delay: '1.4s', dur: '9s',  size: 2.5, color: '#FFFFFF' },
  { left: '91%',  delay: '4s',   dur: '6s',  size: 1.5, color: '#F0ABFC' },
];

// ── HolographicCard floating particles (fixed — no Math.random) ──────
const HOLOGRAPHIC_PARTICLES = [
  { leftPct: 8,   delay: 0.0, dur: 4.2, size: 2.2 },
  { leftPct: 22,  delay: 0.6, dur: 3.6, size: 1.4 },
  { leftPct: 38,  delay: 1.3, dur: 5.0, size: 2.8 },
  { leftPct: 52,  delay: 0.3, dur: 3.8, size: 1.8 },
  { leftPct: 66,  delay: 1.8, dur: 4.5, size: 2.5 },
  { leftPct: 78,  delay: 0.9, dur: 3.4, size: 1.2 },
  { leftPct: 89,  delay: 1.6, dur: 4.8, size: 2.0 },
  { leftPct: 96,  delay: 0.5, dur: 3.9, size: 1.6 },
];

// ── Diamond Prism Background (toàn màn hình Hall of Fame) ────────────────
function PrismBackground() {
  return (
    <>
      {/* ── Injected CSS keyframes ── */}
      <style>{`
        @keyframes guildHoloShine {
          0%   { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes hofPrismBeam {
          0%, 100% { opacity: 0.2; }
          50%       { opacity: 1; }
        }
        @keyframes hofFlare {
          0%, 100% { transform: scale(0.85); opacity: 0.3; }
          50%       { transform: scale(1.15); opacity: 0.7; }
        }
        @keyframes hofSpark {
          0%   { transform: translateY(0) scale(1); opacity: 0; }
          10%  { opacity: 0.9; }
          85%  { opacity: 0.5; }
          100% { transform: translateY(-280px) scale(0.1); opacity: 0; }
        }
        @keyframes hofCrystalPulse {
          0%, 100% { opacity: 0.03; }
          50%       { opacity: 0.07; }
        }
        @keyframes hofTopBeam {
          0%   { transform: translateX(-100%); opacity: 0; }
          15%  { opacity: 0.9; }
          85%  { opacity: 0.6; }
          100% { transform: translateX(300%); opacity: 0; }
        }
      `}</style>

      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          overflow: 'hidden',
          borderRadius: 16,
          zIndex: 0,
        }}
      >
        {/* Layer 1: Deep diamond radial glow at center */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(ellipse 90% 70% at 50% 50%, rgba(129,140,248,0.05) 0%, rgba(125,211,252,0.04) 35%, rgba(240,171,252,0.03) 60%, transparent 80%)',
          }}
        />

        {/* Layer 2: Sweeping prismatic vertical beams */}
        {PRISM_BEAMS.map((b, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: '-25%',
              left: b.left,
              width: b.width,
              height: '150%',
              background: `linear-gradient(180deg, transparent 0%, ${b.color}${Math.round(b.opacity * 255).toString(16).padStart(2,'0')} 20%, ${b.color}${Math.round(b.opacity * 1.4 * 255).toString(16).padStart(2,'0')} 50%, ${b.color}${Math.round(b.opacity * 255).toString(16).padStart(2,'0')} 80%, transparent 100%)`,
              transform: `rotate(${b.angle})`,
              animation: `hofPrismBeam ${b.dur} ${b.delay} ease-in-out infinite`,
            }}
          />
        ))}

        {/* Layer 3: Crystal grid mesh (SVG diamond pattern) */}
        <svg
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            animation: 'hofCrystalPulse 6s ease-in-out infinite',
          }}
        >
          <defs>
            <pattern id="hofCrystalGrid" x="0" y="0" width="72" height="72" patternUnits="userSpaceOnUse">
              <path d="M36 0 L72 36 L36 72 L0 36 Z" fill="none" stroke="#818CF8" strokeWidth="0.4" opacity="0.8" />
              <path d="M36 12 L60 36 L36 60 L12 36 Z" fill="none" stroke="#7DD3FC" strokeWidth="0.3" opacity="0.5" />
              <circle cx="36" cy="0"  r="1.5" fill="#818CF8" opacity="0.5" />
              <circle cx="72" cy="36" r="1.5" fill="#7DD3FC" opacity="0.5" />
              <circle cx="36" cy="72" r="1.5" fill="#F0ABFC" opacity="0.5" />
              <circle cx="0"  cy="36" r="1.5" fill="#FFFFFF"  opacity="0.4" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hofCrystalGrid)" />
        </svg>

        {/* Layer 4: Corner + mid prismatic halos */}
        {PRISM_FLARES.map((f, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: f.top,
              left: f.left,
              width: f.size,
              height: f.size,
              transform: 'translate(-50%, -50%)',
              borderRadius: '50%',
              background: `radial-gradient(circle, ${f.color}14 0%, ${f.color}07 40%, transparent 70%)`,
              filter: 'blur(18px)',
              animation: `hofFlare ${f.dur} ${f.delay} ease-in-out infinite`,
            }}
          />
        ))}

        {/* Layer 5: Rising prismatic sparks from bottom */}
        {CRYSTAL_SPARKS.map((s, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              bottom: 0,
              left: s.left,
              width: s.size,
              height: s.size,
              borderRadius: '50%',
              backgroundColor: s.color,
              boxShadow: `0 0 8px 2px ${s.color}`,
              animation: `hofSpark ${s.dur} ${s.delay} ease-out infinite`,
            }}
          />
        ))}

        {/* Layer 6: Top border prismatic comet sweeps */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, overflow: 'hidden' }}>
          <div
            style={{
              position: 'absolute',
              top: 0,
              width: '50%',
              height: '100%',
              backgroundImage: 'linear-gradient(90deg, transparent, rgba(129,140,248,0.9), rgba(125,211,252,0.9), transparent)',
              animation: 'hofTopBeam 6s 0s linear infinite',
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: 0,
              width: '35%',
              height: '100%',
              backgroundImage: 'linear-gradient(90deg, transparent, rgba(240,171,252,0.8), rgba(255,255,255,0.8), transparent)',
              animation: 'hofTopBeam 8s 3s linear infinite',
            }}
          />
        </div>

        {/* Layer 7: Bottom vignette mask — fade into page bg */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 80,
            background: 'linear-gradient(to bottom, transparent, rgba(2,6,23,0.6))',
          }}
        />

        {/* Layer 8: Top vignette */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 60,
            background: 'linear-gradient(to top, transparent, rgba(2,6,23,0.3))',
          }}
        />
      </div>
    </>
  );
}

// ── Holographic card with floating effect ────────────────────────────────
function HolographicCard({
  member,
  award,
  icon,
  accentColor,
  delay,
  onClick,
}: {
  member: Member;
  award: string;
  icon: React.ReactNode;
  accentColor: string;
  delay: number;
  onClick: () => void;
}) {
  const cfg = RANKS[member.rank];

  return (
    <motion.div
      className="relative cursor-pointer group"
      initial={{ opacity: 0, y: 60, rotateX: 20 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay }}
      whileHover={{ y: -12, scale: 1.04 }}
      onClick={onClick}
      style={{ perspective: 1000 }}
    >
      {/* Holographic glow aura */}
      <div
        className="absolute inset-0 rounded-xl pointer-events-none blur-xl opacity-60 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          backgroundImage: `radial-gradient(circle at 50% 50%, ${accentColor}88, ${cfg.glowColor}44, transparent)`,
        }}
      />

      {/* Card container */}
      <div
        className="relative overflow-hidden rounded-xl"
        style={{
          backgroundColor: '#0F172A',
          backgroundImage: 'linear-gradient(135deg, #0F172A, #1E293B)',
          border: `1.5px solid ${accentColor}60`,
          boxShadow: `0 0 30px ${accentColor}40, 0 8px 32px rgba(0,0,0,0.4)`,
        }}
      >
        {/* Holographic shimmer overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-30"
          style={{
            backgroundImage:
              'linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.15) 45%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0.15) 55%, transparent 100%)',
            backgroundSize: '200% 200%',
            animation: 'guildHoloShine 4s linear infinite',
          }}
        />

        {/* Floating particles background (pre-generated — no Math.random flicker) */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {HOLOGRAPHIC_PARTICLES.map((p, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                width: p.size,
                height: p.size,
                background: accentColor,
                left: `${p.leftPct}%`,
                boxShadow: `0 0 6px ${accentColor}`,
              }}
              animate={{
                y: [0, -110],
                opacity: [0, 0.8, 0],
              }}
              transition={{
                duration: p.dur,
                repeat: Infinity,
                delay: p.delay,
                ease: 'easeOut',
              }}
            />
          ))}
        </div>

        {/* Content */}
        <div className="relative p-5">
          {/* Award badge */}
          <div
            className="flex items-center justify-center gap-2 mb-3 py-1.5 px-3 rounded-sm mx-auto w-fit"
            style={{
              background: `linear-gradient(135deg, ${accentColor}25, ${accentColor}15)`,
              border: `1px solid ${accentColor}70`,
              boxShadow: `0 0 15px ${accentColor}40`,
            }}
          >
            <span style={{ color: accentColor }}>{icon}</span>
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10,
                letterSpacing: '0.18em',
                color: accentColor,
                fontWeight: 700,
              }}
            >
              {award}
            </span>
          </div>

          {/* Avatar */}
          <div className="flex justify-center mb-3">
            <div className="relative">
              <div
                className="w-24 h-24 rounded-xl overflow-hidden"
                style={{
                  border: `2px solid ${cfg.color}`,
                  boxShadow: `0 0 20px ${cfg.glowColor}, 0 0 40px ${cfg.glowColor}40, inset 0 0 20px rgba(0,0,0,0.3)`,
                }}
              >
                <img
                  src={member.img}
                  alt={member.name}
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Rank symbol badge */}
              <div
                className="absolute -bottom-2 -right-2 w-8 h-8 rounded-lg flex items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, ${cfg.gradientFrom}, ${cfg.gradientTo})`,
                  border: `2px solid ${cfg.color}`,
                  fontSize: 14,
                  boxShadow: `0 0 15px ${cfg.glowColor}`,
                }}
              >
                {cfg.symbol}
              </div>
            </div>
          </div>

          {/* Name & Title */}
          <div className="text-center mb-2">
            <div
              style={{
                fontFamily: "'Cinzel', serif",
                color: '#FFFFFF',
                fontSize: 15,
                fontWeight: 700,
                letterSpacing: '0.05em',
                textShadow: `0 0 10px ${accentColor}80`,
              }}
            >
              {member.name}
            </div>
            <div
              style={{
                color: '#64748B',
                fontSize: 10,
                fontFamily: "'JetBrains Mono', monospace",
                letterSpacing: '0.08em',
                marginTop: 2,
              }}
            >
              {member.title}
            </div>
          </div>

          {/* Stats row */}
          <div className="flex items-center justify-center gap-4 mt-3">
            <div className="text-center">
              <div
                style={{
                  fontFamily: "'Cinzel', serif",
                  color: cfg.color,
                  fontSize: 18,
                  fontWeight: 700,
                  textShadow: `0 0 10px ${cfg.glowColor}`,
                }}
              >
                {member.level}
              </div>
              <div
                style={{
                  color: '#475569',
                  fontSize: 8,
                  fontFamily: "'JetBrains Mono', monospace",
                  letterSpacing: '0.1em',
                }}
              >
                LEVEL
              </div>
            </div>
            <div
              style={{
                width: 1,
                height: 24,
                background: 'linear-gradient(180deg, transparent, #1F2937, transparent)',
              }}
            />
            <div className="text-center">
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  color: accentColor,
                  fontSize: 18,
                  fontWeight: 700,
                  textShadow: `0 0 8px ${accentColor}`,
                }}
              >
                {member.missions}
              </div>
              <div
                style={{
                  color: '#475569',
                  fontSize: 8,
                  fontFamily: "'JetBrains Mono', monospace",
                  letterSpacing: '0.1em',
                }}
              >
                MISSIONS
              </div>
            </div>
          </div>

          {/* LP Balance row */}
          <div
            className="flex items-center justify-between mt-3 px-3 py-2 rounded-lg"
            style={{
              background: `${accentColor}08`,
              border: `1px solid ${accentColor}25`,
            }}
          >
            <div style={{ color: '#475569', fontSize: 9, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.1em' }}>
              ◈ LP BALANCE
            </div>
            <div
              style={{
                color: accentColor,
                fontSize: 14,
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 700,
                textShadow: `0 0 8px ${accentColor}`,
              }}
            >
              {member.lpBalance >= 1000
                ? `${(member.lpBalance / 1000).toFixed(1)}K`
                : member.lpBalance}
            </div>
          </div>

          {/* Hover hint */}
          <div
            className="mt-3 py-1.5 rounded-sm text-center transition-opacity duration-300"
            style={{
              border: `1px solid ${accentColor}40`,
              background: `${accentColor}0a`,
              opacity: 0,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = '0'; }}
          >
            <span
              style={{
                color: accentColor,
                fontSize: 9,
                letterSpacing: '0.12em',
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              ◈ VIEW PROFILE
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── Main Hall of Fame component ──────────────────────────────────────────
export function HallOfFame({ mvp, bugSlayer, topPerformer, onMemberClick }: HallOfFameProps) {
  return (
    <div className="mb-14 relative" style={{ borderRadius: 16 }}>
      {/* ── Diamond Prism Background — renders below everything ── */}
      <PrismBackground />

      {/* ── All content: z-index 1 above background ── */}
      <div style={{ position: 'relative', zIndex: 1, paddingTop: 32, paddingBottom: 32, paddingLeft: 8, paddingRight: 8 }}>

        {/* Section header */}
        <div className="text-center mb-8">
          {/* Decorative prismatic line */}
          <div style={{ height: 1, marginBottom: 16, position: 'relative', overflow: 'hidden' }}>
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: 'linear-gradient(90deg, transparent, rgba(129,140,248,0.6), rgba(125,211,252,0.8), rgba(240,171,252,0.6), transparent)',
              }}
            />
          </div>

          <div className="flex items-center justify-center gap-3 mb-3">
            <div
              style={{
                flex: 1,
                maxWidth: 150,
                height: 1,
                backgroundImage: 'linear-gradient(90deg, transparent, rgba(129,140,248,0.5))',
              }}
            />
            {/* Prismatic crown icon */}
            <svg width="20" height="17" viewBox="0 0 20 17" fill="none">
              <defs>
                <linearGradient id="hofCrownGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%"   stopColor="#818CF8" />
                  <stop offset="50%"  stopColor="#7DD3FC" />
                  <stop offset="100%" stopColor="#F0ABFC" />
                </linearGradient>
              </defs>
              <path d="M1 16 L4 6 L8 11 L10 1 L12 11 L16 6 L19 16 Z" fill="none" stroke="url(#hofCrownGrad)" strokeWidth="1.4" strokeLinejoin="round"/>
              <line x1="1" y1="16" x2="19" y2="16" stroke="url(#hofCrownGrad)" strokeWidth="1.6" strokeLinecap="round"/>
              <circle cx="1"  cy="16" r="1.5" fill="#F0ABFC" />
              <circle cx="10" cy="1"  r="1.5" fill="#7DD3FC" />
              <circle cx="19" cy="16" r="1.5" fill="#818CF8" />
            </svg>
            <div
              style={{
                flex: 1,
                maxWidth: 150,
                height: 1,
                backgroundImage: 'linear-gradient(90deg, rgba(240,171,252,0.5), transparent)',
              }}
            />
          </div>

          <h3
            style={{
              fontFamily: "'Cinzel', serif",
              fontSize: 26,
              fontWeight: 900,
              letterSpacing: '0.12em',
              background: 'linear-gradient(135deg, #818CF8 0%, #7DD3FC 35%, #F0ABFC 65%, #FFFFFF 85%, #818CF8 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundSize: '200% 100%',
              animation: 'guildHoloShine 5s linear infinite',
            }}
          >
            ⦿ HALL OF FAME ⦿
          </h3>
          <p
            className="mt-2"
            style={{
              fontSize: 11,
              fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: '0.18em',
              background: 'linear-gradient(90deg, #818CF8, #7DD3FC, #F0ABFC)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            — LEGENDS OF THE GUILD —
          </p>

          {/* Sub tagline */}
          <p
            className="mt-1"
            style={{
              color: '#334155',
              fontSize: 9,
              fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: '0.2em',
            }}
          >
            ✦ DIAMOND SANCTUM · APEX RECORDS ✦
          </p>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-3 gap-6 max-w-4xl mx-auto">
          <HolographicCard
            member={mvp}
            award="MVP LEGEND"
            icon={<Trophy size={12} />}
            accentColor="#F59E0B"
            delay={0.1}
            onClick={() => onMemberClick(mvp)}
          />
          <HolographicCard
            member={bugSlayer}
            award="BUG SLAYER"
            icon={<Zap size={12} />}
            accentColor="#EF4444"
            delay={0.25}
            onClick={() => onMemberClick(bugSlayer)}
          />
          <HolographicCard
            member={topPerformer}
            award="TOP PERFORMER"
            icon={<Target size={12} />}
            accentColor="#22D3EE"
            delay={0.4}
            onClick={() => onMemberClick(topPerformer)}
          />
        </div>

        {/* Bottom ornament */}
        <div className="flex items-center justify-center gap-2 mt-8">
          <div
            style={{
              flex: 1,
              maxWidth: 100,
              height: 1,
              backgroundImage: 'linear-gradient(90deg, transparent, rgba(129,140,248,0.4))',
            }}
          />
          {['#818CF8', '#7DD3FC', '#F0ABFC', '#FFFFFF', '#F0ABFC', '#7DD3FC', '#818CF8'].map((c, i) => (
            <div
              key={i}
              style={{
                width: i === 3 ? 7 : 5,
                height: i === 3 ? 7 : 5,
                borderRadius: '50%',
                backgroundColor: c,
                boxShadow: `0 0 ${i === 3 ? 10 : 6}px ${c}`,
              }}
            />
          ))}
          <div
            style={{
              flex: 1,
              maxWidth: 100,
              height: 1,
              backgroundImage: 'linear-gradient(90deg, rgba(240,171,252,0.4), transparent)',
            }}
          />
        </div>

        {/* Bottom prismatic line */}
        <div style={{ height: 1, marginTop: 16, position: 'relative', overflow: 'hidden' }}>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: 'linear-gradient(90deg, transparent, rgba(240,171,252,0.6), rgba(125,211,252,0.8), rgba(129,140,248,0.6), transparent)',
            }}
          />
        </div>

      </div>
    </div>
  );
}