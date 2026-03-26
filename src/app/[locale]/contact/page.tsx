/**
 * Contact Page — LOOP Solutions
 */

import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";

type Props = { params: Promise<{ locale: string }> };

export default async function ContactPage({ params }: Props) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) notFound();
  setRequestLocale(locale);

  const t = await getTranslations("contact");

  return (
    <div style={{ padding: "3rem 2rem", maxWidth: "900px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>{t("title")}</h1>
      <p style={{ fontSize: "1.25rem", color: "#666", marginBottom: "3rem" }}>{t("subtitle")}</p>
      <div style={{ color: "#888" }}>[{t("title")}] — placeholder</div>
    </div>
  );
}
