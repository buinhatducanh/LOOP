"use client";

/**
 * ServicesClient — Figma dark Services page.
 * Receives localized data (webPackages, customServices, ui labels) from server.
 */

import { useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  ArrowRight, Rocket, Star, MousePointer,
  ChevronRight, ChevronDown, ChevronUp, CheckCircle2, Sparkles,
  Zap as ZapAlt, Clock as ClockAlt,
} from "lucide-react";
import { DS, GRD } from "@/lib/design-tokens";
import type { ServicesPackage } from "@/app/data/locales/services-vi";

const fmtVND = (n: number | null | undefined, fallbackLabel = "—") =>
  n == null ? fallbackLabel : new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(n);

const fmtLP = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1_000 ? `${(n / 1_000).toFixed(0)}K` : String(n);

const CAT_ICONS: Record<string, string> = {
  "an-uong": "🍜",
  "suc-khoe": "💆",
  "luu-tru": "🏨",
  "bat-dong-san": "🏠",
  "khac": "📦",
};


function hexRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: 6,
        fontSize: "0.5625rem",
        fontFamily: "'JetBrains Mono', monospace",
        fontWeight: 700,
        letterSpacing: "0.1em",
        background: hexRgba(color, 0.12),
        border: `1px solid ${hexRgba(color, 0.3)}`,
        color,
      }}
    >
      {label}
    </span>
  );
}

