/**
 * Shared Locale Page Template — LOOP Solutions
 * Template for all [locale] segment pages.
 * Copy this file to create new locale-aware pages.
 *
 * Pattern:
 * 1. Import setRequestLocale from next-intl/server
 * 2. Define Props type with params: Promise<{ locale: string }>
 * 3. Call setRequestLocale(locale) to enable static rendering
 * 4. Use getTranslations("namespace") for translation strings
 */

import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function LocalePage({ params }: Props) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }

  setRequestLocale(locale);

  return (
    <main>
      <div style={{ padding: "2rem" }}>
        {/* Page content goes here — copy this file as template */}
      </div>
    </main>
  );
}
