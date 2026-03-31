"use client";

/**
 * [locale] Home Page — LOOP Solutions
 * Fully migrated from Figma OLD FE LandingPage.tsx
 * Dark gamified theme, wired to real APIs.
 */

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { motion } from "motion/react";
import {
  Zap, Shield, ChevronRight,
  ArrowRight, TrendingUp, Users, Award, Sparkles,
  Heart, Eye, Layers,
  Clock, Rocket,
} from "lucide-react";
import { DS, GRD } from "@/lib/design-tokens";
import ServicesSection from "@/components/landing/ServicesSectionClient";

// ── Shared sub-components ───────────────────────────────────────────────────────

/** Animated counter using motion values */
function AnimatedCounter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const mv = useRef<number>(0);
  const [display, setDisplay] = useState("0");

  useEffect(() => {
    let start: number | null = null;
    const duration = 1400;
    const animate = (ts: number) => {
      if (!start) start = ts;
      const pct = Math.min((ts - start) / duration, 1);
      const ease = 1 - Math.pow(1 - pct, 3);
      mv.current = to * ease;
      setDisplay(Math.floor(mv.current).toLocaleString("vi-VN"));
      if (pct < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [to]);

  return (
    <span ref={ref}>
      {display}
      {suffix}
    </span>
  );
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
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: color,
          boxShadow: `0 0 6px ${color}`,
        }}
      />
      <span
        style={{
          color,
          fontSize: "0.625rem",
          fontFamily: "'JetBrains Mono', monospace",
          letterSpacing: "0.22em",
        }}
      >
        {label}
      </span>
    </div>
  );
}

// ── HERO SECTION ─────────────────────────────────────────────────────────────