function ProcessStep({
  n, title, desc, color,
}: { n: string; title: string; desc: string; color: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      style={{
        padding: "1.25rem",
        borderRadius: 12,
        background: "rgba(15,23,42,0.6)",
        border: `1px solid ${DS.border}`,
        backdropFilter: "blur(12px)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          fontSize: "4rem",
          fontFamily: "'Cinzel', serif",
          fontWeight: 900,
          color: hexRgba(color, 0.06),
          lineHeight: 1,
          userSelect: "none",
        }}
      >
        {n}
      </div>
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: hexRgba(color, 0.12),
          border: `1px solid ${hexRgba(color, 0.25)}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "0.875rem",
        }}
      >
        <ClockAlt size={16} style={{ color }} />
      </div>
      <div
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "0.5625rem",
          color,
          letterSpacing: "0.15em",
          marginBottom: "0.375rem",
          textTransform: "uppercase",
        }}
      >
        Step {n}
      </div>
      <div style={{ color: DS.text, fontSize: "0.9375rem", fontWeight: 600, marginBottom: "0.5rem" }}>{title}</div>
      <div style={{ color: DS.text4, fontSize: "0.8125rem", lineHeight: 1.6 }}>{desc}</div>
    </motion.div>
  );
}

function PackageCard({
  pkg,
  locale,
  labels,
}: {
  pkg: ServicesPackage;
  locale: string;
  labels: {
    pkgPrice: string;
    pkgOrTrial: string;
    pkgFeatures: string;
    pkgMoreFeatures: string;
    pkgCollapse: string;
    pkgLpReward: string;
    pkgTrialCta: string;
    liênHệ: string;
  };
}) {
  const [expanded, setExpanded] = useState(false);
  const grad = `linear-gradient(135deg, ${pkg.gradFrom}, ${pkg.gradTo})`;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      style={{
        borderRadius: 16,
        background: "rgba(15,23,42,0.7)",
        border: `1px solid ${DS.border}`,
        backdropFilter: "blur(16px)",
        overflow: "hidden",
        cursor: "pointer",
      }}
      whileHover={{ y: -4, transition: { duration: 0.2 }}}
    >
      {/* Header gradient banner */}
      <div
        style={{
          background: grad,
          padding: "1.5rem",
          position: "relative",
        }}
      >
        {pkg.badge && (
          <div style={{ position: "absolute", top: 12, right: 12 }}>
            <Badge label={pkg.badge} color={pkg.badgeColor} />
          </div>
        )}
        <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>{pkg.icon}</div>
        <div
          style={{
            fontFamily: "'Cinzel', serif",
            fontSize: "1.125rem",
            fontWeight: 700,
            color: "#fff",
            letterSpacing: "0.03em",
          }}
        >
          {pkg.industry}
        </div>
        <div style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.8125rem", marginTop: "0.25rem" }}>
          {pkg.tagline}
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: "1.25rem" }}>
        {/* Pricing */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <div>
            <div style={{ color: DS.text4, fontSize: "0.625rem", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.1em", marginBottom: 2 }}>{labels.pkgPrice}</div>
            <div style={{ color: pkg.color, fontSize: "1.25rem", fontWeight: 800, fontFamily: "'Cinzel', serif" }}>
              {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(pkg.fullPrice)}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ color: DS.text4, fontSize: "0.625rem", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.1em", marginBottom: 2 }}>{labels.pkgOrTrial}</div>
            <div style={{ color: pkg.color, fontSize: "1rem", fontWeight: 600 }}>
              {pkg.trialPrice === 0 ? labels.liênHệ : fmtVND(pkg.trialPrice, labels.liênHệ)}
            </div>
          </div>
        </div>

        {/* CTA */}
        <Link
          href={`/${locale}/contact`}
          style={{
            display: "block",
            textAlign: "center",
            padding: "0.5rem",
            borderRadius: 8,
            background: hexRgba(pkg.color, 0.1),
            border: `1px solid ${hexRgba(pkg.color, 0.25)}`,
            color: pkg.color,
            fontSize: "0.8125rem",
            fontWeight: 600,
            textDecoration: "none",
            marginBottom: "0.875rem",
            transition: "background 0.15s ease",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = hexRgba(pkg.color, 0.18); }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = hexRgba(pkg.color, 0.1); }}
        >
          <Rocket size={13} style={{ display: "inline", marginRight: 4 }} />
          {labels.pkgTrialCta
            .replace("{days}", String(pkg.trialDays))
            .replace("{time}", pkg.activateTime)}
        </Link>

        <div style={{ borderTop: `1px solid ${DS.border}`, margin: "0.875rem 0" }} />

        {/* Features */}
        <div style={{ marginBottom: "0.875rem" }}>
          <div style={{ color: DS.text4, fontSize: "0.625rem", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.15em", marginBottom: "0.5rem" }}>{labels.pkgFeatures}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
            {pkg.features.slice(0, expanded ? undefined : 5).map((f) => (
              <div key={f} style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", fontSize: "0.8125rem", color: DS.text3 }}>
                <CheckCircle2 size={12} style={{ color: pkg.color, flexShrink: 0, marginTop: 2 }} />
                <span>{f}</span>
              </div>
            ))}
          </div>
          {pkg.features.length > 5 && (
            <button
              onClick={() => setExpanded(!expanded)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                background: "none",
                border: "none",
                color: pkg.color,
                fontSize: "0.75rem",
                cursor: "pointer",
                padding: "0.25rem 0",
                marginTop: "0.5rem",
              }}
            >
              {expanded ? labels.pkgCollapse : `+${pkg.features.length - 5} ${labels.pkgMoreFeatures}`}
              {expanded ? <ChevronUp style={{ color: pkg.color }} size={12} /> : <ChevronDown style={{ color: pkg.color }} size={12} />}
            </button>
          )}
        </div>

        {/* LP reward */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.375rem",
            padding: "0.5rem 0.75rem",
            borderRadius: 8,
            background: hexRgba(pkg.color, 0.06),
            border: `1px solid ${hexRgba(pkg.color, 0.15)}`,
          }}
        >
          <ZapAlt size={12} style={{ color: pkg.color }} />
          <span style={{ color: DS.text3, fontSize: "0.75rem" }}>
            {labels.pkgLpReward}
          </span>
          <span style={{ color: DS.purple, fontWeight: 600, fontSize: "0.8125rem", fontFamily: "'JetBrains Mono', monospace" }}>
            +{fmtLP(pkg.lp)} LP
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

type ServicesUI = {
  heroBadge: string;
  heroTitle: string;
  heroDesc: string;
  ctaPrimary: string;
  ctaSecondary: string;
  filterAll: string;
  processLabel: string;
  processTitle: string;
  processStep1Title: string;
  processStep1Desc: string;
  processStep2Title: string;
  processStep2Desc: string;
  processStep3Title: string;
  processStep3Desc: string;
  processStep4Title: string;
  processStep4Desc: string;
  ctaReady: string;
  ctaReadyDesc: string;
  ctaReadyBtn: string;
  webPackagesLabel: string;
  customServicesLabel: string;
  customServicesDesc: string;
  pkgPrice: string;
  pkgOrTrial: string;
  pkgFeatures: string;
  pkgMoreFeatures: string;
  pkgCollapse: string;
  pkgLpReward: string;
  pkgTrialCta: string;
  emptyState: string;
  anUong: string;
  sucKhoe: string;
  luuTru: string;
  batDongSan: string;
  khac: string;
  liênHệ: string;
};

export function ServicesClient({
  locale,
  customServices,
  webPackages,
  ui,
}: {
  locale: string;
  customServices: Record<string, unknown>[];
  webPackages: ServicesPackage[];
  ui: ServicesUI;
}) {
  const [activeCat, setActiveCat] = useState("all");
  const filtered = activeCat === "all"
    ? webPackages
    : webPackages.filter((p) => p.category === activeCat);

  const catLabels: Record<string, string> = {
    "an-uong": ui.anUong,
    "suc-khoe": ui.sucKhoe,
    "luu-tru": ui.luuTru,
    "bat-dong-san": ui.batDongSan,
    "khac": ui.khac,
  };

  const allCats = ["all", "an-uong", "suc-khoe", "luu-tru", "bat-dong-san", "khac"];

  return (
    <main style={{ background: DS.bg, minHeight: "100vh", paddingTop: 0 }}>
      {/* Hero */}
      <section
        style={{
          padding: "5rem 1.5rem 4rem",
          textAlign: "center",
          background: `linear-gradient(180deg, rgba(59,130,246,0.07) 0%, transparent 100%)`,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.375rem 1rem",
                borderRadius: 9999,
                background: "rgba(59,130,246,0.08)",
                border: "1px solid rgba(59,130,246,0.2)",
                color: DS.blue,
                fontSize: "0.6875rem",
                fontFamily: "'JetBrains Mono', monospace",
                letterSpacing: "0.18em",
                marginBottom: "1.5rem",
              }}
            >
              <Star size={10} style={{ color: DS.amber }} />
              {ui.heroBadge}
            </div>
            <h1
              style={{
                fontFamily: "'Cinzel', serif",
                fontSize: "clamp(2rem, 5vw, 3.5rem)",
                fontWeight: 900,
                letterSpacing: "0.04em",
                background: "linear-gradient(135deg, #FFFFFF 0%, #94A3B8 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                marginBottom: "1rem",
                lineHeight: 1.1,
              }}
            >
              {ui.heroTitle}
            </h1>
            <p style={{ color: DS.text3, fontSize: "1rem", lineHeight: 1.8, marginBottom: "2rem" }}>
              {ui.heroDesc}
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", justifyContent: "center" }}>
              <Link
                href={`/${locale}/contact`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.75rem 1.5rem",
                  background: GRD.primary,
                  color: "#fff",
                  borderRadius: 10,
                  fontWeight: 600,
                  fontSize: "0.9375rem",
                  textDecoration: "none",
                  boxShadow: "0 0 30px rgba(129,140,248,0.4)",
                }}
              >
                <MousePointer size={16} />
                {ui.ctaPrimary}
              </Link>
              <Link
                href={`/${locale}/portfolio`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.75rem 1.5rem",
                  color: DS.text3,
                  border: `1px solid ${DS.border}`,
                  borderRadius: 10,
                  fontSize: "0.9375rem",
                  textDecoration: "none",
                  background: "rgba(255,255,255,0.03)",
                }}
              >
                {ui.ctaSecondary}
                <ArrowRight size={16} />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Category filter */}
      <section style={{ padding: "0 1.5rem 2rem", display: "flex", justifyContent: "center", gap: "0.5rem", flexWrap: "wrap" }}>
        {allCats.map((cat) => {
          const active = cat === activeCat;
          return (
            <button
              key={cat}
              onClick={() => setActiveCat(cat)}
              style={{
                padding: "0.5rem 1.25rem",
                borderRadius: 9999,
                fontSize: "0.8125rem",
                fontWeight: active ? 700 : 400,
                cursor: "pointer",
                transition: "all 0.2s ease",
                background: active ? GRD.primary : "transparent",
                border: active ? "none" : `1px solid ${DS.border}`,
                color: active ? "#fff" : DS.text3,
                boxShadow: active ? "0 0 16px rgba(129,140,248,0.35)" : "none",
              }}
            >
              {cat === "all" ? ui.filterAll : `${CAT_ICONS[cat] ?? "📦"} ${catLabels[cat] ?? cat}`}
            </button>
          );
        })}
      </section>

      {/* WebPackages grid */}
      <section style={{ padding: "0 1.5rem 4rem", maxWidth: 1200, margin: "0 auto" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr)",
            gap: "1.25rem",
          }}
        >
          {filtered.map((pkg) => (
            <PackageCard
              key={pkg.id}
              pkg={pkg}
              locale={locale}
              labels={{
                pkgPrice: ui.pkgPrice,
                pkgOrTrial: ui.pkgOrTrial,
                pkgFeatures: ui.pkgFeatures,
                pkgMoreFeatures: ui.pkgMoreFeatures,
                pkgCollapse: ui.pkgCollapse,
                pkgLpReward: ui.pkgLpReward,
                pkgTrialCta: ui.pkgTrialCta,
                liênHệ: ui.liênHệ,
              }}
            />
          ))}
        </div>
        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "4rem", color: DS.text4 }}>
            {ui.emptyState}
          </div>
        )}
      </section>

      {/* Custom services */}
      {customServices.length > 0 && (
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto 3rem",
            padding: "0 1.5rem",
          }}
        >
          <div
            style={{
              borderTop: `1px solid ${DS.border}`,
              paddingTop: "2rem",
              marginBottom: "1.5rem",
            }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.25rem 0.75rem",
                borderRadius: 9999,
                background: "rgba(20,184,166,0.08)",
                border: "1px solid rgba(20,184,166,0.2)",
                color: DS.cyan,
                fontSize: "0.6875rem",
                fontFamily: "'JetBrains Mono', monospace",
                letterSpacing: "0.15em",
                marginBottom: "1.5rem",
              }}
            >
              <Sparkles size={10} />
              {ui.webPackagesLabel}
            </div>
            <h2
              style={{
                fontFamily: "'Cinzel', serif",
                fontSize: "clamp(1.25rem, 3vw, 2rem",
                fontWeight: 900,
                letterSpacing: "0.04em",
                color: DS.text,
                marginBottom: "0.5rem",
              }}
            >
              {ui.customServicesLabel}
            </h2>
            <p style={{ color: DS.text3, fontSize: "0.9375rem", marginBottom: "1.5rem" }}>
              {ui.customServicesDesc}
            </p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr)",
                gap: "1rem",
              }}
            >
              {customServices.map((svc: Record<string, unknown>) => (
                <Link
                  key={svc.id as string}
                  href={`/${locale}/services/${svc.slug as string}`}
                  style={{
                    padding: "1.25rem",
                    borderRadius: 12,
                    background: "rgba(15,23,42,0.7)",
                    border: `1px solid ${DS.border}`,
                    textDecoration: "none",
                    display: "block",
                    transition: "border-color 0.2s ease, transform 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.borderColor = DS.blue;
                    (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.borderColor = DS.border;
                    (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(0)";
                  }}
                >
                  <div style={{ color: DS.blue, fontSize: "0.75rem", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.1em", marginBottom: "0.5rem" }}>
                    {(svc.category as string)?.toUpperCase()}
                  </div>
                  <div style={{ color: DS.text, fontWeight: 600, fontSize: "1rem", marginBottom: "0.375rem" }}>
                    {(svc.title as string) ?? ""}
                  </div>
                  <div style={{ color: DS.text3, fontSize: "0.8125rem", marginBottom: "0.75rem", lineHeight: 1.6 }}>
                    {(svc.shortDescription as string) ?? ""}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ color: DS.green, fontWeight: 700, fontSize: "0.875rem" }}>
                      {svc.startingPrice != null ? fmtVND(svc.startingPrice as number) : ui.liênHệ}
                    </div>
                    <ArrowRight size={14} style={{ color: DS.blue }} />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Process */}
      <section
        style={{
          padding: "4rem 1.5rem",
          background: "linear-gradient(180deg, rgba(15,23,42,0.4) 0%, transparent 100%)",
        }}
      >
        <div style={{ maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.25rem 0.75rem",
              borderRadius: 9999,
              background: "rgba(139,92,246,0.08)",
              border: "1px solid rgba(139,92,246,0.2)",
              color: DS.purple,
              fontSize: "0.6875rem",
              fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: "0.18em",
              marginBottom: "1rem",
            }}
          >
            {ui.processLabel}
          </div>
          <h2
            style={{
              fontFamily: "'Cinzel', serif",
              fontSize: "clamp(1.5rem, 3vw, 2.25rem)",
              fontWeight: 900,
              letterSpacing: "0.04em",
              background: "linear-gradient(135deg, #FFFFFF 0%, #94A3B8 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              marginBottom: "3rem",
            }}
          >
            {ui.processTitle}
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr)",
              gap: "1rem",
            }}
          >
            <ProcessStep n="01" title={ui.processStep1Title} desc={ui.processStep1Desc} color={DS.blue} />
            <ProcessStep n="02" title={ui.processStep2Title} desc={ui.processStep2Desc} color={DS.purple} />
            <ProcessStep n="03" title={ui.processStep3Title} desc={ui.processStep3Desc} color={DS.cyan} />
            <ProcessStep n="04" title={ui.processStep4Title} desc={ui.processStep4Desc} color={DS.green} />
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section
        style={{
          padding: "4rem 1.5rem",
          textAlign: "center",
          background: `radial-gradient(ellipse at 50% 50%, ${hexRgba(DS.blue, 0.08)} 0%, transparent 70%)`,
        }}
      >
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <h2
            style={{
              fontFamily: "'Cinzel', serif",
              fontSize: "clamp(1.5rem, 3vw, 2rem)",
              fontWeight: 900,
              letterSpacing: "0.04em",
              color: DS.text,
              marginBottom: "1rem",
            }}
          >
            {ui.ctaReady}
          </h2>
          <p style={{ color: DS.text3, fontSize: "1rem", lineHeight: 1.7, marginBottom: "2rem" }}>
            {ui.ctaReadyDesc}
          </p>
          <Link
            href={`/${locale}/contact`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.875rem 2rem",
              background: GRD.primary,
              color: "#fff",
              borderRadius: 12,
              fontWeight: 700,
              fontSize: "1rem",
              textDecoration: "none",
              boxShadow: "0 0 40px rgba(129,140,248,0.4)",
            }}
          >
            <MousePointer size={18} />
            {ui.ctaReadyBtn}
          </Link>
        </div>
      </section>
    </main>
  );
}
