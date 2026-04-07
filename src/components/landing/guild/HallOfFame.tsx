"use client";

/**
 * HallOfFame — Top 3 members displayed with holographic prismatic cards
 * Features: prism beams, crystal grid, rising sparks, cometary top border.
 */
import { useState } from "react";
import { motion } from "motion/react";
import Link from "next/link";
import { Trophy, Zap, Target } from "lucide-react";
import { RANKS, normalizeRank, formatLP } from "./guildMemberData";
import { DS } from "@/lib/design-tokens";

type MemberRecord = Record<string, unknown>;

interface HallOfFameProps {
  mvp: MemberRecord;
  bugSlayer: MemberRecord;
  topPerformer: MemberRecord;
  locale: string;
}

// ── Prismatic beams config ────────────────────────────────────────────────
const PRISM_BEAMS = [
  { left: "-8%", width: "38%", color: DS.purple, angle: "14deg",  delay: "0s",   dur: "14s", opacity: 0.10 },
  { left: "15%", width: "28%", color: DS.sky,   angle: "-9deg",  delay: "2.5s", dur: "11s", opacity: 0.08 },
  { left: "38%", width: "32%", color: DS.lavender, angle: "22deg",  delay: "5s",   dur: "13s", opacity: 0.09 },
  { left: "60%", width: "26%", color: DS.text, angle: "-15deg", delay: "1.2s", dur: "9s",  opacity: 0.06 },
  { left: "78%", width: "34%", color: DS.purple, angle: "11deg",  delay: "3.8s", dur: "12s", opacity: 0.08 },
  { left: "92%", width: "22%", color: DS.sky,   angle: "-18deg", delay: "0.6s", dur: "10s", opacity: 0.07 },
];

const PRISM_FLARES = [
  { top: "12%", left: "18%", size: 160, color: DS.purple,    delay: "0s",   dur: "8s"  },
  { top: "55%", left: "70%", size: 200, color: DS.sky,       delay: "3s",   dur: "10s" },
  { top: "80%", left: "38%", size: 140, color: DS.lavender,  delay: "1.5s", dur: "7s"  },
];

const CRYSTAL_SPARKS = [
  { left: "5%",   delay: "0s",   dur: "7s",  size: 2.5, color: DS.purple },
  { left: "14%",  delay: "2.2s", dur: "6s",  size: 1.5, color: DS.text },
  { left: "26%",  delay: "1s",   dur: "8s",  size: 2.0, color: DS.sky },
  { left: "40%",  delay: "3.5s", dur: "5.5s",size: 1.5, color: DS.lavender },
  { left: "54%",  delay: "0.7s", dur: "7.5s",size: 2.0, color: DS.purple },
  { left: "67%",  delay: "2.8s", dur: "6.5s",size: 1.5, color: DS.sky },
  { left: "79%",  delay: "1.4s", dur: "9s",  size: 2.5, color: DS.text },
  { left: "91%",  delay: "4s",   dur: "6s",  size: 1.5, color: DS.lavender },
];

function toHexOpacity(opacity: number): string {
  return Math.round(opacity * 255).toString(16).padStart(2, "0");
}

