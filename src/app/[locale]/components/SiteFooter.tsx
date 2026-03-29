"use client";

/**
 * SiteFooter — LOOP Solutions
 * Figma dark theme footer.
 * Migrated from Figma OLD FE Footer.tsx.
 */

import Link from "next/link";
import { useTranslations } from "next-intl";
import { DS, GRD } from "@/lib/design-tokens";
import { Mail, Phone, MapPin, Zap, Rocket, Globe, Shield, BookOpen } from "lucide-react";

interface FooterCol {
  title: string;
  icon: React.ReactNode;
  links: { label: string; href: string }[];
}

function FooterColumn({ col }: { col: FooterCol }) {
  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          marginBottom: "1rem",
          color: DS.text2,
          fontSize: "0.8125rem",
          fontWeight: 600,
        }}
      >
        <span style={{ color: DS.blue }}>{col.icon}</span>
        {col.title}
      </div>
      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {col.links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              style={{
                color: DS.text4,
                fontSize: "0.8125rem",
                textDecoration: "none",
                transition: "color 0.15s ease",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = DS.text3; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = DS.text4; }}
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function SiteFooter({ locale = "vi" }: { locale?: string }) {
  const t = useTranslations("Footer");
  const tNav = useTranslations("Navigation");

  const cols: FooterCol[] = [
    {
      title: t("services"),
      icon: <Globe size={14} />,
      links: [
        { label: "Thiết kế Website", href: `/${locale}/services` },
        { label: "Phát triển App", href: `/${locale}/services` },
        { label: "SaaS Platform", href: `/${locale}/services` },
        { label: "SEO & Marketing", href: `/${locale}/services` },
        { label: "Đặt lịch tư vấn", href: `/${locale}/booking` },
      ],
    },
    {
      title: t("stayConnected"),
      icon: <BookOpen size={14} />,
      links: [
        { label: "Học viện LOOP", href: `/${locale}/academy` },
        { label: "Blog & Insights", href: `/${locale}/blog` },
        { label: "Portfolio dự án", href: `/${locale}/portfolio` },
        { label: "Hệ thống LP", href: `/${locale}/customer-portal` },
        { label: "Bảng giá", href: `/${locale}/pricing` },
      ],
    },
    {
      title: t("company"),
      icon: <Shield size={14} />,
      links: [
        { label: "Về chúng tôi", href: `/${locale}` },
        { label: tNav("team"), href: `/${locale}/team` },
        { label: "Tuyển dụng", href: `/${locale}/contact` },
        { label: "Quy trình công ty", href: `/${locale}/about` },
        { label: tNav("contact"), href: `/${locale}/contact` },
      ],
    },
  ];

  return (
    <footer
      style={{
        background: "#010410",
        borderTop: `1px solid ${DS.border}`,
        marginTop: "auto",
      }}
    >
      {/* CTA Banner */}
      <div
        style={{
          padding: "4rem 1.5rem",
          background: "linear-gradient(135deg, rgba(29,78,216,0.15) 0%, rgba(129,140,248,0.08) 100%)",
          borderBottom: `1px solid ${DS.border}`,
        }}
      >
        <div style={{ maxWidth: "56rem", margin: "0 auto", textAlign: "center" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              marginBottom: "1rem",
              padding: "0.375rem 1rem",
              borderRadius: "9999px",
              background: "rgba(59,130,246,0.1)",
              border: "1px solid rgba(59,130,246,0.25)",
            }}
          >
            <Zap size={12} style={{ color: DS.blue }} />
            <span
              style={{
                color: DS.blue,
                fontSize: "0.6875rem",
                fontFamily: "'JetBrains Mono', monospace",
                letterSpacing: "0.18em",
              }}
            >
              {t("highlightGlobal")}
            </span>
          </div>

          <h2
            style={{
              fontFamily: "'Cinzel', serif",
              fontSize: "clamp(1.5rem, 4vw, 2rem)",
              fontWeight: 900,
              letterSpacing: "0.06em",
              background: "linear-gradient(135deg, #FFFFFF, #94A3B8)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              marginBottom: "0.75rem",
            }}
          >
            {t("ctaTitle")}
          </h2>

          <p style={{ color: DS.text3, fontSize: "0.9375rem", marginBottom: "2rem", lineHeight: 1.7 }}>
            {t("ctaDesc")}
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", justifyContent: "center" }}>
            <Link
              href={`/${locale}/booking`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                background: GRD.primary,
                color: "#fff",
                fontSize: "0.9375rem",
                fontWeight: 700,
                padding: "0.75rem 1.75rem",
                borderRadius: "0.75rem",
                textDecoration: "none",
                boxShadow: "0 0 30px rgba(129,140,248,0.4)",
              }}
            >
              <Rocket size={16} />
              {t("getInTouch")}
            </Link>
            <Link
              href={`/${locale}/contact`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                color: DS.text3,
                fontSize: "0.9375rem",
                fontWeight: 500,
                padding: "0.75rem 1.75rem",
                borderRadius: "0.75rem",
                border: `1px solid ${DS.border}`,
                textDecoration: "none",
                background: "rgba(255,255,255,0.04)",
              }}
            >
              <Mail size={16} />
              {tNav("contact")}
            </Link>
          </div>
        </div>
      </div>

      {/* Main footer */}
      <div style={{ maxWidth: "80rem", margin: "0 auto", padding: "3rem 1.5rem 2rem" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
            gap: "2.5rem",
            marginBottom: "2.5rem",
          }}
        >
          {/* Brand */}
          <div>
            <Link
              href={`/${locale}`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.75rem",
                textDecoration: "none",
                marginBottom: "1rem",
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: GRD.primary,
                }}
              >
                <svg width="20" height="20" viewBox="0 0 40 40" fill="none">
                  <path
                    d="M20 2 L36 11 L36 29 L20 38 L4 29 L4 11 Z"
                    stroke="rgba(255,255,255,0.8)"
                    strokeWidth="1.5"
                    fill="none"
                  />
                  <path d="M20 8 L30 13.5 L30 25 L20 30.5 L10 25 L10 13.5 Z" fill="rgba(255,255,255,0.12)" />
                  <text x="20" y="25" textAnchor="middle" fontSize="14" fontWeight="900" fill="white" fontFamily="serif">
                    ∞
                  </text>
                </svg>
              </div>
              <div>
                <div style={{ color: DS.text, fontFamily: "'Cinzel', serif", fontSize: "1rem", fontWeight: 900, letterSpacing: "0.06em" }}>
                  LOOP
                </div>
                <div style={{ color: DS.text4, fontSize: "0.5625rem", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.2em" }}>
                  SOLUTIONS
                </div>
              </div>
            </Link>
            <p style={{ color: DS.text4, fontSize: "0.8125rem", lineHeight: 1.7, maxWidth: 220 }}>
              {t("description")}
            </p>
          </div>

          {/* Nav columns */}
          {cols.map((col) => (
            <FooterColumn key={col.title} col={col} />
          ))}

          {/* Contact */}
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                marginBottom: "1rem",
                color: DS.text2,
                fontSize: "0.8125rem",
                fontWeight: 600,
              }}
            >
              <Mail size={14} style={{ color: DS.blue }} />
              Liên hệ
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
              {[
                { icon: <Mail size={12} />, text: "hello@loop.vn" },
                { icon: <Phone size={12} />, text: "+84 28 1234 5678" },
                { icon: <MapPin size={12} />, text: "TP. Hồ Chí Minh, Việt Nam" },
              ].map((item) => (
                <div
                  key={item.text}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    color: DS.text4,
                    fontSize: "0.8125rem",
                  }}
                >
                  <span style={{ color: DS.text4 }}>{item.icon}</span>
                  {item.text}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          style={{
            paddingTop: "1.5rem",
            borderTop: `1px solid ${DS.border}`,
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "1rem",
          }}
        >
          <p style={{ color: DS.text4, fontSize: "0.75rem", margin: 0 }}>
            {t("rights")}
          </p>
          <div style={{ display: "flex", gap: "1.5rem" }}>
            {[
              { label: t("privacyPolicy"), href: `/${locale}/privacy` },
              { label: t("termsOfService"), href: `/${locale}/terms` },
              { label: "Cookie Policy", href: `/${locale}` },
            ].map((item) => (
              <Link
                key={item.label}
                href={item.href}
                style={{
                  color: DS.text4,
                  fontSize: "0.75rem",
                  textDecoration: "none",
                  transition: "color 0.15s ease",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = DS.text3; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = DS.text4; }}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
