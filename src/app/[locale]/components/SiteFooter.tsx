"use client";

/**
 * SiteFooter — LOOP Solutions (BE Production)
 * Figma dark theme footer.
 *
 * Features:
 *  - CTA Banner with gradient + 500 LP badge
 *  - 4-column grid: Brand + Services + Resources + Company
 *  - Newsletter signup input
 *  - Contact info (email, phone, address)
 *  - Bottom bar: copyright + rank dots + ADMIN + SEASON III
 */

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { DS, GRD } from "@/lib/design-tokens";
import { Mail, Phone, MapPin, Clock, Zap, Rocket, Globe, Shield, BookOpen, Settings, Send, Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuthStore } from "@/app/store/authStore";
import { toast } from "sonner";

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
          display: "flex", alignItems: "center", gap: "0.5rem",
          marginBottom: "1rem", color: DS.text3,
          fontSize: "0.6875rem", fontFamily: "'JetBrains Mono', monospace",
          letterSpacing: "0.18em", fontWeight: 700,
        }}
      >
        <span style={{ color: DS.blue }}>{col.icon}</span>
        {col.title.toUpperCase()}
      </div>
      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.625rem" }}>
        {col.links.map((link, idx) => (
          <li key={`${link.href}-${idx}`}>
            <Link
              href={link.href}
              style={{
                color: DS.text4, fontSize: "0.8125rem",
                textDecoration: "none", transition: "color 0.15s ease",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = DS.text; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = DS.text4; }}
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

const RANK_COLORS = [
  { key: "iron", color: "#9CA3AF" },
  { key: "bronze", color: "#CD7F32" },
  { key: "silver", color: "#CBD5E1" },
  { key: "gold", color: "#FFD700" },
  { key: "platinum", color: "#14B8A6" },
  { key: "ruby", color: "#EF4444" },
  { key: "diamond", color: "#818CF8" },
];

// ── Staff Login Section — compact form in footer ────────────────────────────────
function StaffLoginSection({ locale }: { locale: string }) {
  const router = useRouter();
  const { login, isLoading } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setError("");
    const ok = await login(email, password);
    if (ok) {
      const user = useAuthStore.getState().user;
      toast.success("Đăng nhập thành công!", {
        description: user ? `Chào mừng ${user.name}` : undefined,
      });
      router.push("/admin/overview");
    } else {
      setError(useAuthStore.getState().error ?? "Đăng nhập thất bại");
    }
  };

  return (
    <div
      style={{
        display: "flex", flexDirection: "column",
        background: "rgba(15,23,42,0.6)",
        border: "1px solid rgba(59,130,246,0.2)",
        borderRadius: 10, padding: "0.875rem 1rem",
        minWidth: 260, gap: "0.5rem",
      }}
    >
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
          <Settings size={11} color={DS.blue} />
          <span style={{
            color: DS.blue, fontSize: "0.6875rem",
            fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.12em",
          }}>
            NHÂN VIÊN
          </span>
        </div>
        <Link
          href={`/${locale}/nhan-vien`}
          style={{
            color: DS.text4, fontSize: "0.6875rem",
            textDecoration: "none",
            fontFamily: "'JetBrains Mono', monospace",
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = DS.purple; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = DS.text4; }}
        >
          Đăng nhập →
        </Link>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", gap: "0.375rem" }}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          style={{
            flex: 1, background: DS.bgCard2, border: `1px solid ${DS.border}`,
            borderRadius: 7, padding: "6px 10px",
            color: DS.text, fontSize: 12, outline: "none", minWidth: 0,
          }}
        />
        <input
          type={show ? "text" : "password"}
          placeholder="Mật khẩu"
          value={password}
          onChange={e => setPassword(e.target.value)}
          style={{
            width: 90, background: DS.bgCard2, border: `1px solid ${DS.border}`,
            borderRadius: 7, padding: "6px 8px",
            color: DS.text, fontSize: 12, outline: "none",
          }}
        />
        <button
          type="submit"
          disabled={isLoading}
          style={{
            background: GRD.primary, border: "none", borderRadius: 7,
            padding: "6px 10px", cursor: isLoading ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center",
            color: "#fff", flexShrink: 0,
          }}
        >
          {isLoading ? (
            <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} />
          ) : (
            <Eye size={12} />
          )}
        </button>
        <button
          type="button"
          onClick={() => { void setShow(v => !v); }}
          style={{
            background: "rgba(255,255,255,0.04)", border: `1px solid ${DS.border}`,
            borderRadius: 7, padding: "6px 8px", cursor: "pointer",
            display: "flex", alignItems: "center", color: DS.text4, flexShrink: 0,
          }}
        >
          {show ? <EyeOff size={12} /> : <Eye size={12} />}
        </button>
      </form>

      {error && (
        <div style={{
          fontSize: "0.625rem", color: "#FCA5A5",
          fontFamily: "'JetBrains Mono', monospace",
        }}>
          {error}
        </div>
      )}
    </div>
  );
}