function HeroSection({ locale, t }: { locale: string; t: ReturnType<typeof useTranslations<"HomePage">> }) {
  const [activeMetric, setActiveMetric] = useState(0);
  const metrics = [
    { label: t("heroMetricProjects"), value: "120+", color: DS.blue },
    { label: t("heroMetricClients"), value: "98%", color: DS.green },
    { label: t("heroMetricYears"), value: "7+", color: DS.purple },
    { label: t("heroMetricPartners"), value: "50+", color: DS.cyan },
  ];

  useEffect(() => {
    const timer = setInterval(() => setActiveMetric((p) => (p + 1) % metrics.length), 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section
      style={{
        position: "relative",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        paddingTop: "7rem",
        paddingBottom: "5rem",
        paddingLeft: "1.5rem",
        paddingRight: "1.5rem",
        overflow: "hidden",
      }}
    >
      {/* Background gradient orbs */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <motion.div
          style={{
            position: "absolute",
            top: "-15%",
            left: "-5%",
            width: "55%",
            height: "55%",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(29,78,216,0.12) 0%, transparent 70%)",
          }}
          animate={{ x: [0, 40, 0], y: [0, -20, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          style={{
            position: "absolute",
            top: "40%",
            right: "-10%",
            width: "50%",
            height: "50%",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(129,140,248,0.09) 0%, transparent 70%)",
          }}
          animate={{ x: [0, -30, 0], y: [0, 30, 0] }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut", delay: 3 }}
        />
        {/* Grid overlay */}
        <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.025 }}>
          <defs>
            <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke={DS.blue} strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div
        style={{
          maxWidth: "80rem",
          margin: "0 auto",
          width: "100%",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "4rem",
          alignItems: "center",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* LEFT: Text */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Badge label="DIGITAL AGENCY OPERATING SYSTEM — v3.0" />
          </motion.div>

          {/* Headline */}
          <h1
            style={{
              fontFamily: "'Cinzel', serif",
              letterSpacing: "0.04em",
              lineHeight: 1.1,
              marginBottom: "1.5rem",
            }}
          >
            {[t("heroTitle1"), t("heroTitle2")].map((text, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                style={{
                  display: "block",
                  fontSize: "clamp(2.25rem, 5vw, 4rem)",
                  fontWeight: 900,
                  WebkitTextStroke: "0px",
                }}
              >
                <span
                  style={{
                    background: i === 0
                      ? "linear-gradient(135deg, #FFFFFF 0%, #CBD5E1 100%)"
                      : GRD.primary,
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  {text}
                </span>
              </motion.span>
            ))}
          </h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            style={{
              color: DS.text3,
              fontSize: "1.0625rem",
              lineHeight: 1.8,
              marginBottom: "2.25rem",
              maxWidth: 520,
            }}
          >
            t("heroDesc")
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            style={{ display: "flex", flexWrap: "wrap", gap: "1rem", marginBottom: "3rem" }}
          >
            <Link
              href={`/${locale}/booking`}
              style={{
                background: GRD.primary,
                color: "#fff",
                fontSize: "0.9375rem",
                fontWeight: 700,
                padding: "0.875rem 2rem",
                borderRadius: "0.875rem",
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: "0.625rem",
                boxShadow: "0 0 40px rgba(129,140,248,0.5), 0 8px 24px rgba(0,0,0,0.3)",
                letterSpacing: "0.02em",
              }}
            >
              <Rocket size={17} />
              {t("ctaPrimary")}
            </Link>
            <Link
              href={`/${locale}/portfolio`}
              style={{
                color: DS.text2,
                fontSize: "0.9375rem",
                fontWeight: 500,
                padding: "0.875rem 2rem",
                borderRadius: "0.875rem",
                border: "1px solid rgba(255,255,255,0.12)",
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: "0.625rem",
                background: "rgba(255,255,255,0.04)",
                backdropFilter: "blur(12px)",
              }}
            >
              <Eye size={16} />
              {t("btnPortfolio")}
            </Link>
          </motion.div>

          {/* Rotating metrics */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            style={{ display: "flex", flexWrap: "wrap", gap: "2rem" }}
          >
            {metrics.map((m, i) => (
              <div
                key={m.label}
                style={{ opacity: i === activeMetric ? 1 : 0.35, transition: "opacity 0.4s ease" }}
              >
                <div
                  style={{
                    color: m.color,
                    fontFamily: "'Cinzel', serif",
                    fontSize: "1.5rem",
                    fontWeight: 900,
                    textShadow: `0 0 16px ${m.color}60`,
                  }}
                >
                  {m.value}
                </div>
                <div
                  style={{
                    color: DS.text5,
                    fontSize: "0.6875rem",
                    fontFamily: "'JetBrains Mono', monospace",
                    letterSpacing: "0.1em",
                    marginTop: "0.125rem",
                  }}
                >
                  {m.label}
                </div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* RIGHT: Platform mockup */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
          style={{ position: "relative" }}
        >
          <div
            style={{
              borderRadius: "1.5rem",
              overflow: "hidden",
              border: "1px solid rgba(59,130,246,0.2)",
              boxShadow: "0 0 80px rgba(59,130,246,0.12), 0 40px 80px rgba(0,0,0,0.6)",
              background: "#0A1628",
            }}
          >
            {/* Top bar */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.875rem 1.25rem",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
                background: "rgba(15,23,42,0.8)",
              }}
            >
              {["#EF4444", "#F59E0B", "#22C55E"].map((c) => (
                <div key={c} style={{ width: 12, height: 12, borderRadius: "50%", background: c }} />
              ))}
              <div
                style={{
                  flex: 1,
                  marginLeft: "1rem",
                  height: 24,
                  borderRadius: 6,
                  padding: "0 0.75rem",
                  display: "flex",
                  alignItems: "center",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <span
                  style={{
                    color: DS.text5,
                    fontSize: "0.6875rem",
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  loop.solutions/dashboard
                </span>
              </div>
              <span style={{ color: DS.green, fontSize: "0.625rem", fontFamily: "'JetBrains Mono', monospace", display: "flex", alignItems: "center", gap: 4 }}>
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: DS.green,
                    boxShadow: `0 0 6px ${DS.green}`,
                  }}
                />
                LIVE
              </span>
            </div>

            {/* Dashboard content */}
            <div style={{ padding: "1.25rem", background: "linear-gradient(160deg, #0A1628 0%, #060D1A 100%)" }}>
              {/* Stats row */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem", marginBottom: "1rem" }}>
                {[
                  { label: t("dashboardProjects"), value: "24", color: DS.blue, icon: <Layers size={13} /> },
                  { label: t("dashboardRevenue"), value: "2.4B", color: DS.green, icon: <TrendingUp size={13} /> },
                  { label: t("dashboardLP"), value: "820K", color: DS.purple, icon: <Zap size={13} /> },
                ].map((s) => (
                  <div
                    key={s.label}
                    style={{
                      borderRadius: "0.75rem",
                      padding: "0.75rem",
                      background: "rgba(255,255,255,0.04)",
                      border: `1px solid ${s.color}20`,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                      <span style={{ color: s.color, opacity: 0.7 }}>{s.icon}</span>
                      <span style={{ color: DS.text5, fontSize: "0.5625rem", fontFamily: "'JetBrains Mono', monospace" }}>{s.label}</span>
                    </div>
                    <div style={{ color: s.color, fontFamily: "'Cinzel', serif", fontSize: "1.125rem", fontWeight: 700 }}>{s.value}</div>
                  </div>
                ))}
              </div>

              {/* Chart area */}
              <div
                style={{
                  borderRadius: "0.75rem",
                  padding: "1rem",
                  marginBottom: "1rem",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(59,130,246,0.1)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
                  <span style={{ color: DS.text3, fontSize: "0.75rem", fontFamily: "'JetBrains Mono', monospace" }}>{t("dashboardChartLabel")}</span>
                  <span style={{ color: DS.green, fontSize: "0.6875rem", fontFamily: "'JetBrains Mono', monospace" }}>+28.4% ↑</span>
                </div>
                <svg width="100%" height="70" viewBox="0 0 300 70">
                  <defs>
                    <linearGradient id="chart-grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d="M0,55 C30,45 60,60 90,40 C120,20 150,30 180,15 C210,5 240,20 270,10 L270,70 L0,70 Z" fill="url(#chart-grad)" />
                  <path d="M0,55 C30,45 60,60 90,40 C120,20 150,30 180,15 C210,5 240,20 270,10" fill="none" stroke="#3B82F6" strokeWidth="2" />
                  {[{ x: 0, y: 55 }, { x: 90, y: 40 }, { x: 180, y: 15 }, { x: 270, y: 10 }].map((p, i) => (
                    <circle key={i} cx={p.x} cy={p.y} r="3" fill="#3B82F6" />
                  ))}
                </svg>
              </div>

              {/* Project list */}
              {[
                { name: "VNRetail Platform", status: t("statusInProgress"), prog: 72, color: DS.blue },
                { name: "MedApp v3.0", status: t("statusReview"), prog: 91, color: DS.amber },
                { name: "FinDash Enterprise", status: t("statusCompleted"), prog: 100, color: DS.green },
              ].map((p) => (
                <div key={p.name} style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.625rem" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                      <span style={{ color: DS.text2, fontSize: "0.6875rem" }}>{p.name}</span>
                      <span style={{ color: p.color, fontSize: "0.625rem", fontFamily: "'JetBrains Mono', monospace" }}>{p.prog}%</span>
                    </div>
                    <div style={{ width: "100%", height: 6, borderRadius: 3, background: "rgba(255,255,255,0.06)" }}>
                      <div
                        style={{
                          height: 6,
                          borderRadius: 3,
                          width: `${p.prog}%`,
                          background: p.color,
                          boxShadow: `0 0 6px ${p.color}`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Floating LP badge */}
          <motion.div
            style={{
              position: "absolute",
              top: "-1.5rem",
              right: "-1rem",
              padding: "0.75rem 1rem",
              borderRadius: "1.25rem",
              background: "rgba(15,23,42,0.96)",
              border: "1px solid rgba(129,140,248,0.35)",
              backdropFilter: "blur(20px)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.5), 0 0 20px rgba(129,140,248,0.15)",
            }}
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <div style={{ color: DS.text5, fontSize: "0.5625rem", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.15em", marginBottom: "0.25rem" }}>{t("lpBadge")}</div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Zap size={14} style={{ color: DS.purple }} />
              <span style={{ color: DS.purple, fontFamily: "'Cinzel', serif", fontSize: "1.125rem", fontWeight: 700, textShadow: "0 0 12px rgba(129,140,248,0.7)" }}>+2,450 LP</span>
            </div>
          </motion.div>

          {/* Floating rank card */}
          <motion.div
            style={{
              position: "absolute",
              bottom: "-1.25rem",
              left: "-1rem",
              padding: "0.75rem 1rem",
              borderRadius: "1.25rem",
              background: "rgba(15,23,42,0.96)",
              border: "1px solid rgba(255,215,0,0.25)",
              backdropFilter: "blur(20px)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
            }}
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          >
            <div style={{ color: DS.text5, fontSize: "0.5625rem", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.15em", marginBottom: "0.25rem" }}>RANK PROGRESSION</div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ color: "#FFD700", fontSize: "1rem" }}>★</span>
              <span style={{ color: "#FFD700", fontFamily: "'Cinzel', serif", fontSize: "0.875rem", fontWeight: 700 }}>GOLD</span>
              <span style={{ color: DS.text5, fontSize: "0.625rem", fontFamily: "'JetBrains Mono', monospace" }}>Lv.12</span>
              <ArrowRight size={12} style={{ color: DS.text5 }} />
              <span style={{ color: DS.cyan, fontFamily: "'Cinzel', serif", fontSize: "0.875rem", fontWeight: 700 }}>PLATINUM</span>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        style={{
          position: "absolute",
          bottom: "2rem",
          left: "50%",
          transform: "translateX(-50%)",
        }}
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div
          style={{
            width: 24,
            height: 40,
            border: "2px solid rgba(255,255,255,0.15)",
            borderRadius: 12,
            display: "flex",
            justifyContent: "center",
            paddingTop: "0.25rem",
          }}
        >
          <div style={{ width: 3, height: 10, background: DS.blue, borderRadius: 2 }} />
        </div>
      </motion.div>
    </section>
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
        borderTop: `1px solid ${DS.border}`,
        borderBottom: `1px solid ${DS.border}`,
        overflow: "hidden",
        padding: "0.875rem 0",
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
              fontSize: "0.75rem",
              fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: "0.15em",
              flexShrink: 0,
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

function StatsSection({ projectCount = 120, t }: { projectCount?: number; t: ReturnType<typeof useTranslations<"HomePage">> }) {
  const stats = [
    { value: projectCount, suffix: "+", label: t("statsProjects"), icon: <Rocket size={22} />, color: DS.blue },
    { value: 98, suffix: "%", label: t("statsSatisfaction"), icon: <Heart size={22} />, color: DS.green },
    { value: 7, suffix: "+", label: t("statsYears"), icon: <Award size={22} />, color: DS.amber },
    { value: 50, suffix: "+", label: t("statsPartners"), icon: <Users size={22} />, color: DS.purple },
    { value: 24, suffix: "/7", label: t("statsSupport"), icon: <Clock size={22} />, color: DS.cyan },
    { value: 99.9, suffix: "%", label: t("statsUptime"), icon: <Shield size={22} />, color: DS.red },
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
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
            gap: "1.25rem",
          }}
        >
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              style={{
                textAlign: "center",
                padding: "1.25rem",
                borderRadius: "1.25rem",
                background: "rgba(15,23,42,0.6)",
                border: `1px solid ${DS.border}`,
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
                  width: 44,
                  height: 44,
                  borderRadius: "0.75rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 0.75rem",
                  background: `${s.color}15`,
                  border: `1px solid ${s.color}25`,
                }}
              >
                <span style={{ color: s.color }}>{s.icon}</span>
              </div>
              <div
                style={{
                  color: s.color,
                  fontFamily: "'Cinzel', serif",
                  fontSize: "1.625rem",
                  fontWeight: 900,
                  textShadow: `0 0 16px ${s.color}50`,
                }}
              >
                <AnimatedCounter to={s.value} suffix={s.suffix} />
              </div>
              <div
                style={{
                  color: DS.text4,
                  fontSize: "0.6875rem",
                  marginTop: "0.25rem",
                  lineHeight: 1.4,
                }}
              >
                {s.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── SERVICES SECTION ──────────────────────────────────────────────────────────
// ServicesSection is imported from @/components/landing/ServicesSectionClient
// (includes its own QueryProvider wrapper)

// ── LP SYSTEM SECTION ─────────────────────────────────────────────────────────

function LPSystemSection({ locale, t }: { locale: string; t: ReturnType<typeof useTranslations<"HomePage">> }) {
  const rankFlow = [
    { rank: "IRON", color: "#9CA3AF", symbol: "⬡", desc: t("rankFlowStart") },
    { rank: "BRONZE", color: "#CD7F32", symbol: "◈", desc: t("rankFlowPlus", { count: "350" }) },
    { rank: "SILVER", color: "#CBD5E1", symbol: "◇", desc: t("rankFlowPlus", { count: "800" }) },
    { rank: "GOLD", color: "#FFD700", symbol: "★", desc: t("rankFlowPlus", { count: "2K" }) },
    { rank: "PLATINUM", color: "#14B8A6", symbol: "❋", desc: t("rankFlowPlus", { count: "5K" }) },
    { rank: "RUBY", color: "#EF4444", symbol: "♦", desc: t("rankFlowPlus", { count: "12K" }) },
    { rank: "DIAMOND", color: "#818CF8", symbol: "✦", desc: t("rankFlowPlus", { count: "30K" }) },
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
                fontFamily: "'Cinzel', serif",
                fontSize: "clamp(1.5rem, 3.5vw, 2.5rem)",
                fontWeight: 900,
                letterSpacing: "0.05em",
                background: "linear-gradient(135deg, #FFFFFF, #94A3B8)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                marginBottom: "1rem",
              }}
            >
              {t("lpSectionTitle")}
            </h2>
            <p style={{ color: DS.text3, fontSize: "0.9375rem", lineHeight: 1.8, marginBottom: "1.5rem" }}>
              {t("lpSectionDesc")}
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "2rem" }}>
              {[
                { icon: <Zap size={15} />, text: t("lpBenefit1"), color: DS.blue },
                { icon: <Users size={15} />, text: t("lpBenefit2"), color: DS.purple },
                { icon: <Award size={15} />, text: t("lpBenefit3"), color: DS.green },
                { icon: <Sparkles size={15} />, text: t("lpBenefit4"), color: DS.amber },
              ].map((b) => (
                <div key={b.text} style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "0.5rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      marginTop: 2,
                      background: `${b.color}15`,
                      border: `1px solid ${b.color}25`,
                    }}
                  >
                    <span style={{ color: b.color }}>{b.icon}</span>
                  </div>
                  <span style={{ color: DS.text3, fontSize: "0.875rem", lineHeight: 1.6 }}>{b.text}</span>
                </div>
              ))}
            </div>

            <Link
              href={`/${locale}/khach-hang`}
              style={{
                background: GRD.primary,
                color: "#fff",
                fontSize: "0.875rem",
                fontWeight: 600,
                padding: "0.6875rem 1.5rem",
                borderRadius: "0.625rem",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                boxShadow: "0 0 20px rgba(129,140,248,0.3)",
              }}
            >
              {t("ctaPrimary")} <ArrowRight size={15} />
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
                borderRadius: "1rem",
                padding: "1.75rem",
                background: "rgba(15,23,42,0.7)",
                border: `1px solid ${DS.border}`,
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
                      display: "flex",
                      alignItems: "center",
                      gap: "1rem",
                      padding: "0.75rem",
                      borderRadius: "0.75rem",
                      background: i === 3 ? `${r.color}12` : "rgba(255,255,255,0.03)",
                      border: `1px solid ${i === 3 ? `${r.color}30` : "transparent"}`,
                    }}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.07 }}
                  >
                    <span
                      style={{
                        color: r.color,
                        fontSize: "1.375rem",
                        textShadow: `0 0 10px ${r.color}50`,
                        width: 28,
                        textAlign: "center",
                        flexShrink: 0,
                      }}
                    >
                      {r.symbol}
                    </span>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: r.color, fontSize: "0.6875rem", fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, letterSpacing: "0.12em" }}>{r.rank}</div>
                      <div style={{ color: DS.text5, fontSize: "0.625rem", fontFamily: "'JetBrains Mono', monospace" }}>{t("rankBoardNeed", { desc: r.desc })}</div>
                    </div>
                    {i === 3 && (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.375rem",
                          padding: "0.25rem 0.625rem",
                          borderRadius: "0.5rem",
                          background: `${r.color}20`,
                          border: `1px solid ${r.color}40`,
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
                  marginTop: "1.5rem",
                  padding: "1rem",
                  borderRadius: "0.75rem",
                  background: "rgba(59,130,246,0.08)",
                  border: "1px solid rgba(59,130,246,0.2)",
                }}
              >
                <div style={{ color: DS.text4, fontSize: "0.75rem", lineHeight: 1.6 }}>
                  💡 <strong style={{ color: DS.text3 }}>Lưu ý: </strong>{t("rankBoardNote")}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ── CTA SECTION ────────────────────────────────────────────────────────────────

function CTASection({ locale, t }: { locale: string; t: ReturnType<typeof useTranslations<"HomePage">> }) {
  return (
    <section
      style={{
        padding: "6rem 1.5rem",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(ellipse at 50% 50%, rgba(29,78,216,0.15) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          maxWidth: "48rem",
          margin: "0 auto",
          textAlign: "center",
          position: "relative",
        }}
      >
        <Badge label={t("ctaBadge")} color={DS.cyan} />
        <h2
          style={{
            fontFamily: "'Cinzel', serif",
            fontSize: "clamp(1.5rem, 3.5vw, 2.5rem)",
            fontWeight: 900,
            letterSpacing: "0.04em",
            color: DS.text,
            marginBottom: "1rem",
          }}
        >
          {t("ctaTitle")}
        </h2>
        <p style={{ color: DS.text3, fontSize: "1rem", lineHeight: 1.8, marginBottom: "2rem" }}>
          {t("ctaDesc")}
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", justifyContent: "center" }}>
          <Link
            href={`/${locale}/booking`}
            style={{
              background: GRD.primary,
              color: "#fff",
              fontSize: "1rem",
              fontWeight: 700,
              padding: "1rem 2rem",
              borderRadius: "0.875rem",
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: "0.625rem",
              boxShadow: "0 0 40px rgba(129,140,248,0.5)",
            }}
          >
            <Rocket size={18} />
            {t("ctaPrimary")}
          </Link>
          <Link
            href={`/${locale}/contact`}
            style={{
              color: DS.text2,
              fontSize: "1rem",
              fontWeight: 500,
              padding: "1rem 2rem",
              borderRadius: "0.875rem",
              border: `1px solid ${DS.border2}`,
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: "0.625rem",
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

// ── MAIN PAGE ────────────────────────────────────────────────────────────────

type PageProps = { params: Promise<{ locale: string }> };

export default function HomePage({ params }: PageProps) {
  // Unwrap params
  const [locale, setLocale] = useState("vi");
  useEffect(() => {
    params.then((p) => setLocale(p.locale));
  }, [params]);

  const t = useTranslations("HomePage");

  return (
    <main style={{ background: DS.bg, color: DS.text, minHeight: "100vh" }}>
      <HeroSection locale={locale} t={t} />
      <MarqueeSection />
      <StatsSection t={t} />
      <ServicesSection locale={locale} />
      <LPSystemSection locale={locale} t={t} />
      <CTASection locale={locale} t={t} />
    </main>
  );
}
