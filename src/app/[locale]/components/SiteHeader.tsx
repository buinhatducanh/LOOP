"use client";

/**
 * SiteHeader — LOOP Solutions
 * Figma dark theme navigation header.
 *
 * Features:
 *  - Dark glassmorphism nav with blur
 *  - Animated logo glow
 *  - 5-language LocaleSwitcher dropdown
 *  - Role-aware user menu (Zustand auth store)
 *  - Mobile hamburger menu
 *  - Active route highlighting
 */

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  Menu, X, LogIn, Zap, LogOut,
  ChevronDown, Globe, Rocket, Check,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { DS, GRD } from "@/lib/design-tokens";
import { useAuthStore } from "@/app/store/authStore";
import { routing } from "@/i18n/routing";

const rgba = (hex: string, a: number) => {
  const h = hex.replace("#", "");
  return `rgba(${parseInt(h.slice(0, 2), 16)},${parseInt(h.slice(2, 4), 16)},${parseInt(h.slice(4, 6), 16)},${a})`;
};

const LOCALE_LABELS: Record<string, { short: string; long: string; flag: string }> = {
  vi: { short: "VI", long: "Tiếng Việt", flag: "🇻🇳" },
  en: { short: "EN", long: "English", flag: "🇺🇸" },
  ja: { short: "JA", long: "日本語", flag: "🇯🇵" },
  ko: { short: "KO", long: "한국어", flag: "🇰🇷" },
  zh: { short: "ZH", long: "中文", flag: "🇨🇳" },
};

/** Returns role labels localized via the given translator. */
function getRoleLabels(
  t: ReturnType<typeof useTranslations<"Navigation">>
): Record<string, { label: string; color: string }> {
  return {
    admin: { label: t("roleAdmin"), color: "#818CF8" },
    manager: { label: t("roleManager"), color: "#F59E0B" },
    staff: { label: t("roleStaff"), color: "#14B8A6" },
    client: { label: t("roleClient"), color: DS.blue },
  };
}

function useNavLinks(locale: string) {
  const t = useTranslations("Navigation");
  return [
    { label: t("home"), href: `/${locale}/` },
    { label: t("services"), href: `/${locale}/services` },
    { label: t("media"), href: `/${locale}/media` },
    { label: t("portfolio"), href: `/${locale}/portfolio` },
    { label: t("team"), href: `/${locale}/team` },
    { label: t("academy"), href: `/${locale}/academy` },
    { label: t("blog"), href: `/${locale}/blog` },
    { label: t("pricing"), href: `/${locale}/pricing` },
    { label: t("contact"), href: `/${locale}/contact` },
  ];
}

// ── Locale Switcher ────────────────────────────────────────────────────────────────