// ── Prism Background ───────────────────────────────────────────────────
function PrismBackground() {
  return (
    <>
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
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          overflow: "hidden",
          borderRadius: 16,
          zIndex: 0,
        }}
      >
        {/* Layer 1: Deep diamond radial glow */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse 90% 70% at 50% 50%, rgba(129,140,248,0.05) 0%, rgba(125,211,252,0.04) 35%, rgba(240,171,252,0.03) 60%, transparent 80%)",
          }}
        />

        {/* Layer 2: Sweeping prismatic beams */}
        {PRISM_BEAMS.map((b, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              top: "-25%",
              left: b.left,
              width: b.width,
              height: "150%",
              background: `linear-gradient(180deg, transparent 0%, ${b.color}${toHexOpacity(b.opacity)} 20%, ${b.color}${toHexOpacity(b.opacity * 1.4)} 50%, ${b.color}${toHexOpacity(b.opacity)} 80%, transparent 100%)`,
              transform: `rotate(${b.angle})`,
              animation: `hofPrismBeam ${b.dur} ${b.delay} ease-in-out infinite`,
            }}
          />
        ))}

        {/* Layer 3: Crystal grid mesh (SVG diamond pattern) */}
        <svg
          style={{
            position: "absolute",
            inset: 0,
            animation: "hofCrystalPulse 6s ease-in-out infinite",
          }}
        >
          <defs>
            <pattern id="hofCrystalGrid" x="0" y="0" width="72" height="72" patternUnits="userSpaceOnUse">
              <path d="M36 0 L72 36 L36 72 L0 36 Z" fill="none" stroke={DS.cosmicPurple} strokeWidth="0.4" opacity="0.8" />
              <path d="M36 12 L60 36 L36 60 L12 36 Z" fill="none" stroke={DS.cosmicCyan} strokeWidth="0.3" opacity="0.5" />
              <circle cx="36" cy="0"  r="1.5" fill={DS.cosmicPurple} opacity="0.5" />
              <circle cx="72" cy="36" r="1.5" fill={DS.cosmicCyan} opacity="0.5" />
              <circle cx="36" cy="72" r="1.5" fill={DS.cosmicMagenta} opacity="0.5" />
              <circle cx="0"  cy="36" r="1.5" fill={DS.text}  opacity="0.4" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hofCrystalGrid)" />
        </svg>

        {/* Layer 4: Corner + mid prismatic halos */}
        {PRISM_FLARES.map((f, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              top: f.top,
              left: f.left,
              width: f.size,
              height: f.size,
              transform: "translate(-50%, -50%)",
              borderRadius: "50%",
              background: `radial-gradient(circle, ${f.color}14 0%, ${f.color}07 40%, transparent 70%)`,
              filter: "blur(18px)",
              animation: `hofFlare ${f.dur} ${f.delay} ease-in-out infinite`,
            }}
          />
        ))}

        {/* Layer 5: Rising prismatic sparks */}
        {CRYSTAL_SPARKS.map((s, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              bottom: 0,
              left: s.left,
              width: s.size,
              height: s.size,
              borderRadius: "50%",
              backgroundColor: s.color,
              boxShadow: `0 0 8px 2px ${s.color}`,
              animation: `hofSpark ${s.dur} ${s.delay} ease-out infinite`,
            }}
          />
        ))}

        {/* Layer 6: Top border cometary sweeps */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, overflow: "hidden" }}>
          <div
            style={{
              position: "absolute",
              top: 0,
              width: "50%",
              height: "100%",
              backgroundImage: "linear-gradient(90deg, transparent, rgba(129,140,248,0.9), rgba(125,211,252,0.9), transparent)",
              animation: "hofTopBeam 6s 0s linear infinite",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 0,
              width: "35%",
              height: "100%",
              backgroundImage: "linear-gradient(90deg, transparent, rgba(240,171,252,0.8), rgba(255,255,255,0.8), transparent)",
              animation: "hofTopBeam 8s 3s linear infinite",
            }}
          />
        </div>

        {/* Layer 7: Bottom vignette */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 80,
            background: "linear-gradient(to bottom, transparent, rgba(2,6,23,0.6))",
          }}
        />
      </div>
    </>
  );
}

