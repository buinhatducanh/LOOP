/**
 * SiteFooter — LOOP Solutions
 * Shared footer with locale-aware translations.
 */

import { getTranslations } from "next-intl/server";

type Props = {
  locale: string;
};

export default async function SiteFooter({ locale }: Props) {
  const t = await getTranslations("footer");
  const tNav = await getTranslations("nav");
  const year = new Date().getFullYear();

  return (
    <footer
      style={{
        borderTop: "1px solid #eee",
        padding: "3rem 2rem",
        background: "#f9f9f9",
        marginTop: "auto",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "2rem",
        }}
      >
        {/* Brand */}
        <div>
          <h3 style={{ fontSize: "1.25rem", marginBottom: "0.5rem" }}>LOOP</h3>
          <p style={{ color: "#666", fontSize: "0.875rem", lineHeight: 1.6 }}>
            {t("tagline")}
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h4 style={{ fontSize: "0.875rem", fontWeight: "bold", marginBottom: "0.75rem", textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>
            {t("quickLinks")}
          </h4>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {[
              { href: `/${locale}/services`, label: tNav("services") },
              { href: `/${locale}/portfolio`, label: tNav("portfolio") },
              { href: `/${locale}/pricing`, label: tNav("pricing") },
              { href: `/${locale}/about`, label: tNav("about") },
              { href: `/${locale}/blog`, label: tNav("blog") },
            ].map((link) => (
              <li key={link.href}>
                <a href={link.href} style={{ color: "#666", textDecoration: "none", fontSize: "0.875rem" }}>
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Company */}
        <div>
          <h4 style={{ fontSize: "0.875rem", fontWeight: "bold", marginBottom: "0.75rem", textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>
            {t("company")}
          </h4>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {[
              { href: `/${locale}/team`, label: tNav("team") },
              { href: `/${locale}/contact`, label: tNav("contact") },
            ].map((link) => (
              <li key={link.href}>
                <a href={link.href} style={{ color: "#666", textDecoration: "none", fontSize: "0.875rem" }}>
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Legal */}
        <div>
          <h4 style={{ fontSize: "0.875rem", fontWeight: "bold", marginBottom: "0.75rem", textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>
            {t("legal")}
          </h4>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <li>
              <a href={`/${locale}/privacy`} style={{ color: "#666", textDecoration: "none", fontSize: "0.875rem" }}>
                {t("privacy")}
              </a>
            </li>
            <li>
              <a href={`/${locale}/terms`} style={{ color: "#666", textDecoration: "none", fontSize: "0.875rem" }}>
                {t("terms")}
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Copyright */}
      <div
        style={{
          maxWidth: "1200px",
          margin: "2rem auto 0",
          paddingTop: "1.5rem",
          borderTop: "1px solid #ddd",
          textAlign: "center",
          color: "#999",
          fontSize: "0.875rem",
        }}
      >
        {t("copyright", { year })}
      </div>
    </footer>
  );
}
