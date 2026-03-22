"use client";

import { motion } from 'framer-motion';
import { Trophy, Zap, Target } from 'lucide-react';
import { GuildMemberCard } from './GuildMemberCard';

interface HallOfFameMember {
  id: string;
  slug: string;
  name: string;
  role: string;
  image: string;
  roleLevel?: number;
  roleCategory?: string | null;
  roleCode?: string;
  level?: number;
}

interface HallOfFameProps {
  members: HallOfFameMember[];
  onMemberClick?: (member: HallOfFameMember) => void;
}

export function GuildHallOfFame({ members, onMemberClick }: HallOfFameProps) {
  if (members.length === 0) return null;

  const awards = [
    { key: 'mvp', label: 'MVP LEGEND', icon: <Trophy size={12} />, color: '#F59E0B', accent: 'amber' },
    { key: 'bugSlayer', label: 'BUG SLAYER', icon: <Zap size={12} />, color: '#EF4444', accent: 'red' },
    { key: 'topPerformer', label: 'TOP PERFORMER', icon: <Target size={12} />, color: '#22D3EE', accent: 'cyan' },
  ];

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
            fontFamily: 'var(--font-cinzel), Cinzel, serif',
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
            fontFamily: 'var(--font-jetbrains), JetBrains Mono, monospace',
            letterSpacing: '0.15em',
          }}
        >
          — LEGENDS OF THE GUILD —
        </p>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
        {awards.map((award, idx) => {
          const member = members[idx];
          if (!member) return null;

          return (
            <motion.div
              key={award.key}
              className="relative cursor-pointer group"
              initial={{ opacity: 0, y: 60, rotateX: 20 }}
              animate={{ opacity: 1, y: 0, rotateX: 0 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: idx * 0.15 }}
              whileHover={{ y: -12, scale: 1.04 }}
              onClick={() => onMemberClick?.(member)}
              style={{ perspective: 1000 }}
            >
              {/* Holographic glow aura */}
              <div
                className="absolute inset-0 rounded-xl pointer-events-none blur-xl opacity-60 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                  backgroundImage: `radial-gradient(circle at 50% 50%, ${award.color}88, rgba(129,140,248,0.3)44, transparent)`,
                }}
              />

              {/* Card container */}
              <div
                className="relative overflow-hidden rounded-xl"
                style={{
                  backgroundColor: '#0F172A',
                  backgroundImage: 'linear-gradient(135deg, #0F172A, #1E293B)',
                  border: `1.5px solid ${award.color}60`,
                  boxShadow: `0 0 30px ${award.color}40, 0 8px 32px rgba(0,0,0,0.4)`,
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

                {/* Floating particles */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  {[...Array(8)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute rounded-full"
                      style={{
                        width: Math.random() * 3 + 1,
                        height: Math.random() * 3 + 1,
                        background: award.color,
                        left: `${Math.random() * 100}%`,
                        boxShadow: `0 0 6px ${award.color}`,
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
                      background: `linear-gradient(135deg, ${award.color}25, ${award.color}15)`,
                      border: `1px solid ${award.color}70`,
                      boxShadow: `0 0 15px ${award.color}40`,
                    }}
                  >
                    <span style={{ color: award.color }}>{award.icon}</span>
                    <span
                      style={{
                        fontFamily: 'var(--font-jetbrains), JetBrains Mono, monospace',
                        fontSize: 10,
                        letterSpacing: '0.18em',
                        color: award.color,
                        fontWeight: 700,
                      }}
                    >
                      {award.label}
                    </span>
                  </div>

                  {/* Avatar */}
                  <div className="flex justify-center mb-3">
                    <div className="relative">
                      <div
                        className="w-24 h-24 rounded-xl overflow-hidden"
                        style={{
                          border: `2px solid ${award.color}`,
                          boxShadow: `0 0 20px ${award.color}, 0 0 40px ${award.color}40, inset 0 0 20px rgba(0,0,0,0.3)`,
                        }}
                      >
                        {member.image ? (
                          <img src={member.image} alt={member.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                            <Trophy size={32} className="text-slate-600" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Name & Title */}
                  <div className="text-center mb-2">
                    <div
                      style={{
                        fontFamily: 'var(--font-cinzel), Cinzel, serif',
                        color: '#FFFFFF',
                        fontSize: 15,
                        fontWeight: 700,
                        letterSpacing: '0.05em',
                        textShadow: `0 0 10px ${award.color}80`,
                      }}
                    >
                      {member.name}
                    </div>
                    <div
                      style={{
                        color: '#64748B',
                        fontSize: 10,
                        fontFamily: 'var(--font-jetbrains), JetBrains Mono, monospace',
                        letterSpacing: '0.08em',
                        marginTop: 2,
                      }}
                    >
                      {member.role}
                    </div>
                  </div>

                  {/* Level */}
                  <div className="flex items-center justify-center gap-4 mt-3">
                    <div className="text-center">
                      <div
                        style={{
                          fontFamily: 'var(--font-cinzel), Cinzel, serif',
                          color: award.color,
                          fontSize: 18,
                          fontWeight: 700,
                          textShadow: `0 0 10px ${award.color}`,
                        }}
                      >
                        {member.level || 99}
                      </div>
                      <div
                        style={{
                          color: '#475569',
                          fontSize: 8,
                          fontFamily: 'var(--font-jetbrains), JetBrains Mono, monospace',
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
                          fontFamily: 'var(--font-jetbrains), JetBrains Mono, monospace',
                          color: award.color,
                          fontSize: 18,
                          fontWeight: 700,
                          textShadow: `0 0 8px ${award.color}`,
                        }}
                      >
                        {member.roleLevel !== undefined ? 50 - member.roleLevel * 5 : 100}
                      </div>
                      <div
                        style={{
                          color: '#475569',
                          fontSize: 8,
                          fontFamily: 'var(--font-jetbrains), JetBrains Mono, monospace',
                          letterSpacing: '0.1em',
                        }}
                      >
                        MISSIONS
                      </div>
                    </div>
                  </div>

                  {/* Hover hint */}
                  <div
                    className="mt-3 py-1.5 rounded-sm text-center"
                    style={{
                      border: `1px solid ${award.color}40`,
                      background: `${award.color}0a`,
                      opacity: 0,
                      transition: 'opacity 0.3s',
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = '0'; }}
                  >
                    <span
                      style={{
                        color: award.color,
                        fontSize: 9,
                        letterSpacing: '0.12em',
                        fontFamily: 'var(--font-jetbrains), JetBrains Mono, monospace',
                      }}
                    >
                      ◈ VIEW PROFILE
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Bottom ornament */}
      <div className="flex items-center justify-center gap-2 mt-8">
        <div style={{ flex: 1, maxWidth: 100, height: 1, backgroundImage: 'linear-gradient(90deg, transparent, #1F2937)' }} />
        {['#F59E0B', '#EF4444', '#22D3EE'].map((c, i) => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: c, boxShadow: `0 0 6px ${c}` }}
          />
        ))}
        <div style={{ flex: 1, maxWidth: 100, height: 1, backgroundImage: 'linear-gradient(90deg, #1F2937, transparent)' }} />
      </div>
    </div>
  );
}
