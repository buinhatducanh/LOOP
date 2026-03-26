/**
 * 404 Not Found Page — LOOP Solutions
 * Locale-aware 404 for all public pages.
 *
 * NOTE: not-found.tsx in [locale] segment receives locale from the segment.
 * Uses getLocale() from next-intl server utilities as primary locale source
 * to handle edge cases where params may not be fully resolved.
 */

import { setRequestLocale } from "next-intl/server";
import { getTranslations, getLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function NotFound({ params }: Props) {
  // Resolve locale: try params first, fallback to getLocale()
  let resolved: { locale: string } | null = null;
  try {
    resolved = await params;
  } catch {
    // ignore
  }

  const rawLocale = resolved?.locale ?? getLocale();
  // Ensure locale is string — fallback to default if invalid
  const locale: string = typeof rawLocale === "string"
    ? rawLocale
    : routing.defaultLocale;
  const safeLocale = routing.locales.includes(locale as (typeof routing.locales)[number])
    ? locale
    : routing.defaultLocale;

  setRequestLocale(safeLocale);

  const t = await getTranslations("errors.pageNotFound");

  return (
    <html lang={safeLocale}>
      <body style={{ fontFamily: "system-ui, sans-serif", padding: "2rem", textAlign: "center" }}>
        <h1 style={{ fontSize: "4rem", marginBottom: "1rem" }}>404</h1>
        <h2>{t("title")}</h2>
        <p>{t("message")}</p>
        <a href={`/${safeLocale}`} style={{ color: "blue", textDecoration: "underline" }}>
          {t("backHome")}
        </a>
      </body>
    </html>
  );
}
