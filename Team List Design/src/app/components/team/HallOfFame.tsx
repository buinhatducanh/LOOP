import { motion } from 'motion/react';
import { Member, RANKS } from './memberData';
import { Trophy, Zap, Target } from 'lucide-react';

interface HallOfFameProps {
  mvp: Member;
  bugSlayer: Member;
  topPerformer: Member;
  onMemberClick: (member: Member) => void;
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

        {/* Floating particles background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                width: Math.random() * 3 + 1,
                height: Math.random() * 3 + 1,
                background: accentColor,
                left: `${Math.random() * 100}%`,
                boxShadow: `0 0 6px ${accentColor}`,
              }}
              animate={{
                y: [0, -100 - Math.random() * 50],
                opacity: [0, 0.8, 0],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
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

          {/* Hover hint */}
          <div
            className="mt-3 py-1.5 rounded-sm text-center transition-opacity duration-300"
            style={{
              border: `1px solid ${accentColor}40`,
              background: `${accentColor}0a`,
              opacity: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '1';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '0';
            }}
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
    <div className="mb-14">
      {/* Section header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-3">
          <div
            style={{
              flex: 1,
              maxWidth: 150,
              height: 1,
              backgroundImage: 'linear-gradient(90deg, transparent, #F59E0B40)',
            }}
          />
          <Trophy size={16} style={{ color: '#F59E0B' }} />
          <div
            style={{
              flex: 1,
              maxWidth: 150,
              height: 1,
              backgroundImage: 'linear-gradient(90deg, #F59E0B40, transparent)',
            }}
          />
        </div>
        <h3
          style={{
            fontFamily: "'Cinzel', serif",
            color: '#FFFFFF',
            fontSize: 24,
            fontWeight: 900,
            letterSpacing: '0.1em',
            background: 'linear-gradient(135deg, #F59E0B, #FBBF24, #FDE68A)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          ⦿ HALL OF FAME ⦿
        </h3>
        <p
          className="mt-2"
          style={{
            color: '#64748B',
            fontSize: 11,
            fontFamily: "'JetBrains Mono', monospace",
            letterSpacing: '0.15em',
          }}
        >
          — LEGENDS OF THE GUILD —
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
            backgroundImage: 'linear-gradient(90deg, transparent, #1F2937)',
          }}
        />
        {['#F59E0B', '#EF4444', '#22D3EE'].map((c, i) => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full"
            style={{
              backgroundColor: c,
              boxShadow: `0 0 6px ${c}`,
            }}
          />
        ))}
        <div
          style={{
            flex: 1,
            maxWidth: 100,
            height: 1,
            backgroundImage: 'linear-gradient(90deg, #1F2937, transparent)',
          }}
        />
      </div>

      {/* CSS animation for holographic shimmer */}
      <style>{`
        @keyframes guildHoloShine {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
}
