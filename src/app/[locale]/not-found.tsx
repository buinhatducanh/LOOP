/**
 * 404 Not Found Page — LOOP Solutions
 * Locale-aware 404 for all public pages.
 */

import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function NotFound({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("errors.pageNotFound");

  return (
    <html lang={locale}>
      <body style={{ fontFamily: "system-ui, sans-serif", padding: "2rem", textAlign: "center" }}>
        <h1 style={{ fontSize: "4rem", marginBottom: "1rem" }}>404</h1>
        <h2>{t("title")}</h2>
        <p>{t("message")}</p>
        <a href={`/${locale}`} style={{ color: "blue", textDecoration: "underline" }}>
          {t("backHome")}
        </a>
      </body>
    </html>
  );
}
