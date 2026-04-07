"use client";

/**
 * HomeClient — Full home page (client component)
 * Contains all interactive/animated sections.
 * Metadata is exported from page.tsx (server component).
 *
 * i18n: uses useTranslations("HomePage") from next-intl.
 * All hardcoded Vietnamese strings are replaced with t("key") calls
 * that map to keys in src/messages/{locale}/HomePage.
 */
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { motion } from "motion/react";
import {
  Zap, Shield, ChevronRight,
  ArrowRight, TrendingUp, Users, Award, Sparkles,
  Heart, Eye, Layers,
  Clock, Rocket,
} from "lucide-react";
import { DS, GRD } from "@/lib/design-tokens";
import ServicesSection from "@/components/landing/ServicesSectionClient";
import { OnboardingClient } from "@/components/landing/OnboardingClient";

/* ── Galaxy keyframes ── */
const GALAXY_KEYFRAMES = `
@keyframes pulse-glow {
  0%, 100% { opacity: 0.5; transform: scale(1); }
  50% { opacity: 0.9; transform: scale(1.03); }
}
`;

/** Animated counter using motion values */
function AnimatedCounter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const [display, setDisplay] = useState("0");
  useEffect(() => {
    let start: number | null = null;
    const duration = 1400;
    const animate = (ts: number) => {
      if (!start) start = ts;
      const pct = Math.min((ts - start) / duration, 1);
      const ease = 1 - Math.pow(1 - pct, 3);
      setDisplay(Math.floor(to * ease).toLocaleString("vi-VN"));
      if (pct < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [to]);

  return <>{display}{suffix}</>;
}

/** Section badge */
function Badge({ label, color = DS.blue }: { label: string; color?: string }) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.5rem",
        marginBottom: "1.25rem",
        padding: "0.375rem 1rem",
        borderRadius: "9999px",
        background: `${color}10`,
        border: `1px solid ${color}30`,
      }}
    >
      <div
        style={{
          width: 6, height: 6, borderRadius: "50%",
          background: color, boxShadow: `0 0 6px ${color}`,
        }}
      />
      <span
        style={{
          color, fontSize: "0.625rem",
          fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.22em",
        }}
      >
        {label}
      </span>
    </div>
  );
}

// ── HERO SECTION ─────────────────────────────────────────────────────────────

