/**
 * SiteHeader — LOOP Solutions
 * Shared header with locale-aware navigation.
 * Renders nav links using next-intl translations.
 */

import { getTranslations } from "next-intl/server";
import LocaleSwitcher from "@/components/LocaleSwitcher";

type Props = {
  locale: string;
  activeRoute?: string;
};

export default async function SiteHeader({ locale, activeRoute }: Props) {
  const t = await getTranslations("Navigation");

  const navLinks = [
    { href: `/${locale}`, label: t("home"), key: "home" },
    { href: `/${locale}/services`, label: t("services"), key: "services" },
    { href: `/${locale}/portfolio`, label: t("portfolio"), key: "portfolio" },
    { href: `/${locale}/about`, label: t("about"), key: "about" },
    { href: `/${locale}/team`, label: t("team"), key: "team" },
    { href: `/${locale}/blog`, label: t("blog"), key: "blog" },
    { href: `/${locale}/contact`, label: t("contact"), key: "contact" },
  ];

  return (
    <header
      style={{
        padding: "1rem 2rem",
        borderBottom: "1px solid #eee",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        position: "sticky",
        top: 0,
        background: "#fff",
        zIndex: 100,
      }}
    >
      <nav style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
        <a
          href={`/${locale}`}
          style={{ fontWeight: "bold", fontSize: "1.25rem", textDecoration: "none", color: "#000" }}
        >
          LOOP
        </a>
        {navLinks.map((link) => (
          <a
            key={link.key}
            href={link.href}
            style={{
              textDecoration: "none",
              color: activeRoute === link.key ? "#0070f3" : "#333",
              fontWeight: activeRoute === link.key ? "bold" : "normal",
            }}
          >
            {link.label}
          </a>
        ))}
      </nav>
      <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
        <LocaleSwitcher />
        <a
          href={`/${locale}/contact`}
          style={{
            padding: "0.5rem 1rem",
            background: "#0070f3",
            color: "#fff",
            borderRadius: "4px",
            textDecoration: "none",
            fontSize: "0.875rem",
          }}
        >
          {t("contact")}
        </a>
      </div>
    </header>
  );
}
