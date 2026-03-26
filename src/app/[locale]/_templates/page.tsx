/**
 * Shared Locale Page Template — LOOP Solutions
 * Template for all [locale] segment pages.
 * Copy this file to create new locale-aware pages.
 *
 * Pattern:
 * 1. Import setRequestLocale + getTranslations from next-intl/server
 * 2. Define Props type with params: Promise<{ locale: string }>
 * 3. Call setRequestLocale(locale) to enable static rendering
 * 4. Use getTranslations("namespace") for translation strings
 * 5. Optional: import LocaleSwitcher from "@/components/LocaleSwitcher"
 */

import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import LocaleSwitcher from "@/components/LocaleSwitcher";

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
      <header style={{ padding: "1rem", borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <nav>
          <a href={`/${locale}`} style={{ marginRight: "1rem" }}>Home</a>
          <a href={`/${locale}/services`} style={{ marginRight: "1rem" }}>Services</a>
          <a href={`/${locale}/portfolio`} style={{ marginRight: "1rem" }}>Portfolio</a>
          <a href={`/${locale}/about`} style={{ marginRight: "1rem" }}>About</a>
          <a href={`/${locale}/contact`}>Contact</a>
        </nav>
        <LocaleSwitcher />
      </header>
      <div style={{ padding: "2rem" }}>
        {/* Page content goes here */}
      </div>
    </main>
  );
}