function LocaleSwitcher({ locale }: { locale: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const current = LOCALE_LABELS[locale] ?? LOCALE_LABELS.vi;

  function switchLocale(next: string) {
    document.cookie = `NEXT_LOCALE=${next}; path=/; max-age=31536000; SameSite=Lax`;
    // Replace locale segment in pathname
    const segments = pathname.split("/");
    segments[1] = next;
    router.push(segments.join("/"));
    setOpen(false);
  }

  return (
    <div style={{ position: "relative" }} ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.375rem",
          background: rgba(DS.text, 0.03),
          border: `1px solid ${rgba(DS.text, 0.08)}`,
          borderRadius: 10,
          padding: "0.375rem 0.625rem",
          cursor: "pointer",
          color: DS.text3,
          fontSize: "0.75rem",
          fontFamily: "'JetBrains Mono', monospace",
          fontWeight: 600,
          transition: "border-color 0.15s ease",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.borderColor = rgba(DS.blue, 0.3);
          (e.currentTarget as HTMLButtonElement).style.color = DS.text;
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.borderColor = rgba(DS.text, 0.08);
          (e.currentTarget as HTMLButtonElement).style.color = DS.text3;
        }}
      >
        <Globe size={13} style={{ color: DS.blue }} />
        <span>{current.short}</span>
        <ChevronDown
          size={10}
          style={{
            transition: "transform 0.15s",
            transform: open ? "rotate(180deg)" : "none",
          }}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            style={{
              position: "absolute",
              top: "100%",
              right: 0,
              marginTop: "0.375rem",
              minWidth: 160,
              background: rgba(DS.bgCard, 0.98),
              border: `1px solid ${rgba(DS.blue, 0.15)}`,
              borderRadius: 12,
              backdropFilter: "blur(20px)",
              boxShadow: "0 16px 48px rgba(0,0,0,0.55)",
              overflow: "hidden",
              zIndex: 100,
            }}
          >
            <div
              style={{
                padding: "0.375rem",
              }}
            >
              {routing.locales.map((loc) => {
                const info = LOCALE_LABELS[loc] ?? LOCALE_LABELS.vi;
                const active = loc === locale;
                return (
                  <button
                    key={loc}
                    onClick={() => switchLocale(loc)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.625rem",
                      width: "100%",
                      padding: "0.5rem 0.75rem",
                      borderRadius: 8,
                      background: active ? "rgba(59,130,246,0.1)" : "none",
                      border: "none",
                      cursor: "pointer",
                      color: active ? DS.blue : DS.text3,
                      fontSize: "0.8125rem",
                      fontWeight: active ? 600 : 400,
                      textAlign: "left",
                      transition: "background 0.1s ease, color 0.1s ease",
                    }}
                    onMouseEnter={(e) => {
                      if (!active) {
                        (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.04)";
                        (e.currentTarget as HTMLButtonElement).style.color = DS.text;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!active) {
                        (e.currentTarget as HTMLButtonElement).style.background = "none";
                        (e.currentTarget as HTMLButtonElement).style.color = DS.text3;
                      }
                    }}
                  >
                    <span style={{ fontSize: "1rem" }}>{info.flag}</span>
                    <span style={{ flex: 1 }}>{info.long}</span>
                    {active && <Check size={12} style={{ color: DS.blue }} />}
                    <span
                      style={{
                        fontSize: "0.625rem",
                        fontFamily: "'JetBrains Mono', monospace",
                        color: active ? DS.blue : DS.text4,
                        opacity: active ? 1 : 0.6,
                      }}
                    >
                      {info.short}
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main SiteHeader ──────────────────────────────────────────────────────────────

export default function SiteHeader({ locale }: { locale: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const t = useTranslations("Navigation");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const navLinks = useNavLinks(locale);
  const roleLabels = getRoleLabels(t);

  // Close user menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    if (userMenuOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [userMenuOpen]);

  const isActive = (href: string) =>
    href === `/${locale}/` ? pathname === `/${locale}/` : pathname.startsWith(href);

  const handleLogout = async () => {
    await logout();
    router.push(`/${locale}/dang-nhap`);
  };

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.7)",
              zIndex: 40,
              backdropFilter: "blur(4px)",
            }}
          />
        )}
      </AnimatePresence>

      {/* Top bar */}
      <header
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          background: "rgba(2,6,23,0.92)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: `1px solid ${rgba(DS.border, 0.6)}`,
        }}
      >
        <div
          style={{
            maxWidth: "80rem",
            margin: "0 auto",
            padding: "0 1.5rem",
            height: 64,
            display: "flex",
            alignItems: "center",
            gap: "1rem",
          }}
        >
          {/* Logo */}
          <Link
            href={`/${locale}/`}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              textDecoration: "none",
              flexShrink: 0,
            }}
          >
            <motion.div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: GRD.primary,
              }}
              animate={{
                boxShadow: [
                  "0 0 12px rgba(59,130,246,0.4)",
                  "0 0 24px rgba(129,140,248,0.6)",
                  "0 0 12px rgba(59,130,246,0.4)",
                ],
              }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <svg width="20" height="20" viewBox="0 0 40 40" fill="none">
                <path
                  d="M20 2 L36 11 L36 29 L20 38 L4 29 L4 11 Z"
                  stroke="rgba(255,255,255,0.8)"
                  strokeWidth="1.5"
                  fill="none"
                />
                <path
                  d="M20 8 L30 13.5 L30 25 L20 30.5 L10 25 L10 13.5 Z"
                  fill="rgba(255,255,255,0.12)"
                />
                <text x="20" y="25" textAnchor="middle" fontSize="14" fontWeight="900" fill="white" fontFamily="serif">
                  ∞
                </text>
              </svg>
            </motion.div>
            <div>
              <div
                style={{
                  color: DS.text,
                  fontFamily: "'Cinzel', serif",
                  fontSize: "1rem",
                  fontWeight: 900,
                  letterSpacing: "0.06em",
                  lineHeight: 1,
                }}
              >
                LOOP
              </div>
              <div
                style={{
                  color: DS.text4,
                  fontSize: "0.5625rem",
                  fontFamily: "'JetBrains Mono', monospace",
                  letterSpacing: "0.2em",
                  marginTop: 2,
                }}
              >
                SOLUTIONS
              </div>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.25rem",
              marginLeft: "1.5rem",
              flex: 1,
            }}
            className="hide-mobile"
          >
            {navLinks.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  style={{
                    padding: "0.375rem 0.75rem",
                    borderRadius: 8,
                    color: active ? DS.text : DS.text3,
                    background: active ? "rgba(59,130,246,0.1)" : "transparent",
                    border: active ? "1px solid rgba(59,130,246,0.2)" : "1px solid transparent",
                    fontSize: "0.8125rem",
                    fontWeight: active ? 600 : 400,
                    textDecoration: "none",
                    transition: "all 0.15s ease",
                    whiteSpace: "nowrap",
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      (e.currentTarget as HTMLAnchorElement).style.background = rgba(DS.border, 0.3);
                      (e.currentTarget as HTMLAnchorElement).style.color = DS.text2;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
                      (e.currentTarget as HTMLAnchorElement).style.color = DS.text3;
                    }
                  }}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right actions */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              flexShrink: 0,
              marginLeft: "auto",
            }}
          >
            {/* Locale Switcher */}
            <LocaleSwitcher locale={locale} />

            {/* User menu */}
            {isAuthenticated && user ? (
              <div style={{ position: "relative" }} ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    background: rgba(DS.text, 0.03),
                    border: `1px solid ${rgba(DS.text, 0.08)}`,
                    borderRadius: 10,
                    padding: "0.25rem 0.625rem 0.25rem 0.25rem",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => {
                    const rl = roleLabels[user.role] ?? { color: DS.text4 };
                    (e.currentTarget as HTMLButtonElement).style.borderColor = rgba(rl.color, 0.3);
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = rgba(DS.text, 0.08);
                  }}
                >
                  <img
                    src={user.avatar}
                    alt={user.name}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 7,
                      objectFit: "cover",
                      border: "1.5px solid rgba(129,140,248,0.5)",
                    }}
                  />
                  <div style={{ display: "none" }} className="hide-mobile">
                    <div style={{ color: DS.text, fontSize: "0.6875rem", fontWeight: 600 }}>
                      {user.shortName}
                    </div>
                    <div
                      style={{
                        color: (roleLabels[user.role] ?? { color: DS.text4 }).color,
                        fontSize: "0.5rem",
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      {roleLabels[user.role]?.label ?? user.role}
                    </div>
                  </div>
                  <ChevronDown
                    size={11}
                    style={{
                      color: DS.text5,
                      transition: "transform 0.15s",
                      transform: userMenuOpen ? "rotate(180deg)" : "none",
                    }}
                  />
                </button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.97 }}
                      style={{
                        position: "absolute",
                        top: "100%",
                        right: 0,
                        marginTop: "0.5rem",
                        width: 240,
                        background: rgba(DS.bgCard, 0.98),
                        border: `1px solid ${rgba(DS.blue, 0.12)}`,
                        borderRadius: 12,
                        backdropFilter: "blur(20px)",
                        boxShadow: "0 16px 48px rgba(0,0,0,0.55)",
                        overflow: "hidden",
                        zIndex: 100,
                      }}
                    >
                      {/* User info */}
                      <div
                        style={{
                          padding: "0.75rem 1rem",
                          borderBottom: `1px solid ${DS.border}`,
                        }}
                      >
                        <div style={{ color: DS.text2, fontSize: "0.875rem", fontWeight: 500 }}>
                          {user.name}
                        </div>
                        <div style={{ color: DS.text5, fontSize: "0.75rem" }}>{user.email}</div>
                        {user.lpBalance > 0 && (
                          <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", marginTop: "0.375rem" }}>
                            <Zap size={10} style={{ color: DS.purple }} />
                            <span
                              style={{
                                color: DS.purple,
                                fontSize: "0.75rem",
                                fontFamily: "'JetBrains Mono', monospace",
                                fontWeight: 600,
                              }}
                            >
                              {user.lpBalance.toLocaleString("vi-VN")} LP
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Links */}
                      {[
                        ...(user.role === "client"
                          ? [{ href: `/${locale}/khach-hang`, label: t("customer"), icon: "🏠" }]
                          : [{ href: "/admin/overview", label: t("dashboardAdmin"), icon: "⚙️" }]),
                        { href: `/${locale}/khach-hang`, label: t("myLpWallet"), icon: "💎" },
                      ].map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setUserMenuOpen(false)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.625rem",
                            padding: "0.625rem 1rem",
                            color: DS.text3,
                            fontSize: "0.8125rem",
                            textDecoration: "none",
                            transition: "background 0.1s ease, color 0.1s ease",
                          }}
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLAnchorElement).style.background = "rgba(59,130,246,0.06)";
                            (e.currentTarget as HTMLAnchorElement).style.color = DS.text;
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLAnchorElement).style.background = "none";
                            (e.currentTarget as HTMLAnchorElement).style.color = DS.text3;
                          }}
                        >
                          <span>{item.icon}</span> {item.label}
                        </Link>
                      ))}

                      {/* Logout */}
                      <button
                        onClick={handleLogout}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.625rem",
                          width: "100%",
                          padding: "0.625rem 1rem",
                          background: "none",
                          border: "none",
                          borderTop: `1px solid ${DS.border}`,
                          cursor: "pointer",
                          color: DS.red,
                          fontSize: "0.8125rem",
                          transition: "background 0.1s ease",
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,0.06)";
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.background = "none";
                        }}
                      >
                        <LogOut size={14} /> {t("logout")}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link
                href={`/${locale}/dang-nhap`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.375rem",
                  color: DS.text4,
                  fontSize: "0.8125rem",
                  padding: "0.375rem 0.75rem",
                  borderRadius: 8,
                  border: `1px solid ${rgba(DS.text, 0.08)}`,
                  textDecoration: "none",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.color = DS.text;
                  (e.currentTarget as HTMLAnchorElement).style.borderColor = rgba(DS.text, 0.18);
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.color = DS.text4;
                  (e.currentTarget as HTMLAnchorElement).style.borderColor = rgba(DS.text, 0.08);
                }}
              >
                <LogIn size={14} />
                <span className="hide-mobile">{t("login")}</span>
              </Link>
            )}

            {/* CTA */}
            <Link
              href={`/${locale}/booking`}
              className="hide-mobile"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.375rem",
                background: GRD.primary,
                color: "#fff",
                fontSize: "0.8125rem",
                fontWeight: 600,
                padding: "0.5rem 1rem",
                borderRadius: 8,
                textDecoration: "none",
                boxShadow: "0 0 20px rgba(59,130,246,0.3)",
                transition: "opacity 0.15s ease",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.opacity = "0.9";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.opacity = "1";
              }}
            >
              <Rocket size={14} />
              {t("bookNow")}
            </Link>

            {/* Mobile hamburger */}
            <button
              className="show-mobile"
              onClick={() => setMobileOpen(!mobileOpen)}
              style={{
                background: rgba(DS.text, 0.04),
                border: `1px solid ${rgba(DS.text, 0.08)}`,
                borderRadius: 10,
                padding: "0.375rem",
                cursor: "pointer",
                color: DS.text,
              }}
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              style={{
                overflow: "hidden",
                background: "rgba(2,6,23,0.98)",
                borderTop: `1px solid ${DS.border}`,
              }}
            >
              <nav
                style={{
                  padding: "0.75rem 1.5rem 1.25rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.25rem",
                }}
              >
                {navLinks.map((link) => {
                  const active = isActive(link.href);
                  return (
                    <Link
                      key={`mobile-${link.href}`}
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      style={{
                        padding: "0.625rem 0.875rem",
                        borderRadius: 8,
                        color: active ? DS.blue : DS.text3,
                        background: active ? "rgba(59,130,246,0.08)" : "transparent",
                        fontSize: "0.9375rem",
                        fontWeight: active ? 600 : 400,
                        textDecoration: "none",
                      }}
                    >
                      {link.label}
                    </Link>
                  );
                })}
                <Link
                  href={`/${locale}/booking`}
                  onClick={() => setMobileOpen(false)}
                  style={{
                    marginTop: "0.5rem",
                    padding: "0.75rem",
                    borderRadius: 10,
                    background: GRD.primary,
                    color: "#fff",
                    fontSize: "0.9375rem",
                    fontWeight: 600,
                    textDecoration: "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.5rem",
                  }}
                >
                  <Rocket size={16} /> {t("bookNowConsult")}
                </Link>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Spacer for fixed header */}
      <div style={{ height: 64 }} />

      <style>{`
        @media (min-width: 768px) {
          .hide-mobile { display: flex !important; }
          .show-mobile { display: none !important; }
        }
        @media (max-width: 767px) {
          .hide-mobile { display: none !important; }
          .show-mobile { display: flex !important; }
        }
      `}</style>
    </>
  );
}