export default function SiteFooter({ locale = "vi" }: { locale?: string }) {
  const t = useTranslations("Footer");
  const tNav = useTranslations("Navigation");
  const pathname = usePathname();

  if (pathname.includes('/onboarding')) return null;

  const cols: FooterCol[] = [
    {
      title: t("services"),
      icon: <Globe size={14} />,
      links: [
        { label: t("servicesLinks.webDesign"), href: `/${locale}/services` },
        { label: t("servicesLinks.appDev"), href: `/${locale}/services` },
        { label: t("servicesLinks.saas"), href: `/${locale}/services` },
        { label: t("servicesLinks.seoMarketing"), href: `/${locale}/services` },
        { label: t("servicesLinks.bookConsultation"), href: `/${locale}/booking` },
      ],
    },
    {
      title: t("resources"),
      icon: <BookOpen size={14} />,
      links: [
        { label: t("resourcesLinks.academy"), href: `/${locale}/academy` },
        { label: t("resourcesLinks.blog"), href: `/${locale}/blog` },
        { label: t("resourcesLinks.portfolio"), href: `/${locale}/portfolio` },
        { label: t("resourcesLinks.lpSystem"), href: `/${locale}/khach-hang` },
        { label: t("resourcesLinks.pricing"), href: `/${locale}/pricing` },
      ],
    },
    {
      title: t("company"),
      icon: <Shield size={14} />,
      links: [
        { label: t("companyLinks.about"), href: `/${locale}` },
        { label: tNav("team"), href: `/${locale}/team` },
        { label: t("companyLinks.careers"), href: `/${locale}/contact` },
        { label: t("companyLinks.companyProcess"), href: `/${locale}/quy-trinh` },
        { label: t("companyLinks.terms"), href: `/${locale}/terms` },
        { label: t("companyLinks.contact"), href: `/${locale}/contact` },
      ],
    },
  ];

  return (
    <footer
      style={{
        background: DS.bgCosmic,
        borderTop: `1px solid ${DS.border}`,
        marginTop: "auto",
      }}
    >
      {/* CTA Banner */}
      <div
        style={{
          padding: "4rem 1.5rem",
          background: "linear-gradient(135deg, rgba(107,61,245,0.15) 0%, rgba(79,125,243,0.08) 100%)",
          borderBottom: `1px solid ${DS.border}`,
        }}
      >
        <div style={{ maxWidth: "56rem", margin: "0 auto", textAlign: "center" }}>
          <div
            style={{
              display: "inline-flex", alignItems: "center", gap: "0.5rem",
              marginBottom: "1rem", padding: "0.375rem 1rem",
              borderRadius: "9999px",
              background: "rgba(59,130,246,0.1)",
              border: "1px solid rgba(59,130,246,0.25)",
            }}
          >
            <Zap size={12} style={{ color: DS.blue }} />
            <span style={{ color: DS.blue, fontSize: "0.6875rem", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.18em" }}>
              BẮT ĐẦU HÀNH TRÌNH
            </span>
          </div>

          <h2
            style={{
              fontFamily: DS.heading,
              fontSize: "clamp(1.5rem, 4vw, 2rem)",
              fontWeight: 900, letterSpacing: "0.06em",
              background: `linear-gradient(135deg, #FFFFFF 0%, ${DS.pink} 60%, ${DS.pinkLight} 100%)`,
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
                display: "flex", alignItems: "center", gap: "0.5rem",
                background: GRD.primary, color: "#fff",
                fontSize: "0.9375rem", fontWeight: 700,
                padding: "0.75rem 1.75rem", borderRadius: "0.75rem",
                textDecoration: "none", boxShadow: "0 0 30px rgba(129,140,248,0.4)",
              }}
            >
              <Rocket size={16} />
              {t("ctaButton")} →
            </Link>
            <Link
              href={`/${locale}/portfolio`}
              style={{
                display: "flex", alignItems: "center", gap: "0.5rem",
                color: DS.text3, fontSize: "0.9375rem", fontWeight: 500,
                padding: "0.75rem 1.75rem", borderRadius: "0.75rem",
                border: `1px solid ${DS.border}`,
                textDecoration: "none",
                background: "rgba(255,255,255,0.04)",
              }}
            >
              {t("ctaSecondary")}
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
            gap: "2.5rem", marginBottom: "2.5rem",
          }}
        >
          {/* Brand column */}
          <div>
            <Link
              href={`/${locale}`}
              style={{
                display: "inline-flex", alignItems: "center", gap: "0.75rem",
                textDecoration: "none", marginBottom: "1rem",
              }}
            >
              <div
                style={{
                  width: 36, height: 36, borderRadius: 10,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: GRD.primary,
                }}
              >
                <svg width="20" height="20" viewBox="0 0 40 40" fill="none">
                  <path d="M20 2 L36 11 L36 29 L20 38 L4 29 L4 11 Z" stroke="rgba(255,255,255,0.8)" strokeWidth="1.5" fill="none" />
                  <path d="M20 8 L30 13.5 L30 25 L20 30.5 L10 25 L10 13.5 Z" fill="rgba(255,255,255,0.12)" />
                  <text x="20" y="25" textAnchor="middle" fontSize="14" fontWeight="900" fill="white" fontFamily="serif">∞</text>
                </svg>
              </div>
              <div>
                <div style={{ color: DS.text, fontFamily: DS.heading, fontSize: "1rem", fontWeight: 900, letterSpacing: "0.06em" }}>
                  LOOP SOLUTIONS
                </div>
                <div style={{ color: DS.text4, fontSize: "0.5625rem", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.2em" }}>
                  DIGITAL AGENCY OS
                </div>
              </div>
            </Link>
            <p style={{ color: DS.text4, fontSize: "0.8125rem", lineHeight: 1.7, maxWidth: 220, marginBottom: "1.25rem" }}>
              {t("description")}
            </p>

            {/* Contact info */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem", marginBottom: "1.25rem" }}>
              {[
                { icon: <Mail size={12} />, text: t("contactEmail") },
                { icon: <Phone size={12} />, text: t("contactPhone") },
                { icon: <MapPin size={12} />, text: t("contactAddress") },
                { icon: <Clock size={12} />, text: t("workingHours") },
              ].map(item => (
                <div key={item.text} style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: DS.text4, fontSize: "0.8125rem" }}>
                  <span style={{ color: DS.blue }}>{item.icon}</span>
                  {item.text}
                </div>
              ))}
            </div>

            {/* Newsletter */}
            <div>
              <div style={{
                color: DS.text3, fontSize: "0.6875rem", marginBottom: "0.5rem",
                fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.1em",
              }}>
                ── {t("newsletterLabel")}
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <input
                  type="email"
                  placeholder={t("newsletterPlaceholder")}
                  style={{
                    flex: 1, background: DS.bgCard2, border: `1px solid ${DS.border}`,
                    borderRadius: 8, padding: "8px 12px",
                    color: DS.text, fontSize: 12, outline: "none",
                  }}
                />
                <button
                  style={{
                    background: GRD.primary, border: "none",
                    borderRadius: 8, padding: "8px 12px",
                    cursor: "pointer", color: "#fff",
                  }}
                >
                  <Send size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* Nav columns */}
          {cols.map(col => (
            <FooterColumn key={col.title} col={col} />
          ))}
        </div>

        {/* Bottom bar */}
        <div
          style={{
            paddingTop: "1.5rem", borderTop: `1px solid ${DS.border}`,
            display: "flex", flexWrap: "wrap",
            justifyContent: "space-between", alignItems: "center", gap: "0.75rem",
          }}
        >
          {/* Left: copyright + rank dots + season */}
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.75rem" }}>
            <p style={{ color: DS.text4, fontSize: "0.75rem", margin: 0, fontFamily: "'JetBrains Mono', monospace" }}>
              {t("rights")}
            </p>

            {/* Rank color dots */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              {RANK_COLORS.map(r => (
                <div
                  key={r.key}
                  style={{
                    width: 6, height: 6, borderRadius: "50%",
                    background: r.color,
                    boxShadow: `0 0 4px ${r.color}`,
                  }}
                />
              ))}
            </div>

            {/* SEASON badge */}
            <div style={{
              color: DS.text4, fontSize: "0.6875rem",
              fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.15em",
            }}>
              {t("season")}
            </div>
          </div>

          {/* Right: staff login section — compact inline form */}
          <StaffLoginSection locale={locale} />
        </div>
      </div>
    </footer>
  );
}
