/**
 * Service Detail Page — LOOP Solutions
 */

import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";

type Props = { params: Promise<{ locale: string; slug: string }> };

export default async function ServiceDetailPage({ params }: Props) {
  const { locale, slug } = await params;
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) notFound();
  setRequestLocale(locale);

  const t = await getTranslations("services");
  const tCommon = await getTranslations("common");

  return (
    <div style={{ padding: "3rem 2rem", maxWidth: "900px", margin: "0 auto" }}>
      <p style={{ color: "#888" }}>[{t("detailTitle")}] / {slug} — {tCommon("loading")}</p>
    </div>
  );
}