function HeroSection({ locale }: { locale: string }) {
  const t = useTranslations("home");
  const [activeMetric, setActiveMetric] = useState(0);
  const metrics = [
    { labelKey: "heroMetricProjects", value: "120+", color: DS.blue },
    { labelKey: "heroMetricClients", value: "98%", color: DS.green },
    { labelKey: "heroMetricYears", value: "7+", color: DS.purple },
    { labelKey: "heroMetricPartners", value: "50+", color: DS.cyan },
  ];

  useEffect(() => {
    const timer = setInterval(() => setActiveMetric((p) => (p + 1) % metrics.length), 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: GALAXY_KEYFRAMES }} />
    <section
      style={{
        position: "relative", minHeight: "100vh", display: "flex",
        alignItems: "center", paddingTop: "7rem", paddingBottom: "5rem",
        paddingLeft: "1.5rem", paddingRight: "1.5rem", overflow: "hidden",
      }}
    >
      {/* ── GALAXY BACKGROUND (from color_2.png palette) ── */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
        {/* Deep space base: #0C0C14 → #1A1A2E */}
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 15% 50%, #1A1A2E 0%, #0C0C14 45%, #080810 100%)" }} />

        {/* Nebula cloud 1 — purple #6B3DF5 (top-left, dominant) */}
        <motion.div
          style={{
            position: "absolute", top: "-10%", left: "-5%",
            width: "70%", height: "70%", borderRadius: "50%",
            background: "radial-gradient(circle, rgba(107,61,245,0.28) 0%, rgba(79,125,243,0.12) 40%, transparent 70%)",
            filter: "blur(45px)",
          }}
          animate={{ x: [0, 80, 0], y: [0, -30, 0], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 28, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* Nebula cloud 2 — red #CC3344 (bottom-right) */}
        <motion.div
          style={{
            position: "absolute", bottom: "-10%", right: "-5%",
            width: "60%", height: "60%", borderRadius: "50%",
            background: "radial-gradient(circle, rgba(204,51,68,0.22) 0%, rgba(107,61,245,0.08) 50%, transparent 70%)",
            filter: "blur(55px)",
          }}
          animate={{ x: [0, -60, 0], y: [0, 30, 0], opacity: [0.5, 0.9, 0.5] }}
          transition={{ duration: 35, repeat: Infinity, ease: "easeInOut", delay: 6 }}
        />
        {/* Nebula cloud 3 — blue #4F7DF3 (center-right) */}
        <motion.div
          style={{
            position: "absolute", top: "30%", right: "5%",
            width: "45%", height: "45%", borderRadius: "50%",
            background: "radial-gradient(circle, rgba(79,125,243,0.18) 0%, rgba(107,61,245,0.06) 60%, transparent 70%)",
            filter: "blur(40px)",
          }}
          animate={{ x: [0, -40, 0], y: [0, -50, 0], opacity: [0.5, 0.85, 0.5] }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut", delay: 10 }}
        />

        {/* Star field */}
        <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
          {/* Large stars */}
          {[
            { cx: 8, cy: 12, r: 2, op: 0.9 }, { cx: 15, cy: 25, r: 1.5, op: 0.7 },
            { cx: 22, cy: 8, r: 1, op: 0.8 }, { cx: 35, cy: 18, r: 2, op: 0.6 },
            { cx: 42, cy: 5, r: 1.5, op: 0.9 }, { cx: 55, cy: 22, r: 1, op: 0.7 },
            { cx: 62, cy: 10, r: 2, op: 0.8 }, { cx: 70, cy: 30, r: 1.5, op: 0.6 },
            { cx: 78, cy: 15, r: 1, op: 0.9 }, { cx: 85, cy: 40, r: 2, op: 0.7 },
            { cx: 90, cy: 8, r: 1.5, op: 0.8 }, { cx: 5, cy: 55, r: 1, op: 0.6 },
            { cx: 25, cy: 60, r: 2, op: 0.9 }, { cx: 40, cy: 50, r: 1.5, op: 0.7 },
            { cx: 58, cy: 65, r: 1, op: 0.8 }, { cx: 72, cy: 55, r: 2, op: 0.6 },
            { cx: 88, cy: 70, r: 1.5, op: 0.9 }, { cx: 12, cy: 80, r: 1, op: 0.7 },
            { cx: 30, cy: 88, r: 2, op: 0.8 }, { cx: 50, cy: 75, r: 1.5, op: 0.6 },
          ].map((s, i) => (
            <circle key={i} cx={`${s.cx}%`} cy={`${s.cy}%`} r={s.r} fill="white" opacity={s.op} />
          ))}
          {/* Tiny stars */}
          {Array.from({ length: 60 }, (_, i) => {
            const x = (i * 17.3) % 100;
            const y = (i * 23.7 + 7) % 100;
            return <circle key={`tiny-${i}`} cx={`${x}%`} cy={`${y}%`} r={0.5} fill="white" opacity={0.3 + (i % 5) * 0.1} />;
          })}
          {/* Twinkling stars */}
          {[
            { cx: 10, cy: 30 }, { cx: 30, cy: 15 }, { cx: 60, cy: 35 },
            { cx: 80, cy: 20 }, { cx: 45, cy: 70 }, { cx: 20, cy: 45 },
            { cx: 75, cy: 65 }, { cx: 55, cy: 10 },
          ].map((s, i) => (
            <motion.circle
              key={`twinkle-${i}`}
              cx={`${s.cx}%`} cy={`${s.cy}%`} r={1.2} fill="white"
              animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.2, 0.8] }}
              transition={{ duration: 2 + i * 0.3, repeat: Infinity, ease: "easeInOut" }}
            />
          ))}
        </svg>

        {/* Shooting stars (purple/blue tint from palette) */}
        <motion.div
          style={{
            position: "absolute", top: "15%", left: "-5%",
            width: 130, height: 2, borderRadius: 2,
            background: "linear-gradient(90deg, transparent, rgba(107,61,245,0.9), rgba(255,255,255,0.7))",
            transformOrigin: "left center",
          }}
          animate={{ x: [0, 800], y: [0, 200], opacity: [0, 1, 0] }}
          transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 9, ease: "easeOut" }}
        />
        <motion.div
          style={{
            position: "absolute", top: "40%", left: "-5%",
            width: 80, height: 1.5, borderRadius: 2,
            background: "linear-gradient(90deg, transparent, rgba(79,125,243,0.8), rgba(230,199,95,0.4))",
            transformOrigin: "left center",
          }}
          animate={{ x: [0, 600], y: [0, 150], opacity: [0, 1, 0] }}
          transition={{ duration: 1, repeat: Infinity, repeatDelay: 15, ease: "easeOut", delay: 5 }}
        />
        <motion.div
          style={{
            position: "absolute", top: "5%", left: "30%",
            width: 100, height: 1, borderRadius: 2,
            background: "linear-gradient(90deg, transparent, rgba(204,51,68,0.7), rgba(255,255,255,0.5))",
            transformOrigin: "left center",
          }}
          animate={{ x: [0, 500], y: [0, 120], opacity: [0, 0.8, 0] }}
          transition={{ duration: 0.9, repeat: Infinity, repeatDelay: 22, ease: "easeOut", delay: 12 }}
        />

        {/* Subtle grid overlay */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "linear-gradient(rgba(255,255,255,0.012) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.012) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }} />

        {/* Foreground dark overlay — darkens the nebula edges for readability, matching space palette */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(135deg, rgba(12,12,20,0.90) 0%, rgba(12,12,20,0.55) 40%, rgba(12,12,20,0.30) 100%)",
        }} />
      </div>

      <div
        style={{
          maxWidth: "80rem", margin: "0 auto", width: "100%",
          display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "4rem", alignItems: "center", position: "relative", zIndex: 1,
        }}
      >
        {/* LEFT: Text */}
        <div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Badge label={t("heroBadge")} />
          </motion.div>

          {/* Headline */}
          <h1
            style={{
              fontFamily: DS.heading, letterSpacing: "0.04em",
              lineHeight: 1.1, marginBottom: "1.5rem",
            }}
          >
            {[
              { text: t("heroTitle1"), gradient: "linear-gradient(135deg, #FFFFFF 0%, #CBD5E1 100%)" },
              { text: t("heroTitle2"), gradient: GRD.primary },
            ].map((item, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                style={{ display: "block", fontSize: "clamp(2.25rem, 5vw, 4rem)", fontWeight: 900 }}
              >
                <span
                  style={{
                    background: item.gradient,
                    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  {item.text}
                </span>
              </motion.span>
            ))}
          </h1>

          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
            style={{ color: DS.text3, fontSize: "1.0625rem", lineHeight: 1.8, marginBottom: "2.25rem", maxWidth: 520 }}
          >
            {t("heroDesc")}
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
            style={{ display: "flex", flexWrap: "wrap", gap: "1rem", marginBottom: "3rem" }}
          >
            <Link
              href={`/${locale}/booking`}
              style={{
                background: GRD.primary, color: "#fff", fontSize: "0.9375rem",
                fontWeight: 700, padding: "0.875rem 2rem", borderRadius: "0.875rem",
                textDecoration: "none", display: "flex", alignItems: "center",
                gap: "0.625rem", boxShadow: "0 0 40px rgba(129,140,248,0.5), 0 8px 24px rgba(0,0,0,0.3)",
                letterSpacing: "0.02em",
              }}
            >
              <Rocket size={17} />
              {t("heroStartNow")}
            </Link>
            <Link
              href={`/${locale}/portfolio`}
              style={{
                color: DS.text2, fontSize: "0.9375rem", fontWeight: 500,
                padding: "0.875rem 2rem", borderRadius: "0.875rem",
                border: "1px solid rgba(255,255,255,0.12)", textDecoration: "none",
                display: "flex", alignItems: "center", gap: "0.625rem",
                background: "rgba(255,255,255,0.04)", backdropFilter: "blur(12px)",
              }}
            >
              <Eye size={16} />
              {t("heroViewProjects")}
            </Link>
          </motion.div>

          {/* Rotating metrics */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
            style={{ display: "flex", flexWrap: "wrap", gap: "2rem" }}
          >
            {metrics.map((m, i) => (
              <div key={m.labelKey} style={{ opacity: i === activeMetric ? 1 : 0.35, transition: "opacity 0.4s ease" }}>
                <div
                  style={{
                    color: m.color, fontFamily: DS.heading,
                    fontSize: "1.5rem", fontWeight: 900, textShadow: `0 0 16px ${m.color}60`,
                  }}
                >
                  {m.value}
                </div>
                <div
                  style={{
                    color: DS.text5, fontSize: "0.6875rem",
                    fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.1em", marginTop: "0.125rem",
                  }}
                >
                  {t(m.labelKey)}
                </div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* RIGHT: Banner_2k Card — featured showcase */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          style={{ position: "relative" }}
        >
          {/* Outer glow ring — purple/blue from palette */}
          <div style={{
            position: "absolute", inset: "-3px",
            borderRadius: "1.75rem",
            background: "linear-gradient(135deg, rgba(107,61,245,0.5), rgba(79,125,243,0.4), rgba(204,51,68,0.25))",
            filter: "blur(14px)",
            animation: "pulse-glow 4s ease-in-out infinite",
          }} />

          {/* Card frame */}
          <div
            style={{
              position: "relative", borderRadius: "1.5rem", overflow: "hidden",
              border: "1px solid rgba(59,130,246,0.3)",
              boxShadow: "0 0 100px rgba(107,61,245,0.18), 0 40px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05) inset",
            }}
          >
            {/* Banner image — full bleed */}
            <div style={{ position: "relative", aspectRatio: "16/9", overflow: "hidden" }}>
              <img
                src="/assets/design-company/Banner_2k.png"
                alt="LOOP Solutions Agency Platform"
                style={{
                  width: "100%", height: "100%", objectFit: "cover",
                  display: "block",
                }}
              />
              {/* Bottom gradient for text readability */}
              <div style={{
                position: "absolute", inset: 0,
                background: "linear-gradient(to top, rgba(12,12,20,0.9) 0%, rgba(12,12,20,0.3) 40%, transparent 70%)",
              }} />
              {/* Brand overlay */}
              <div style={{
                position: "absolute", bottom: "1rem", left: "1.25rem",
                display: "flex", alignItems: "center", gap: "0.5rem",
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: "rgba(12,12,20,0.8)", backdropFilter: "blur(10px)",
                  border: "1px solid rgba(107,61,245,0.5)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 0 16px rgba(107,61,245,0.5)",
                }}>
                  <img src="/logo.png" alt="" style={{ width: 24, height: 24, objectFit: "contain" }} />
                </div>
                <div>
                  <div style={{ color: "#fff", fontFamily: DS.heading, fontSize: "0.875rem", fontWeight: 900, letterSpacing: "0.08em", textShadow: "0 2px 12px rgba(107,61,245,0.7)" }}>LOOP SOLUTIONS</div>
                  <div style={{ color: "rgba(147,197,253,0.8)", fontSize: "0.5625rem", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.2em" }}>DIGITAL AGENCY OS</div>
                </div>
              </div>
              {/* Live badge */}
              <div style={{
                position: "absolute", top: "0.75rem", right: "0.75rem",
                display: "flex", alignItems: "center", gap: 4,
                background: "rgba(2,6,23,0.8)", backdropFilter: "blur(8px)",
                padding: "0.25rem 0.625rem", borderRadius: 20,
                border: "1px solid rgba(34,197,94,0.3)",
              }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: DS.green, boxShadow: `0 0 6px ${DS.green}` }} />
                <span style={{ color: DS.green, fontSize: "0.5625rem", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.1em" }}>LIVE</span>
              </div>
            </div>

            {/* Stats bar */}
            <div style={{
              display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
              gap: "0.5rem", padding: "0.875rem 1rem",
              background: "rgba(12,12,20,0.9)",
              borderTop: "1px solid rgba(59,130,246,0.1)",
            }}>
              {[
                { label: "PROJECTS", value: "120+", color: DS.blue, icon: <Layers size={11} /> },
                { label: "CLIENTS", value: "98%", color: DS.green, icon: <TrendingUp size={11} /> },
                { label: "LP REWARD", value: "500K", color: DS.purple, icon: <Zap size={11} /> },
              ].map((s) => (
                <div key={s.label} style={{
                  display: "flex", alignItems: "center", gap: "0.5rem",
                  padding: "0.5rem 0.625rem",
                  borderRadius: "0.5rem",
                  background: "rgba(255,255,255,0.04)",
                  border: `1px solid ${s.color}30`,
                }}>
                  <span style={{ color: s.color, opacity: 0.8 }}>{s.icon}</span>
                  <div>
                    <div style={{ color: s.color, fontFamily: DS.heading, fontSize: "0.75rem", fontWeight: 700 }}>{s.value}</div>
                    <div style={{ color: DS.text5, fontSize: "0.4375rem", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.08em" }}>{s.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Floating LP badge */}
          <motion.div
            style={{
              position: "absolute", top: "-1rem", right: "-0.75rem",
              padding: "0.625rem 0.875rem", borderRadius: "1rem",
              background: "rgba(12,12,20,0.95)", border: "1px solid rgba(107,61,245,0.45)",
              backdropFilter: "blur(20px)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.5), 0 0 20px rgba(139,92,246,0.2)",
            }}
            animate={{ y: [0, -8, 0], opacity: [0.9, 1, 0.9] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
              <Zap size={13} style={{ color: DS.purple }} />
              <span style={{ color: DS.purple, fontFamily: DS.heading, fontSize: "0.875rem", fontWeight: 700 }}>+500 LP</span>
            </div>
          </motion.div>

          {/* Floating rank card */}
          <motion.div
            style={{
              position: "absolute", bottom: "-0.75rem", left: "-0.75rem",
              padding: "0.625rem 0.875rem", borderRadius: "1rem",
              background: "rgba(12,12,20,0.95)", border: "1px solid rgba(230,199,95,0.25)",
              backdropFilter: "blur(20px)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
            }}
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
              <span style={{ color: "#E6C75F", fontSize: "0.75rem" }}>★</span>
              <span style={{ color: "#E6C75F", fontFamily: DS.heading, fontSize: "0.75rem", fontWeight: 700 }}>GOLD</span>
              <ArrowRight size={10} style={{ color: DS.text5 }} />
              <span style={{ color: DS.cyan, fontFamily: DS.heading, fontSize: "0.75rem", fontWeight: 700 }}>PLATINUM</span>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        style={{ position: "absolute", bottom: "2rem", left: "50%", transform: "translateX(-50%)" }}
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div
          style={{
            width: 24, height: 40, border: "2px solid rgba(255,255,255,0.15)",
            borderRadius: 12, display: "flex", justifyContent: "center", paddingTop: "0.25rem",
          }}
        >
          <div style={{ width: 3, height: 10, background: DS.blue, borderRadius: 2 }} />
        </div>
      </motion.div>
    </section>
    </>
  );
}

// ── MARQUEE ───────────────────────────────────────────────────────────────────

function MarqueeSection() {
  const items = [
    "✦ React & Next.js", "◈ Supabase", "✦ TypeScript", "◈ AWS", "✦ Figma to Code",
    "◈ React Native", "✦ Node.js", "◈ PostgreSQL", "✦ Docker", "◈ SEO Pro",
    "✦ CI/CD Pipeline", "◈ Tailwind CSS", "✦ Rust", "◈ BigQuery",
  ];
  const doubled = [...items, ...items];

  return (
    <div
      style={{
        borderTop: `1px solid ${DS.border}`, borderBottom: `1px solid ${DS.border}`,
        overflow: "hidden", padding: "0.875rem 0",
      }}
    >
      <motion.div
        style={{ display: "flex", gap: "2rem", whiteSpace: "nowrap" }}
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
      >
        {doubled.map((item, i) => (
          <span
            key={i}
            style={{
              color: i % 2 === 0 ? DS.blue : DS.text4,
              fontSize: "0.75rem", fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: "0.15em", flexShrink: 0,
            }}
          >
            {item}
          </span>
        ))}
      </motion.div>
    </div>
  );
}

// ── STATS SECTION ────────────────────────────────────────────────────────────

function StatsSection() {
  const t = useTranslations("home");
  const stats = [
    { value: 120, suffix: "+", labelKey: "statsProjects", icon: <Rocket size={22} />, color: DS.blue },
    { value: 98, suffix: "%", labelKey: "statsSatisfaction", icon: <Heart size={22} />, color: DS.green },
    { value: 7, suffix: "+", labelKey: "statsYears", icon: <Award size={22} />, color: DS.amber },
    { value: 50, suffix: "+", labelKey: "statsPartners", icon: <Users size={22} />, color: DS.purple },
    { value: 24, suffix: "/7", labelKey: "statsSupport", icon: <Clock size={22} />, color: DS.cyan },
    { value: 99.9, suffix: "%", labelKey: "statsUptime", icon: <Shield size={22} />, color: DS.red },
  ];

  return (
    <section
      style={{
        padding: "5rem 1.5rem",
        background: "linear-gradient(180deg, rgba(15,23,42,0.4) 0%, rgba(2,6,23,0) 100%)",
      }}
    >
      <div style={{ maxWidth: "72rem", margin: "0 auto" }}>
        <div
          style={{
            display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
            gap: "1.25rem",
          }}
        >
          {stats.map((s, i) => (
            <motion.div
              key={s.labelKey}
              style={{
                textAlign: "center", padding: "1.25rem", borderRadius: "1.25rem",
                background: "rgba(15,23,42,0.6)", border: `1px solid ${DS.border}`,
                backdropFilter: "blur(12px)",
              }}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.5 }}
              whileHover={{ borderColor: `${s.color}40`, boxShadow: `0 0 20px ${s.color}15` }}
            >
              <div
                style={{
                  width: 44, height: 44, borderRadius: "0.75rem",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto 0.75rem", background: `${s.color}15`,
                  border: `1px solid ${s.color}25`,
                }}
              >
                <span style={{ color: s.color }}>{s.icon}</span>
              </div>
              <div
                style={{
                  color: s.color, fontFamily: DS.heading,
                  fontSize: "1.625rem", fontWeight: 900, textShadow: `0 0 16px ${s.color}50`,
                }}
              >
                <AnimatedCounter to={s.value} suffix={s.suffix} />
              </div>
              <div
                style={{
                  color: DS.text4, fontSize: "0.6875rem",
                  marginTop: "0.25rem", lineHeight: 1.4,
                }}
              >
                {t(s.labelKey)}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── LP SYSTEM SECTION ─────────────────────────────────────────────────────────

function LPSystemSection({ locale }: { locale: string }) {
  const t = useTranslations("home");
  const rankFlow = [
    { rank: "IRON", color: "#9CA3AF", symbol: "⬡", desc: t("rankFlowStart") },
    { rank: "BRONZE", color: "#CD7F32", symbol: "◈", desc: t("rankFlowPlus", { count: "350" }) },
    { rank: "SILVER", color: "#CBD5E1", symbol: "◇", desc: t("rankFlowPlus", { count: "800" }) },
    { rank: "GOLD", color: "#FFD700", symbol: "★", desc: t("rankFlowPlus", { count: "2K" }), highlight: true },
    { rank: "PLATINUM", color: "#14B8A6", symbol: "❋", desc: t("rankFlowPlus", { count: "5K" }) },
    { rank: "RUBY", color: "#EF4444", symbol: "♦", desc: t("rankFlowPlus", { count: "12K" }) },
    { rank: "DIAMOND", color: "#818CF8", symbol: "✦", desc: t("rankFlowPlus", { count: "30K" }) },
  ];

  const benefits = [
    { icon: <Zap size={15} />, key: "lpBenefit1", color: DS.blue },
    { icon: <Users size={15} />, key: "lpBenefit2", color: DS.purple },
    { icon: <Award size={15} />, key: "lpBenefit3", color: DS.green },
    { icon: <Sparkles size={15} />, key: "lpBenefit4", color: DS.amber },
  ];

  return (
    <section style={{ padding: "6rem 1.5rem", background: "linear-gradient(160deg, rgba(15,23,42,0.5) 0%, rgba(2,6,23,0.5) 100%)" }}>
      <div style={{ maxWidth: "72rem", margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "4rem", alignItems: "center" }}>
          {/* Left */}
          <div>
            <Badge label={t("lpSectionBadge")} color={DS.purple} />
            <h2
              style={{
                fontFamily: DS.heading, fontSize: "clamp(1.5rem, 3.5vw, 2.5rem)",
                fontWeight: 900, letterSpacing: "0.05em",
                background: "linear-gradient(135deg, #FFFFFF, #94A3B8)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                backgroundClip: "text", marginBottom: "1rem",
              }}
            >
              {t("lpSectionTitle")}
            </h2>
            <p style={{ color: DS.text3, fontSize: "0.9375rem", lineHeight: 1.8, marginBottom: "1.5rem" }}>
              {t("lpSectionDesc")}
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "2rem" }}>
              {benefits.map((b) => (
                <div key={b.key} style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
                  <div
                    style={{
                      width: 32, height: 32, borderRadius: "0.5rem",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0, marginTop: 2,
                      background: `${b.color}15`, border: `1px solid ${b.color}25`,
                    }}
                  >
                    <span style={{ color: b.color }}>{b.icon}</span>
                  </div>
                  <span style={{ color: DS.text3, fontSize: "0.875rem", lineHeight: 1.6 }}>{t(b.key)}</span>
                </div>
              ))}
            </div>

            <Link
              href={`/${locale}/khach-hang`}
              style={{
                background: GRD.primary, color: "#fff", fontSize: "0.875rem",
                fontWeight: 600, padding: "0.6875rem 1.5rem", borderRadius: "0.625rem",
                textDecoration: "none", display: "inline-flex", alignItems: "center",
                gap: "0.5rem", boxShadow: "0 0 20px rgba(129,140,248,0.3)",
              }}
            >
              {t("btnAbout")} <ArrowRight size={15} />
            </Link>
          </div>

          {/* Right: Rank board */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div
              style={{
                borderRadius: "1rem", padding: "1.75rem",
                background: "rgba(15,23,42,0.7)", border: `1px solid ${DS.border}`,
                backdropFilter: "blur(12px)",
              }}
            >
              <div style={{ color: DS.text3, fontSize: "0.6875rem", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.18em", marginBottom: "1.25rem" }}>
                {t("rankBoardTitle")}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                {rankFlow.map((r, i) => (
                  <motion.div
                    key={r.rank}
                    style={{
                      display: "flex", alignItems: "center", gap: "1rem",
                      padding: "0.75rem", borderRadius: "0.75rem",
                      background: r.highlight ? `${r.color}12` : "rgba(255,255,255,0.03)",
                      border: `1px solid ${r.highlight ? `${r.color}30` : "transparent"}`,
                    }}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.07 }}
                  >
                    <span
                      style={{
                        color: r.color, fontSize: "1.375rem",
                        textShadow: `0 0 10px ${r.color}50`,
                        width: 28, textAlign: "center", flexShrink: 0,
                      }}
                    >
                      {r.symbol}
                    </span>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: r.color, fontSize: "0.6875rem", fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, letterSpacing: "0.12em" }}>{r.rank}</div>
                      <div style={{ color: DS.text5, fontSize: "0.625rem", fontFamily: "'JetBrains Mono', monospace" }}>{r.desc}</div>
                    </div>
                    {r.highlight && (
                      <div
                        style={{
                          display: "flex", alignItems: "center", gap: "0.375rem",
                          padding: "0.25rem 0.625rem", borderRadius: "0.5rem",
                          background: `${r.color}20`, border: `1px solid ${r.color}40`,
                        }}
                      >
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: r.color }} />
                        <span style={{ color: r.color, fontSize: "0.5625rem", fontFamily: "'JetBrains Mono', monospace" }}>{t("rankBoardYou")}</span>
                      </div>
                    )}
                    <div style={{ width: 80, height: 6, borderRadius: 3, background: "rgba(255,255,255,0.05)" }}>
                      <div style={{ height: 6, borderRadius: 3, width: `${Math.min(100, (7 - i) * 15)}%`, background: r.color }} />
                    </div>
                  </motion.div>
                ))}
              </div>
              <div
                style={{
                  marginTop: "1.5rem", padding: "1rem", borderRadius: "0.75rem",
                  background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)",
                }}
              >
                <div style={{ color: DS.text4, fontSize: "0.75rem", lineHeight: 1.6 }}>
                  💡 <strong style={{ color: DS.text3 }}>{t("rankBoardNeed", { desc: "" })}</strong> {t("rankBoardNote")}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ── CTA SECTION ───────────────────────────────────────────────────────────────

function CTASection({ locale }: { locale: string }) {
  const t = useTranslations("home");
  return (
    <section
      style={{ padding: "6rem 1.5rem", position: "relative", overflow: "hidden" }}
    >
      <div
        style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(ellipse at 50% 50%, rgba(29,78,216,0.15) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          maxWidth: "48rem", margin: "0 auto", textAlign: "center", position: "relative",
        }}
      >
        <Badge label={t("ctaBadge")} color={DS.cyan} />
        <h2
          style={{
            fontFamily: DS.heading, fontSize: "clamp(1.5rem, 3.5vw, 2.5rem)",
            fontWeight: 900, letterSpacing: "0.04em", color: DS.text, marginBottom: "1rem",
          }}
        >
          {t("ctaTurnIdeaTitle")}
        </h2>
        <p style={{ color: DS.text3, fontSize: "1rem", lineHeight: 1.8, marginBottom: "2rem" }}>
          {t("ctaTurnIdeaDesc")}
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", justifyContent: "center" }}>
          <Link
            href={`/${locale}/booking`}
            style={{
              background: GRD.primary, color: "#fff", fontSize: "1rem",
              fontWeight: 700, padding: "1rem 2rem", borderRadius: "0.875rem",
              textDecoration: "none", display: "flex", alignItems: "center",
              gap: "0.625rem", boxShadow: "0 0 40px rgba(129,140,248,0.5)",
            }}
          >
            <Rocket size={18} />
            {t("ctaBookingWizard")}
          </Link>
          <Link
            href={`/${locale}/contact`}
            style={{
              color: DS.text2, fontSize: "1rem", fontWeight: 500,
              padding: "1rem 2rem", borderRadius: "0.875rem",
              border: `1px solid ${DS.border2}`, textDecoration: "none",
              display: "flex", alignItems: "center", gap: "0.625rem",
              background: "rgba(255,255,255,0.04)",
            }}
          >
            <ChevronRight size={18} />
            {t("ctaSecondary")}
          </Link>
        </div>
      </div>
    </section>
  );
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────

export function HomeClient({ locale }: { locale: string }) {
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    // Hiện onboarding lần đầu (chưa từng xem)
    const done = localStorage.getItem("loop_onboarding_done");
    if (!done) setShowOnboarding(true);
  }, []);

  const completeOnboarding = useCallback(() => {
    localStorage.setItem("loop_onboarding_done", "1");
    setShowOnboarding(false);
  }, []);

  return (
    <>
      <main style={{ background: DS.bg, color: DS.text, minHeight: "100vh" }}>
        <HeroSection locale={locale} />
        <MarqueeSection />
        <StatsSection />
        <ServicesSection locale={locale} />
        <LPSystemSection locale={locale} />
        <CTASection locale={locale} />
      </main>
      {showOnboarding && (
        <div aria-hidden="true" data-nosnippet="" style={{ position: "fixed", inset: 0, zIndex: 200 }}>
          <OnboardingClient onComplete={completeOnboarding} />
        </div>
      )}
    </>
  );
}
