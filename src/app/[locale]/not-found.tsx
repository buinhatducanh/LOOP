/**
 * 404 Not Found Page — LOOP Solutions
 * Locale-aware 404 for all public pages.
 *
 * NOTE: not-found.tsx in [locale] segment receives locale from the segment.
 * Uses getLocale() from next-intl server utilities as primary locale source
 * to handle edge cases where params may not be fully resolved.
 *
 * IMPORTANT: Do NOT render <html> or <body> — the parent layout already provides them.
 * This component must return content that fits within the existing shell.
 */

import Link from "next/link";
import { setRequestLocale } from "next-intl/server";
import { getTranslations, getLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function NotFound({ params }: Props) {
  let resolved: { locale: string } | null = null;
  try {
    resolved = await params;
  } catch {
    // ignore
  }

  const rawLocale = resolved?.locale ?? getLocale();
  const locale: string = typeof rawLocale === "string"
    ? rawLocale
    : routing.defaultLocale;
  const safeLocale = routing.locales.includes(locale as (typeof routing.locales)[number])
    ? locale
    : routing.defaultLocale;

  setRequestLocale(safeLocale);

  const t = await getTranslations("NotFound");

  return (
    <div
      style={{
        minHeight: "60vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "4rem 2rem",
      }}
    >
      <div
        style={{
          fontSize: "8rem",
          fontWeight: 900,
          lineHeight: 1,
          background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          fontFamily: "var(--font-heading, system-ui)",
          marginBottom: "1.5rem",
        }}
      >
        404
      </div>

      <h1
        style={{
          fontSize: "1.75rem",
          fontWeight: 800,
          color: "#0f172a",
          marginBottom: "0.75rem",
          fontFamily: "var(--font-heading, system-ui)",
        }}
      >
        {t("title")}
      </h1>

      <p
        style={{
          color: "#64748b",
          maxWidth: "400px",
          marginBottom: "2rem",
          lineHeight: 1.6,
        }}
      >
        {t("description")}
      </p>

      <Link
        href={`/${safeLocale}`}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.5rem",
          padding: "0.75rem 1.75rem",
          background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
          color: "white",
          borderRadius: "0.5rem",
          textDecoration: "none",
          fontWeight: 700,
          fontSize: "0.9375rem",
          transition: "opacity 0.2s",
        }}
      >
        {t("backToHome")}
      </Link>
    </div>
  );
}
