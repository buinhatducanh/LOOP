"use client";

/**
 * SiteFooter — LOOP Solutions (BE Production)
 * Redesigned cosmic dark footer.
 *
 * Features:
 *  - Cosmic CTA banner with animated ring + LP badge
 *  - Highlighted contact strip (call + zalo + email)
 *  - 5-column grid: Brand + Services + Resources + Company + Social
 *  - Newsletter signup
 *  - Bottom bar: rank dots + season badge
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { motion } from "motion/react";
import { DS, GRD } from "@/lib/design-tokens";
import { CEO_CONTACT } from "@/lib/constants";
import {
  Mail, Phone, MapPin, Clock, Zap, Rocket, Globe, Shield,
  BookOpen, Send, MessageCircle, ChevronRight,
} from "lucide-react";

const RANK_COLORS = [
  { key: "iron",    color: "#9CA3AF" },
  { key: "bronze",  color: "#CD7F32" },
  { key: "silver",  color: "#CBD5E1" },
  { key: "gold",    color: "#FFD700" },
  { key: "platinum",color: "#14B8A6" },
  { key: "ruby",    color: "#EF4444" },
  { key: "diamond", color: "#818CF8" },
];

// ── Social icon button ──────────────────────────────────────────────────────────
function SocialIconButton({
  href, label, icon, color, borderColor,
}: {
  href: string; label: string; icon: React.ReactNode;
  color: string; borderColor: string;
}) {
  return (
    <a
      href={href}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel="noopener noreferrer"
      aria-label={label}
      title={label}
      style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        width: 38, height: 38, borderRadius: 10,
        background: `${color}18`,
        border: `1px solid ${borderColor}`,
        color: color,
        textDecoration: "none",
        transition: "all 0.18s ease",
        flexShrink: 0,
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLElement;
        el.style.background = `${color}30`;
        el.style.transform = "translateY(-2px)";
        el.style.boxShadow = `0 4px 16px ${color}40`;
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLElement;
        el.style.background = `${color}18`;
        el.style.transform = "translateY(0)";
        el.style.boxShadow = "none";
      }}
    >
      {icon}
    </a>
  );
}

// ── Nav column ─────────────────────────────────────────────────────────────────
function FooterColumn({ title, icon, links }: {
  title: string; icon: React.ReactNode; links: { label: string; href: string }[];
}) {
  return (
    <div>
      <div style={{
        display: "flex", alignItems: "center", gap: "0.5rem",
        marginBottom: "1rem", color: DS.text3,
        fontSize: "0.6875rem", fontFamily: "'JetBrains Mono', monospace",
        letterSpacing: "0.18em", fontWeight: 700,
      }}>
        <span style={{ color: DS.blue }}>{icon}</span>
        {title.toUpperCase()}
      </div>
      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {links.map((link, idx) => (
          <li key={`${link.href}-${idx}`}>
            <Link
              href={link.href}
              style={{
                display: "flex", alignItems: "center", gap: "0.375rem",
                color: DS.text4, fontSize: "0.8125rem",
                textDecoration: "none", transition: "color 0.15s ease",
              }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLElement;
                el.style.color = DS.text;
                el.querySelector("svg")?.setAttribute("style", `color:${DS.pink}; transition:transform 0.15s`);
                const svg = el.querySelector("svg") as SVGSVGElement | null;
                if (svg) { el.style.transform = "translateX(2px)"; }
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLElement;
                el.style.color = DS.text4;
                el.style.transform = "translateX(0)";
              }}
            >
              <ChevronRight size={10} style={{ color: DS.pink, flexShrink: 0, transition: "transform 0.15s" }} />
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Animated ring decoration ──────────────────────────────────────────────────
function CosmicRing() {
  return (
    <div style={{ position: "relative", width: 120, height: 120, flexShrink: 0 }}>
      {/* Outer ring */}
      <div style={{
        position: "absolute", inset: 0,
        borderRadius: "50%",
        border: "1px solid rgba(236,72,153,0.2)",
        animation: "spin-ring 8s linear infinite",
      }} />
      {/* Mid ring */}
      <div style={{
        position: "absolute", inset: 10,
        borderRadius: "50%",
        border: "1px dashed rgba(107,61,245,0.3)",
        animation: "spin-ring 12s linear infinite reverse",
      }} />
      {/* Inner ring */}
      <div style={{
        position: "absolute", inset: 22,
        borderRadius: "50%",
        border: `2px solid transparent`,
        borderTopColor: "rgba(236,72,153,0.6)",
        borderRightColor: "rgba(79,125,243,0.3)",
        animation: "spin-ring 4s linear infinite",
      }} />
      {/* Center glow dot */}
      <div style={{
        position: "absolute", inset: "35%",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(236,72,153,0.8) 0%, rgba(107,61,245,0.4) 100%)",
        boxShadow: `0 0 16px rgba(236,72,153,0.6), 0 0 32px rgba(107,61,245,0.3)`,
      }} />
    </div>
  );
}