// ── Holographic Award Card ──────────────────────────────────────────────
function HolographicCard({
  member,
  award,
  icon,
  accentColor,
  delay,
  locale,
}: {
  member: MemberRecord;
  award: string;
  icon: React.ReactNode;
  accentColor: string;
  delay: number;
  locale: string;
}) {
  const [imgError, setImgError] = useState(false);
  const rankKey = normalizeRank(member.rank as string | undefined);
  const cfg = RANKS[rankKey];
  const name = (member.name as string) ?? "???";
  const slug = (member.slug as string) ?? String(member.id ?? 0);
  const role = (member.role as string) ?? "";
  const image = (member.image as string) ?? "";
  const level = (member.level as number) ?? 1;
  const achievements = ((member.achievements as string[]) ?? []).length;
  const lpBalance = (member.availableLp as number) ?? 0;

  return (
    <motion.div
      className="relative cursor-pointer group"
      initial={{ opacity: 0, y: 60, rotateX: 20 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay }}
      whileHover={{ y: -12, scale: 1.04 }}
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
      <Link href={`/${locale}/team/${slug}`} style={{ textDecoration: "none", color: "inherit" }}>
        <div
          className="relative overflow-hidden rounded-xl"
          style={{
            backgroundColor: DS.bgCard,
            backgroundImage: `linear-gradient(135deg, ${DS.bgCard}, ${DS.bgDeep})`,
            border: `1.5px solid ${accentColor}60`,
            boxShadow: `0 0 30px ${accentColor}40, 0 8px 32px rgba(0,0,0,0.4)`,
          }}
        >
          {/* Holographic shimmer overlay */}
          <div
            className="absolute inset-0 pointer-events-none opacity-30"
            style={{
              backgroundImage:
                "linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.15) 45%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0.15) 55%, transparent 100%)",
              backgroundSize: "200% 200%",
              animation: "guildHoloShine 4s linear infinite",
            }}
          />

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
                  letterSpacing: "0.18em",
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
                  {image && !imgError ? (
                    <img src={image} alt={name} className="w-full h-full object-cover" onError={() => setImgError(true)} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center" style={{ color: cfg.color, background: DS.bgCard }}>
                      {name.charAt(0)}
                    </div>
                  )}
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
                  fontFamily: DS.heading,
                  color: DS.text,
                  fontSize: 15,
                  fontWeight: 700,
                  letterSpacing: "0.05em",
                  textShadow: `0 0 10px ${accentColor}80`,
                }}
              >
                {name}
              </div>
              <div
                style={{
                  color: DS.text4,
                  fontSize: 10,
                  fontFamily: "'JetBrains Mono', monospace",
                  letterSpacing: "0.08em",
                  marginTop: 2,
                }}
              >
                {role}
              </div>
            </div>

            {/* Stats row */}
            <div className="flex items-center justify-center gap-4 mt-3">
              <div className="text-center">
                <div
                  style={{
                    fontFamily: DS.heading,
                    color: cfg.color,
                    fontSize: 18,
                    fontWeight: 700,
                    textShadow: `0 0 10px ${cfg.glowColor}`,
                  }}
                >
                  {level}
                </div>
                <div
                  style={{
                    color: DS.text4,
                    fontSize: 8,
                    fontFamily: "'JetBrains Mono', monospace",
                    letterSpacing: "0.1em",
                  }}
                >
                  LEVEL
                </div>
              </div>
              <div
                style={{
                  width: 1,
                  height: 24,
                  background: `linear-gradient(180deg, transparent, ${DS.bgDeep}, transparent)`,
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
                  {achievements}
                </div>
                <div
                  style={{
                    color: DS.text4,
                    fontSize: 8,
                    fontFamily: "'JetBrains Mono', monospace",
                    letterSpacing: "0.1em",
                  }}
                >
                  ACHIEVEMENTS
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
              <div style={{ color: DS.text4, fontSize: 9, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.1em" }}>
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
                {formatLP(lpBalance)}
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
            >
              <span
                style={{
                  color: accentColor,
                  fontSize: 9,
                  letterSpacing: "0.12em",
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                ◈ VIEW PROFILE
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// ── Main HallOfFame ──────────────────────────────────────────────────────
export function HallOfFame({ mvp, bugSlayer, topPerformer, locale }: HallOfFameProps) {
  return (
    <div className="mb-14 relative" style={{ borderRadius: 16 }}>
      <PrismBackground />

      <div style={{ position: "relative", zIndex: 1, paddingTop: 32, paddingBottom: 32, paddingLeft: 8, paddingRight: 8 }}>

        {/* Section header */}
        <div className="text-center mb-8">
          {/* Decorative prismatic line */}
          <div style={{ height: 1, marginBottom: 16, position: "relative", overflow: "hidden" }}>
            <div
              style={{
                position: "absolute",
                inset: 0,
                backgroundImage: "linear-gradient(90deg, transparent, rgba(129,140,248,0.6), rgba(125,211,252,0.8), rgba(240,171,252,0.6), transparent)",
              }}
            />
          </div>

          <div className="flex items-center justify-center gap-3 mb-3">
            <div
              style={{
                flex: 1,
                maxWidth: 150,
                height: 1,
                backgroundImage: "linear-gradient(90deg, transparent, rgba(129,140,248,0.5))",
              }}
            />
            {/* Crown icon */}
            <svg width="20" height="17" viewBox="0 0 20 17" fill="none">
              <defs>
                <linearGradient id="hofCrownGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%"   stopColor={DS.cosmicPurple} />
                  <stop offset="50%"  stopColor={DS.cosmicCyan} />
                  <stop offset="100%" stopColor={DS.cosmicMagenta} />
                </linearGradient>
              </defs>
              <path d="M1 16 L4 6 L8 11 L10 1 L12 11 L16 6 L19 16 Z" fill="none" stroke="url(#hofCrownGrad)" strokeWidth="1.4" strokeLinejoin="round"/>
              <line x1="1" y1="16" x2="19" y2="16" stroke="url(#hofCrownGrad)" strokeWidth="1.6" strokeLinecap="round"/>
              <circle cx="1"  cy="16" r="1.5" fill={DS.cosmicMagenta} />
              <circle cx="10" cy="1"  r="1.5" fill={DS.cosmicCyan} />
              <circle cx="19" cy="16" r="1.5" fill={DS.cosmicPurple} />
            </svg>
            <div
              style={{
                flex: 1,
                maxWidth: 150,
                height: 1,
                backgroundImage: "linear-gradient(90deg, rgba(240,171,252,0.5), transparent)",
              }}
            />
          </div>

          <h3
            style={{
              fontFamily: DS.heading,
              fontSize: 26,
              fontWeight: 900,
              letterSpacing: "0.12em",
              background: `linear-gradient(135deg, ${DS.pink} 0%, ${DS.pinkLight} 35%, ${DS.purple} 65%, ${DS.text} 85%, ${DS.pink} 100%)`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundSize: "200% 100%",
              animation: "guildHoloShine 5s linear infinite",
            }}
          >
            ⦿ HALL OF FAME ⦿
          </h3>
          <p
            className="mt-2"
            style={{
              fontSize: 11,
              fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: "0.18em",
              background: `linear-gradient(90deg, ${DS.cosmicPurple}, ${DS.cosmicCyan}, ${DS.cosmicMagenta})`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            — LEGENDS OF THE GUILD —
          </p>
          <p
            className="mt-1"
            style={{
              color: DS.text5,
              fontSize: 9,
              fontFamily: DS.mono,
              letterSpacing: "0.2em",
            }}
          >
            ✦ DIAMOND SANCTUM · APEX RECORDS ✦
          </p>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-3 gap-6 max-w-4xl mx-auto max-md:grid-cols-1 max-lg:grid-cols-3 max-sm:grid-cols-1">
          <HolographicCard
            member={mvp}
            award="MVP LEGEND"
            icon={<Trophy size={12} />}
            accentColor={DS.amber}
            delay={0.1}
            locale={locale}
          />
          <HolographicCard
            member={bugSlayer}
            award="BUG SLAYER"
            icon={<Zap size={12} />}
            accentColor={DS.red}
            delay={0.25}
            locale={locale}
          />
          <HolographicCard
            member={topPerformer}
            award="TOP PERFORMER"
            icon={<Target size={12} />}
            accentColor={DS.cosmicCyan}
            delay={0.4}
            locale={locale}
          />
        </div>

        {/* Bottom ornament */}
        <div className="flex items-center justify-center gap-2 mt-8">
          <div
            style={{
              flex: 1,
              maxWidth: 100,
              height: 1,
              backgroundImage: "linear-gradient(90deg, transparent, rgba(129,140,248,0.4))",
            }}
          />
          {[DS.cosmicPurple, DS.cosmicCyan, DS.cosmicMagenta, DS.text, DS.cosmicMagenta, DS.cosmicCyan, DS.cosmicPurple].map((c, i) => (
            <div
              key={i}
              style={{
                width: i === 3 ? 7 : 5,
                height: i === 3 ? 7 : 5,
                borderRadius: "50%",
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
              backgroundImage: "linear-gradient(90deg, rgba(240,171,252,0.4), transparent)",
            }}
          />
        </div>

        {/* Bottom prismatic line */}
        <div style={{ height: 1, marginTop: 16, position: "relative", overflow: "hidden" }}>
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage: "linear-gradient(90deg, transparent, rgba(240,171,252,0.6), rgba(125,211,252,0.8), rgba(129,140,248,0.6), transparent)",
            }}
          />
        </div>
      </div>
    </div>
  );
}
