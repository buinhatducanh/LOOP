/**
 * About Page — LOOP Solutions
 */

import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";

type Props = { params: Promise<{ locale: string }> };

export default async function AboutPage({ params }: Props) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) notFound();
  setRequestLocale(locale);

  const t = await getTranslations("about");

  return (
    <div style={{ padding: "3rem 2rem", maxWidth: "900px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>{t("title")}</h1>
      <p style={{ color: "#888", marginBottom: "0.5rem" }}>{t("story.p1")}</p>
      <p style={{ color: "#888" }}>{t("story.p2")}</p>
    </div>
  );
}
