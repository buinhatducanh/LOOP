/**
 * [locale] Home Page — LOOP Solutions
 *
 * NOTE: This is a minimal placeholder page demonstrating i18n routing.
 * Full public pages will be implemented in the FE repo.
 * This placeholder ensures the [locale] segment is functional.
 */

import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";

type Props = {
  params: Promise<{ locale: string }>;
};

// Allow dynamic rendering for locale pages (not statically prerendered at build time)
// next-intl requires locale to be available from request context
export const dynamicParams = true;

export default async function LocaleHomePage({ params }: Props) {
  const { locale } = await params;

  // Validate locale — show 404 for invalid
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }

  setRequestLocale(locale);

  const t = await getTranslations("home.hero");

  return (
    <main>
      <h1>{t("title")}</h1>
      <p>{t("subtitle")}</p>
      <a href={`/${locale}/services`}>{t("cta")}</a>
    </main>
  );
}