// ── Main Footer ────────────────────────────────────────────────────────────────
export default function SiteFooter({ locale = "vi" }: { locale?: string }) {
  const t = useTranslations("Footer");
  const tNav = useTranslations("Navigation");
  const pathname = usePathname();
  if (pathname.includes("/onboarding")) return null;

  const cols = [
    {
      title: t("services"),
      icon: <Globe size={14} />,
      links: [
        { label: t("servicesLinks.webDesign"),       href: `/${locale}/services` },
        { label: t("servicesLinks.appDev"),          href: `/${locale}/services` },
        { label: t("servicesLinks.saas"),             href: `/${locale}/services` },
        { label: t("servicesLinks.seoMarketing"),    href: `/${locale}/services` },
        { label: t("servicesLinks.bookConsultation"), href: `/${locale}/booking` },
      ],
    },
    {
      title: t("resources"),
      icon: <BookOpen size={14} />,
      links: [
        { label: t("resourcesLinks.academy"),    href: `/${locale}/academy` },
        { label: t("resourcesLinks.blog"),        href: `/${locale}/blog` },
        { label: t("resourcesLinks.portfolio"),   href: `/${locale}/portfolio` },
        { label: t("resourcesLinks.lpSystem"),    href: `/${locale}/khach-hang` },
        { label: t("resourcesLinks.pricing"),     href: `/${locale}/pricing` },
      ],
    },
    {
      title: t("company"),
      icon: <Shield size={14} />,
      links: [
        { label: t("companyLinks.about"),           href: `/${locale}` },
        { label: tNav("team"),                      href: `/${locale}/team` },
        { label: t("companyLinks.careers"),         href: `/${locale}/contact` },
        { label: t("companyLinks.companyProcess"),  href: `/${locale}/quy-trinh` },
        { label: t("companyLinks.terms"),           href: `/${locale}/terms` },
        { label: t("companyLinks.contact"),         href: `/${locale}/contact` },
      ],
    },
  ];

  return (
    <footer style={{ background: DS.bgCosmic, marginTop: "auto" }}>

      {/* ── KEYFRAMES ── */}
      <style>{`
        @keyframes spin-ring {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes glow-pulse {
          0%, 100% { box-shadow: 0 0 20px rgba(236,72,153,0.3); }
          50%       { box-shadow: 0 0 40px rgba(236,72,153,0.55), 0 0 80px rgba(107,61,245,0.2); }
        }
        @keyframes float-y {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-6px); }
        }
        .footer-main-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1px;
          background: rgba(255,255,255,0.06);
          border-radius: 16px;
          overflow: hidden;
          margin-bottom: 2.5rem;
        }
        @media (min-width: 768px) {
          .footer-main-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (min-width: 1024px) {
          .footer-main-grid {
            grid-template-columns: repeat(5, 1fr);
          }
        }
      `}</style>

      {/* ═══════════════════════════════════════════════════════════════
          CTA BANNER — Full-width cosmic gradient
      ═══════════════════════════════════════════════════════════════ */}
      <div style={{
        padding: "4.5rem 1.5rem",
        background: "linear-gradient(135deg, rgba(107,61,245,0.18) 0%, rgba(79,125,243,0.10) 40%, rgba(236,72,153,0.08) 100%)",
        borderBottom: `1px solid rgba(107,61,245,0.18)`,
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Background glow blobs */}
        <div style={{
          position: "absolute", top: "-40%", left: "-10%",
          width: 400, height: 400, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(236,72,153,0.12) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", bottom: "-30%", right: "5%",
          width: 300, height: 300, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(79,125,243,0.12) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        <div style={{
          maxWidth: "64rem", margin: "0 auto",
          display: "flex", alignItems: "center", gap: "3rem",
          flexWrap: "wrap", justifyContent: "space-between",
        }}>
          {/* Left: text + CTAs */}
          <div style={{ flex: "1 1 360px" }}>
            {/* Badge */}
            <div style={{
              display: "inline-flex", alignItems: "center", gap: "0.5rem",
              marginBottom: "1.25rem", padding: "0.375rem 1rem",
              borderRadius: "9999px",
              background: "rgba(236,72,153,0.10)",
              border: "1px solid rgba(236,72,153,0.30)",
              boxShadow: "0 0 16px rgba(236,72,153,0.12)",
            }}>
              <Zap size={12} style={{ color: DS.pink }} />
              <span style={{ color: DS.pinkLight, fontSize: "0.6875rem", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.18em" }}>
                BẮT ĐẦU HÀNH TRÌNH
              </span>
            </div>

            <h2 style={{
              fontFamily: DS.heading,
              fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
              fontWeight: 900, letterSpacing: "0.05em", lineHeight: 1.2,
              background: `linear-gradient(135deg, #FFFFFF 0%, ${DS.pink} 55%, ${DS.pinkLight} 100%)`,
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              marginBottom: "0.875rem",
            }}>
              {t("ctaTitle")}
            </h2>

            <p style={{ color: DS.text3, fontSize: "1rem", marginBottom: "2rem", lineHeight: 1.7, maxWidth: 480 }}>
              {t("ctaDesc")}
            </p>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.875rem" }}>
              <Link
                href={`/${locale}/booking`}
                style={{
                  display: "inline-flex", alignItems: "center", gap: "0.5rem",
                  background: GRD.primary, color: "#fff",
                  fontSize: "0.9375rem", fontWeight: 700,
                  padding: "0.75rem 1.75rem", borderRadius: "0.75rem",
                  textDecoration: "none",
                  boxShadow: "0 0 30px rgba(129,140,248,0.4)",
                  transition: "all 0.18s ease",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = "0.9"; (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = "1"; (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}
              >
                <Rocket size={16} />
                {t("ctaButton")} →
              </Link>

              <Link
                href={`/${locale}/contact`}
                style={{
                  display: "inline-flex", alignItems: "center", gap: "0.5rem",
                  background: "rgba(236,72,153,0.10)",
                  border: "1px solid rgba(236,72,153,0.35)",
                  color: DS.pinkLight, fontSize: "0.9375rem", fontWeight: 600,
                  padding: "0.75rem 1.75rem", borderRadius: "0.75rem",
                  textDecoration: "none",
                  transition: "all 0.18s ease",
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.background = "rgba(236,72,153,0.18)";
                  el.style.borderColor = "rgba(236,72,153,0.6)";
                  el.style.transform = "translateY(-1px)";
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.background = "rgba(236,72,153,0.10)";
                  el.style.borderColor = "rgba(236,72,153,0.35)";
                  el.style.transform = "translateY(0)";
                }}
              >
                <MessageCircle size={16} style={{ color: DS.pink }} />
                Liên hệ ngay
              </Link>
            </div>
          </div>

          {/* Right: cosmic ring decoration */}
          <div style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
            <CosmicRing />
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          CONTACT STRIP — highlighted bar with call + zalo + email
      ═══════════════════════════════════════════════════════════════ */}
      <div style={{
        background: "rgba(12,12,20,0.95)",
        borderBottom: `1px solid ${DS.border}`,
        padding: "1.25rem 1.5rem",
      }}>
        <div style={{
          maxWidth: "80rem", margin: "0 auto",
          display: "flex", flexWrap: "wrap",
          alignItems: "center", justifyContent: "space-between", gap: "1rem",
        }}>
          {/* Contact items */}
          <div style={{
            display: "flex", flexWrap: "wrap", alignItems: "center", gap: "1.5rem",
          }}>
            {[
              { icon: <Phone size={15} />,   label: "Hotline",         val: "+84 37 844 3602", color: DS.pink },
              { icon: <Mail size={15} />,    label: "Email",            val: "ducanhnhatbui@gmail.com", color: DS.blue },
              { icon: <MapPin size={15} />,  label: "Địa chỉ",          val: "Cái Răng, Cần Thơ", color: DS.cyan },
              { icon: <Clock size={15} />,   label: "Giờ làm việc",    val: "T2–T6 · 09:00–18:00", color: DS.amber },
            ].map((item) => (
              <div key={item.label} style={{
                display: "flex", alignItems: "center", gap: "0.5rem",
              }}>
                <div style={{
                  width: 30, height: 30, borderRadius: 8,
                  background: `${item.color}15`,
                  border: `1px solid ${item.color}30`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: item.color, flexShrink: 0,
                }}>
                  {item.icon}
                </div>
                <div>
                  <div style={{ fontSize: "0.5625rem", color: DS.text5, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.12em", marginBottom: 1 }}>
                    {item.label.toUpperCase()}
                  </div>
                  <div style={{ fontSize: "0.8125rem", color: DS.text2 }}>{item.val}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Quick action buttons */}
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            {/* ── Call button ── */}
            <motion.a
              href={`tel:${CEO_CONTACT.phone}`}
              aria-label={`Gọi ${CEO_CONTACT.phoneDisplay}`}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 24 }}
              style={{
                display: "inline-flex", alignItems: "center", gap: "0.4rem",
                background: "linear-gradient(135deg, #EC4899 0%, #6B3DF5 100%)",
                border: "none",
                borderRadius: 10, padding: "0.55rem 1rem",
                color: "#fff", fontSize: "0.8125rem", fontWeight: 700,
                textDecoration: "none",
                boxShadow: "0 4px 18px rgba(236,72,153,0.45), 0 0 0 1px rgba(255,255,255,0.1)",
                position: "relative", overflow: "hidden",
              }}
            >
              {/* Shimmer */}
              <motion.div
                animate={{ x: ["-120%", "200%"] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 5, ease: "easeInOut" }}
                style={{
                  position: "absolute", inset: 0,
                  background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.2) 50%, transparent 100%)",
                  pointerEvents: "none",
                }}
              />
              <Phone size={13} />
              <span>Gọi ngay</span>
            </motion.a>

            {/* ── Zalo button ── */}
            <motion.a
              href={CEO_CONTACT.zaloUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Liên hệ qua Zalo"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 24 }}
              style={{
                display: "inline-flex", alignItems: "center", gap: "0.4rem",
                background: "linear-gradient(135deg, #0068FF 0%, #0047CC 100%)",
                border: "none",
                borderRadius: 10, padding: "0.55rem 1rem",
                color: "#fff", fontSize: "0.8125rem", fontWeight: 700,
                textDecoration: "none",
                boxShadow: "0 4px 16px rgba(0,104,255,0.4), 0 0 0 1px rgba(255,255,255,0.08)",
              }}
            >
              <svg width={13} height={13} viewBox="0 0 80 80" fill="none" aria-hidden="true">
                <path d="M70.58 55.27C71.36 51.84 72 48.49 72 44.52C72 31.12 63.45 20.5 50.06 20.5C46.35 20.5 42.76 21.32 39.59 22.84L28 14.5 37.19 24.88C33.24 26.72 30.16 29.73 28.11 33.63L19.38 27.19 26.88 41.21C26.88 41.21 22.81 55.27 10.12 55.27C5.46 55.27 1 59.11 1 64.08C1 69.05 5.46 73.58 10.12 73.58C16.15 73.58 25.27 70.66 27.58 65.08C31.04 74.38 40.65 79.58 50.65 79.58C63.45 79.58 72 67.89 72 55.27H70.58Z" fill="white"/>
              </svg>
              <span>Zalo</span>
            </motion.a>

            {/* ── Facebook button ── */}
            <motion.a
              href={CEO_CONTACT.facebookUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Kết nối qua Facebook"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 24 }}
              style={{
                display: "inline-flex", alignItems: "center", gap: "0.4rem",
                background: "linear-gradient(135deg, #1877F2 0%, #0D5FC4 100%)",
                border: "none",
                borderRadius: 10, padding: "0.55rem 1rem",
                color: "#fff", fontSize: "0.8125rem", fontWeight: 700,
                textDecoration: "none",
                boxShadow: "0 4px 16px rgba(24,119,242,0.4), 0 0 0 1px rgba(255,255,255,0.08)",
              }}
            >
              <svg width={12} height={12} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z" />
              </svg>
              <span>Facebook</span>
            </motion.a>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          MAIN GRID — 5 equal columns
      ═══════════════════════════════════════════════════════════════ */}
      <div style={{ maxWidth: "80rem", margin: "0 auto", padding: "3rem 1.5rem 2rem" }}>
        <div className="footer-main-grid">
          {/* ── Brand + Social column ── */}
          <div style={{ background: DS.bgCosmic, padding: "2rem" }}>
            <Link href={`/${locale}`} style={{
              display: "inline-flex", alignItems: "center", gap: "0.625rem",
              textDecoration: "none", marginBottom: "1.25rem",
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: GRD.primary,
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 0 16px rgba(236,72,153,0.3)",
                flexShrink: 0,
              }}>
                <svg width="18" height="18" viewBox="0 0 40 40" fill="none">
                  <path d="M20 2 L36 11 L36 29 L20 38 L4 29 L4 11 Z" stroke="rgba(255,255,255,0.8)" strokeWidth="1.5" fill="none" />
                  <path d="M20 8 L30 13.5 L30 25 L20 30.5 L10 25 L10 13.5 Z" fill="rgba(255,255,255,0.12)" />
                  <text x="20" y="25" textAnchor="middle" fontSize="14" fontWeight="900" fill="white" fontFamily="serif">∞</text>
                </svg>
              </div>
              <div>
                <div style={{ color: DS.text, fontFamily: DS.heading, fontSize: "0.875rem", fontWeight: 900, letterSpacing: "0.06em" }}>
                  LOOP SOLUTIONS
                </div>
                <div style={{ color: DS.text5, fontSize: "0.5rem", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.2em" }}>
                  DIGITAL AGENCY OS
                </div>
              </div>
            </Link>

            <p style={{ color: DS.text4, fontSize: "0.75rem", lineHeight: 1.7, marginBottom: "1.25rem" }}>
              {t("description")}
            </p>

            {/* Social icons */}
            <div style={{ display: "flex", gap: "0.375rem" }}>
              <SocialIconButton href={`tel:${CEO_CONTACT.phone}`} label="Gọi điện" icon={<Phone size={14} />} color={DS.pink} borderColor="rgba(236,72,153,0.30)" />
              <SocialIconButton href={CEO_CONTACT.zaloUrl} label="Zalo" icon={<MessageCircle size={14} />} color="#4D9FFF" borderColor="rgba(0,104,255,0.30)" />
              <SocialIconButton
                href={CEO_CONTACT.facebookUrl} label="Facebook"
                icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z" /></svg>}
                color="#1877F2" borderColor="rgba(24,119,242,0.30)"
              />
            </div>
          </div>

          {/* ── Newsletter column ── */}
          <div style={{ background: DS.bgCosmic, padding: "2rem" }}>
            <div style={{
              color: DS.text3, fontSize: "0.625rem", marginBottom: "0.875rem",
              fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.15em",
            }}>
              ── {t("newsletterLabel").toUpperCase()}
            </div>
            <p style={{ color: DS.text4, fontSize: "0.75rem", lineHeight: 1.6, marginBottom: "0.875rem" }}>
              Nhận tin khuyến mãi & cập nhật từ LOOP.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
              <input
                type="email"
                placeholder={t("newsletterPlaceholder")}
                style={{
                  width: "100%", background: DS.bgCard2,
                  border: `1px solid ${DS.border}`,
                  borderRadius: 8, padding: "8px 10px",
                  color: DS.text, fontSize: 12, outline: "none",
                  transition: "border-color 0.15s", boxSizing: "border-box",
                }}
                onFocus={e => { (e.currentTarget as HTMLInputElement).style.borderColor = "rgba(107,61,245,0.5)"; }}
                onBlur={e => { (e.currentTarget as HTMLInputElement).style.borderColor = DS.border; }}
              />
              <button
                style={{
                  background: GRD.primary, border: "none",
                  borderRadius: 8, padding: "7px 12px",
                  cursor: "pointer", color: "#fff",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "0.375rem",
                  fontSize: "0.75rem", fontWeight: 600,
                  transition: "opacity 0.15s",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = "0.85"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
              >
                <Send size={12} /> Đăng ký
              </button>
            </div>
          </div>

          {/* ── Nav columns ── */}
          {cols.map(col => (
            <div key={col.title} style={{ background: DS.bgCosmic, padding: "2rem" }}>
              <FooterColumn title={col.title} icon={col.icon} links={col.links} />
            </div>
          ))}
        </div>

        {/* ══════════════════════════════════════════════════════════
            BOTTOM BAR
        ══════════════════════════════════════════════════════════ */}
        <div style={{
          paddingTop: "1.5rem",
          borderTop: `1px solid ${DS.border}`,
          display: "flex", flexWrap: "wrap",
          justifyContent: "space-between", alignItems: "center", gap: "0.75rem",
        }}>
          {/* Left */}
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.75rem" }}>
            <p style={{ color: DS.text4, fontSize: "0.75rem", margin: 0, fontFamily: "'JetBrains Mono', monospace" }}>
              {t("rights")}
            </p>

            {/* Animated rank dots */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              {RANK_COLORS.map(r => (
                <div
                  key={r.key}
                  title={r.key}
                  style={{
                    width: 7, height: 7, borderRadius: "50%",
                    background: r.color,
                    boxShadow: `0 0 5px ${r.color}`,
                    animation: r.key === "diamond" ? "glow-pulse 2.5s ease-in-out infinite" : undefined,
                  }}
                />
              ))}
            </div>

            {/* Season badge */}
            <div style={{
              display: "inline-flex", alignItems: "center",
              padding: "2px 8px",
              borderRadius: 6,
              background: "rgba(107,61,245,0.10)",
              border: "1px solid rgba(107,61,245,0.25)",
              color: DS.cosmicPurple, fontSize: "0.6875rem",
              fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.12em",
            }}>
              {t("season")}
            </div>
          </div>

          {/* Back to top */}
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            style={{
              display: "inline-flex", alignItems: "center", gap: "0.375rem",
              background: "transparent",
              border: `1px solid ${DS.border}`,
              borderRadius: 8, padding: "5px 10px",
              color: DS.text4, fontSize: "0.75rem",
              fontFamily: "'JetBrains Mono', monospace",
              cursor: "pointer", transition: "all 0.15s",
            }}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLElement;
              el.style.borderColor = "rgba(107,61,245,0.4)";
              el.style.color = DS.text;
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLElement;
              el.style.borderColor = DS.border;
              el.style.color = DS.text4;
            }}
          >
            ↑ Quay lên đầu
          </button>
        </div>
      </div>
    </footer>
  );
}
