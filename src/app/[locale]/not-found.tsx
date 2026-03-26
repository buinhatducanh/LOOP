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

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function NotFound({ params }: Props) {
  // Resolve locale: try params first, fallback to getLocale()
  const resolved = await params.catch(() => null);
  const locale = resolved?.locale ?? getLocale();

  // Fallback to VI if locale is invalid
  const safeLocale = ["vi", "en"].includes(locale) ? locale : "vi";

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
