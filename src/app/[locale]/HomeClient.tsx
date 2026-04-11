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
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import {
  Zap, Shield, ChevronRight,
  ArrowRight, Users, Award, Sparkles,
  Heart, Eye,
  Clock, Rocket,
} from "lucide-react";
import { DS, GRD } from "@/lib/design-tokens";
import ServicesSection from "@/components/landing/ServicesSectionClient";
import { CaseStudiesSection } from "@/components/landing/CaseStudiesSectionClient";
import { OnboardingClient } from "@/components/landing/OnboardingClient";

/* ── Galaxy keyframes (motion.div only — nebula clouds + aurora) ── */
const GALAXY_KEYFRAMES = `
@keyframes pulse-glow {
  0%, 100% { opacity: 0.5; transform: scale(1); }
  50% { opacity: 0.9; transform: scale(1.03); }
}
@keyframes aurora-wave {
  0% { transform: translateX(-60%) skewX(-8deg); opacity: 0.15; }
  50% { transform: translateX(0%) skewX(-3deg); opacity: 0.30; }
  100% { transform: translateX(60%) skewX(-8deg); opacity: 0.15; }
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
        alignItems: "center", paddingTop: "6rem", paddingBottom: "4rem",
        paddingLeft: "1.5rem", paddingRight: "1.5rem", overflow: "hidden",
      }}
    >
      {/* ── GALAXY BACKGROUND (enhanced cosmic depth) ── */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
        {/* Layer 1 — Deep space base with layered radial depth */}
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 20% 40%, #1A1A2E 0%, #0C0C14 40%, #080810 70%, #04040C 100%)" }} />
        {/* Layer 2 — Cosmic horizon glow (bottom horizon light bleed) */}
        <div style={{ position: "absolute", bottom: "-20%", left: "10%", right: "10%", height: "40%", background: "radial-gradient(ellipse at 50% 100%, rgba(107,61,245,0.12) 0%, rgba(79,125,243,0.06) 40%, transparent 70%)", filter: "blur(30px)" }} />

        {/* Layer 3 — Aurora ribbons (drifting horizontal light bands) */}
        <motion.div
          style={{
            position: "absolute", top: "18%", left: "-60%",
            width: "200%", height: "12%",
            background: "linear-gradient(90deg, transparent 0%, rgba(107,61,245,0.20) 20%, rgba(236,72,153,0.12) 45%, rgba(79,125,243,0.18) 65%, rgba(107,61,245,0.08) 80%, transparent 100%)",
            filter: "blur(18px)",
          }}
          animate={{ x: ["-60%", "60%", "-60%"], opacity: [0.15, 0.30, 0.15] }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          style={{
            position: "absolute", top: "55%", left: "60%",
            width: "180%", height: "8%",
            background: "linear-gradient(90deg, transparent 0%, rgba(79,125,243,0.18) 25%, rgba(236,72,153,0.10) 50%, rgba(98,197,235,0.14) 75%, transparent 100%)",
            filter: "blur(22px)",
          }}
          animate={{ x: ["60%", "-60%", "60%"], opacity: [0.12, 0.25, 0.12] }}
          transition={{ duration: 28, repeat: Infinity, ease: "easeInOut", delay: 8 }}
        />

        {/* Layer 4 — Nebula clouds with rotation + scale pulse */}
        {/* Nebula cloud 1 — purple #6B3DF5 (top-left, dominant) */}
        <motion.div
          style={{
            position: "absolute", top: "-15%", left: "-8%",
            width: "75%", height: "75%", borderRadius: "50%",
            background: "radial-gradient(circle, rgba(107,61,245,0.32) 0%, rgba(79,125,243,0.14) 35%, rgba(207,83,182,0.06) 60%, transparent 75%)",
            filter: "blur(50px)",
          }}
          animate={{ x: [0, 90, 0], y: [0, -35, 0], scale: [1, 1.1, 1], opacity: [0.75, 1, 0.75] }}
          transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* Nebula cloud 2 — red #CC3344 (bottom-right, magenta tint) */}
        <motion.div
          style={{
            position: "absolute", bottom: "-12%", right: "-8%",
            width: "65%", height: "65%", borderRadius: "50%",
            background: "radial-gradient(circle, rgba(204,51,68,0.26) 0%, rgba(207,83,182,0.10) 45%, rgba(107,61,245,0.05) 65%, transparent 75%)",
            filter: "blur(60px)",
          }}
          animate={{ x: [0, -70, 0], y: [0, 35, 0], scale: [1, 1.06, 1], opacity: [0.55, 0.60, 0.55] }}
          transition={{ duration: 36, repeat: Infinity, ease: "easeInOut", delay: 7 }}
        />
        {/* Nebula cloud 3 — blue #4F7DF3 (center-right, cyan tint) */}
        <motion.div
          style={{
            position: "absolute", top: "25%", right: "2%",
            width: "50%", height: "50%", borderRadius: "50%",
            background: "radial-gradient(circle, rgba(79,125,243,0.22) 0%, rgba(98,197,235,0.08) 50%, rgba(107,61,245,0.04) 70%, transparent 80%)",
            filter: "blur(45px)",
          }}
          animate={{ x: [0, -50, 0], y: [0, -55, 0], scale: [1, 1.12, 1], opacity: [0.5, 0.90, 0.5] }}
          transition={{ duration: 24, repeat: Infinity, ease: "easeInOut", delay: 12 }}
        />
        {/* Nebula cloud 4 — deep magenta (top-right accent) */}
        <motion.div
          style={{
            position: "absolute", top: "5%", right: "20%",
            width: "35%", height: "35%", borderRadius: "50%",
            background: "radial-gradient(circle, rgba(207,83,182,0.18) 0%, rgba(95,60,153,0.08) 55%, transparent 75%)",
            filter: "blur(35px)",
          }}
          animate={{ x: [0, 30, 0], y: [0, -25, 0], opacity: [0.4, 0.75, 0.4] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 4 }}
        />

        {/* Layer 5 — Star field with depth layers */}
        <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
          {/* Background stars (far/dim, bigger + brighter) */}
          {Array.from({ length: 80 }, (_, i) => {
            const x = (i * 13.7) % 100;
            const y = (i * 19.1 + 11) % 100;
            return <circle key={`bg-${i}`} cx={`${x}%`} cy={`${y}%`} r={0.7} fill="white" opacity={0.30 + (i % 5) * 0.08} />;
          })}
          {/* Mid-ground stars (bright with glow halos) */}
          {[
            { cx: 8, cy: 12, r: 1.8 }, { cx: 15, cy: 25, r: 1.4 },
            { cx: 22, cy: 8, r: 1.2 }, { cx: 35, cy: 18, r: 2.0 },
            { cx: 42, cy: 5, r: 1.6 }, { cx: 55, cy: 22, r: 1.2 },
            { cx: 62, cy: 10, r: 2.0 }, { cx: 70, cy: 30, r: 1.4 },
            { cx: 78, cy: 15, r: 1.2 }, { cx: 85, cy: 40, r: 2.0 },
            { cx: 90, cy: 8, r: 1.6 }, { cx: 5, cy: 55, r: 1.2 },
            { cx: 25, cy: 60, r: 2.0 }, { cx: 40, cy: 50, r: 1.4 },
            { cx: 58, cy: 65, r: 1.2 }, { cx: 72, cy: 55, r: 2.0 },
            { cx: 88, cy: 70, r: 1.6 }, { cx: 12, cy: 80, r: 1.2 },
            { cx: 30, cy: 88, r: 2.0 }, { cx: 50, cy: 75, r: 1.4 },
            { cx: 18, cy: 38, r: 1.8 }, { cx: 65, cy: 75, r: 1.6 },
            { cx: 33, cy: 42, r: 1.4 }, { cx: 82, cy: 28, r: 1.8 },
          ].map((s, i) => (
            <g key={`mid-${i}`}>
              <circle cx={`${s.cx}%`} cy={`${s.cy}%`} r={s.r * 2.2} fill="rgba(180,200,255,0.18)" />
              <circle cx={`${s.cx}%`} cy={`${s.cy}%`} r={s.r} fill="white" opacity={0.60} />
            </g>
          ))}
          {/* Twinkling stars — CSS class + inline style for max browser compatibility */}
          {[
            { cx: 10, cy: 30, dur: 2.0, del: 0.0, gC: 1, cC: 1 },
            { cx: 30, cy: 15, dur: 2.8, del: 0.4, gC: 2, cC: 2 },
            { cx: 60, cy: 35, dur: 2.4, del: 0.8, gC: 3, cC: 3 },
            { cx: 80, cy: 20, dur: 1.8, del: 1.2, gC: 1, cC: 1 },
            { cx: 45, cy: 70, dur: 3.2, del: 0.2, gC: 2, cC: 2 },
            { cx: 20, cy: 45, dur: 2.6, del: 0.6, gC: 3, cC: 3 },
            { cx: 75, cy: 65, dur: 2.0, del: 1.6, gC: 1, cC: 1 },
            { cx: 55, cy: 10, dur: 2.8, del: 1.0, gC: 2, cC: 2 },
            { cx: 68, cy: 48, dur: 2.4, del: 1.4, gC: 3, cC: 3 },
            { cx: 38, cy: 82, dur: 1.8, del: 1.8, gC: 1, cC: 1 },
            { cx: 92, cy: 58, dur: 3.2, del: 2.0, gC: 2, cC: 2 },
            { cx: 15, cy: 92, dur: 2.6, del: 0.9, gC: 3, cC: 3 },
            { cx: 52, cy: 28, dur: 2.2, del: 0.3, gC: 1, cC: 1 },
            { cx: 83, cy: 72, dur: 3.0, del: 1.5, gC: 2, cC: 2 },
            { cx: 25, cy: 18, dur: 2.6, del: 2.2, gC: 3, cC: 3 },
            { cx: 70, cy: 42, dur: 1.9, del: 0.7, gC: 1, cC: 1 },
          ].map((s, i) => {
            const accentColor = i % 4 === 0 ? "#EC4899" : i % 4 === 1 ? "#6B3DF5" : i % 4 === 2 ? "#4F7DF3" : "#62C5EB";
            return (
              <g key={`twinkle-${i}`}>
                {/* Outer glow halo */}
                <circle cx={`${s.cx}%`} cy={`${s.cy}%`} r={6} fill={accentColor} opacity={0.3}
                  style={{ animation: `twinkle-glow-${s.gC} ${s.dur}s ease-in-out ${s.del}s infinite` }}
                />
                {/* Mid glow */}
                <circle cx={`${s.cx}%`} cy={`${s.cy}%`} r={3.5} fill="white" opacity={0.4}
                  style={{ animation: `twinkle-glow-${s.gC} ${s.dur}s ease-in-out ${s.del}s infinite` }}
                />
                {/* Bright core */}
                <circle cx={`${s.cx}%`} cy={`${s.cy}%`} r={2} fill="white" opacity={0.9}
                  style={{ animation: `twinkle-core-${s.cC} ${s.dur}s ease-in-out ${s.del}s infinite` }}
                />
                {/* Color accent */}
                <circle cx={`${s.cx}%`} cy={`${s.cy}%`} r={1.2} fill={accentColor} opacity={0.85}
                  style={{ animation: `twinkle-core-${s.cC} ${s.dur * 1.4}s ease-in-out ${s.del + 0.15}s infinite` }}
                />
              </g>
            );
          })}
          {/* Constellation connector lines (style-based to avoid hydration) */}
          <g style={{ animation: "constellation-pulse 8s ease-in-out infinite" }}>
            <line x1="10%" y1="30%" x2="30%" y2="15%" stroke="#6B3DF5" strokeWidth="0.7" />
            <line x1="30%" y1="15%" x2="55%" y2="10%" stroke="#4F7DF3" strokeWidth="0.7" />
            <line x1="60%" y1="35%" x2="80%" y2="20%" stroke="#EC4899" strokeWidth="0.7" />
            <line x1="45%" y1="70%" x2="75%" y2="65%" stroke="#62C5EB" strokeWidth="0.7" />
            <line x1="20%" y1="45%" x2="45%" y2="70%" stroke="#6B3DF5" strokeWidth="0.6" />
            <line x1="55%" y1="10%" x2="80%" y2="20%" stroke="#4F7DF3" strokeWidth="0.6" />
          </g>
          {/* Cosmic dust particles (CSS class) */}
          {Array.from({ length: 12 }, (_, i) => {
            const x = 5 + (i * 8.1) % 90;
            const y = 10 + (i * 7.3) % 80;
            const colors = ["#EC4899", "#6B3DF5", "#4F7DF3", "#62C5EB"];
            const dur = 7 + (i % 5);
            return (
              <g key={`dust-${i}`}>
                <circle cx={`${x}%`} cy={`${y}%`} r={4} fill={colors[i % 4]} opacity={0.6}
                  style={{ animation: `dust-glow ${dur}s ease-in-out ${i * 1.5}s infinite` }}
                />
                <circle cx={`${x}%`} cy={`${y}%`} r={1.5} fill="white" opacity={0.9}
                  style={{ animation: `dust-core ${dur}s ease-in-out ${i * 1.5}s infinite` }}
                />
              </g>
            );
          })}
        </svg>

        {/* Layer 6 — Shooting stars (purple/pink/gold tinted) */}
        <motion.div
          style={{ position: "absolute", top: "12%", left: "-5%", width: "150px", height: "2px", borderRadius: "2px", transform: "rotate(15deg)", transformOrigin: "left center", background: "linear-gradient(90deg, transparent, rgba(107,61,245,0.9), rgba(255,255,255,0.75))" }}
          animate={{ x: [0, 900], y: [0, 220], opacity: [0, 1, 0] }}
          transition={{ duration: 1.3, repeat: Infinity, repeatDelay: 11, ease: "easeOut" }}
        />
        <motion.div
          style={{ position: "absolute", top: "42%", left: "-5%", width: "90px", height: "2px", borderRadius: "2px", transform: "rotate(12deg)", transformOrigin: "left center", background: "linear-gradient(90deg, transparent, rgba(79,125,243,0.8), rgba(230,199,95,0.45))" }}
          animate={{ x: [0, 700], y: [0, 165], opacity: [0, 1, 0] }}
          transition={{ duration: 1.1, repeat: Infinity, repeatDelay: 18, ease: "easeOut", delay: 6 }}
        />
        <motion.div
          style={{ position: "absolute", top: "6%", left: "32%", width: "110px", height: "1px", borderRadius: "2px", transform: "rotate(8deg)", transformOrigin: "left center", background: "linear-gradient(90deg, transparent, rgba(236,72,153,0.75), rgba(255,255,255,0.55))" }}
          animate={{ x: [0, 550], y: [0, 130], opacity: [0, 0.85, 0] }}
          transition={{ duration: 1.0, repeat: Infinity, repeatDelay: 25, ease: "easeOut", delay: 14 }}
        />
        <motion.div
          style={{ position: "absolute", top: "70%", left: "-5%", width: "70px", height: "2px", borderRadius: "2px", transform: "rotate(20deg)", transformOrigin: "left center", background: "linear-gradient(90deg, transparent, rgba(98,197,235,0.7), rgba(255,255,255,0.4))" }}
          animate={{ x: [0, 480], y: [0, 110], opacity: [0, 0.7, 0] }}
          transition={{ duration: 0.9, repeat: Infinity, repeatDelay: 33, ease: "easeOut", delay: 20 }}
        />

        {/* Layer 7 — Depth vignette overlay */}
        <div style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(ellipse at 50% 50%, transparent 30%, rgba(4,4,12,0.35) 70%, rgba(4,4,12,0.70) 100%)",
        }} />

        {/* Layer 8 — Subtle grid (parallax-ready, very faint) */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "linear-gradient(rgba(255,255,255,0.009) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.009) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }} />

        {/* Layer 9 — Foreground dark gradient for text readability */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(135deg, rgba(12,12,20,0.92) 0%, rgba(12,12,20,0.60) 38%, rgba(12,12,20,0.35) 100%)",
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

          {/* Headline — single massive gradient line */}
          <h1
            style={{
              fontFamily: DS.heading, letterSpacing: "0.04em",
              lineHeight: 1.05, marginBottom: "1.25rem",
            }}
          >
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              style={{ display: "block", fontSize: "clamp(2.5rem, 6vw, 4.5rem)", fontWeight: 900 }}
            >
              <span
                style={{
                  background: `linear-gradient(135deg, #FFFFFF 0%, #E2E8F0 30%, ${DS.pink} 65%, ${DS.cosmicPurple} 100%)`,
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                {t("heroTitle1")}
              </span>
            </motion.span>
          </h1>

          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}
            style={{ color: DS.text3, fontSize: "1rem", lineHeight: 1.8, marginBottom: "2rem", maxWidth: 520 }}
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
                gap: "0.625rem", boxShadow: "0 0 40px rgba(107,61,245,0.5), 0 8px 24px rgba(0,0,0,0.3)",
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
              border: "1px solid rgba(79,125,243,0.3)",
              boxShadow: "0 0 100px rgba(107,61,245,0.18), 0 40px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05) inset",
            }}
          >
            {/* Banner — full video */}
            <div style={{ position: "relative", aspectRatio: "16/9", overflow: "hidden" }}>
              <video
                src="/assets/design-company/welcome-logo-animate_2.mp4"
                autoPlay
                muted
                loop
                playsInline
                style={{
                  width: "100%", height: "100%", objectFit: "cover",
                  objectPosition: "center",
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

          </div>

          {/* Floating LP badge */}
          <motion.div
            style={{
              position: "absolute", top: "-1rem", right: "-0.75rem",
              padding: "0.625rem 0.875rem", borderRadius: "1rem",
              background: "rgba(12,12,20,0.60)", border: "1px solid rgba(107,61,245,0.45)",
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
              background: "rgba(12,12,20,0.60)", border: "1px solid rgba(230,199,95,0.25)",
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
                background: `linear-gradient(135deg, #FFFFFF 0%, ${DS.pink} 60%, ${DS.pinkLight} 100%)`,
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
                gap: "0.5rem", boxShadow: "0 0 20px rgba(107,61,245,0.3)",
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
                  background: "rgba(79,125,243,0.08)", border: "1px solid rgba(79,125,243,0.2)",
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

// ── CASE STUDIES SECTION (fetched inline) ────────────────────────────────────
function CaseStudiesSectionWrapper({ locale }: { locale: string }) {
  const { data } = useQuery({
    queryKey: ["landing-case-studies", locale],
    queryFn: async () => {
      const baseUrl = typeof window !== "undefined" ? window.location.origin : process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.loops.vn";
      const res = await fetch(`${baseUrl}/api/v1/case-studies?lang=${locale}&limit=3`, {
        next: { revalidate: 300 },
      });
      if (!res.ok) return [];
      const json = await res.json();
      return Array.isArray(json.data) ? json.data : [];
    },
    staleTime: 5 * 60 * 1000,
  });
  const projects = Array.isArray(data) ? data : [];
  if (!projects.length) return null;
  return <CaseStudiesSection projects={projects} locale={locale} />;
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
          background: "radial-gradient(ellipse at 50% 50%, rgba(79,125,243,0.15) 0%, transparent 70%)",
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
              gap: "0.625rem", boxShadow: "0 0 40px rgba(107,61,245,0.5)",
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
    // Tell FloatingSocialButtons to re-appear without requiring F5
    window.dispatchEvent(new Event("loop_onboarding_done"));
  }, []);

  return (
    <>
      <main style={{ background: DS.bg, color: DS.text, minHeight: "100vh" }}>
        <HeroSection locale={locale} />
        <MarqueeSection />
        <StatsSection />
        <ServicesSection locale={locale} />
        <CaseStudiesSectionWrapper locale={locale} />
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
