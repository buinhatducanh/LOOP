/**
 * LocaleSwitcher — LOOP Solutions
 * Allows users to switch between VI and EN.
 * Persists selection in cookie for return visits.
 *
 * Uses next-intl navigation to switch locale while preserving current path.
 */

"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

export default function LocaleSwitcher() {
  const locale = useLocale();
  const t = useTranslations("localeSwitcher");
  const router = useRouter();
  const pathname = usePathname();

  function handleLocaleChange(nextLocale: string) {
    // Persist to cookie for return visits
    document.cookie = `NEXT_LOCALE=${nextLocale}; path=/; max-age=31536000; SameSite=Lax`;

    // Navigate to same path with new locale
    // localePrefix: "always" means all routes have /{locale}/ prefix
    router.replace(pathname, { locale: nextLocale });
  }

  const currentLocale = locale as (typeof routing.locales)[number];

  return (
    <div className="locale-switcher" role="group" aria-label={t("label")}>
      <span className="sr-only">{t("current")}: {currentLocale}</span>
      {routing.locales.map((loc) => {
        const isActive = loc === currentLocale;
        return (
          <button
            key={loc}
            onClick={() => handleLocaleChange(loc)}
            aria-pressed={isActive}
            aria-label={`Switch to ${loc === "vi" ? "Tiếng Việt" : "English"}`}
            style={{
              fontWeight: isActive ? "bold" : "normal",
              opacity: isActive ? 1 : 0.7,
              cursor: "pointer",
              background: "none",
              border: "none",
              padding: "0.25rem 0.5rem",
            }}
          >
            {loc === "vi" ? "VI" : "EN"}
          </button>
        );
      })}
    </div>
  );
}
