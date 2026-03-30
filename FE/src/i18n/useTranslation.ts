/**
 * FE i18n — React Hook
 * Integrates with Zustand localeStore for current locale.
 */
import { useCallback } from 'react';
import { t as i18nT, namespace as i18nNamespace } from './i18n';
import { useLocaleStore } from '../app/store/localeStore';

// ── useTranslation hook ──────────────────────────────────────────────────────

/**
 * Main translation hook for FE.
 * Uses current locale from localeStore.
 *
 * @param namespace - Optional namespace to scope translations.
 *                   e.g. "navigation", "footer", "common"
 *
 * @example
 * // Basic usage
 * const { t } = useTranslation();
 * const label = await t("navigation.home");
 *
 * // Namespace usage
 * const { t, ns } = useTranslation("navigation");
 * const home = await t("home"); // namespace-aware: reads "navigation.home"
 *
 * // With params (future: string interpolation)
 * const msg = await t("booking.total", { amount: "5,000,000₫" });
 */
export function useTranslation(namespace?: string) {
  const locale = useLocaleStore((s) => s.locale);

  /**
   * Get a translation for a key.
   * If namespace is provided, the key is prefixed with namespace.
   */
  const t = useCallback(
    async (key: string, fallback?: string): Promise<string> => {
      const fullKey = namespace ? `${namespace}.${key}` : key;
      return i18nT(fullKey, locale, fallback);
    },
    [locale, namespace]
  );

  /**
   * Get all translations for the current namespace.
   * Returns a Promise that resolves to the namespace object.
   */
  const getNamespace = useCallback(async () => {
    if (!namespace) return {};
    return i18nNamespace(namespace, locale);
  }, [locale, namespace]);

  return { t, locale, getNamespace };
}

// ── useLocale hook ────────────────────────────────────────────────────────────

/**
 * Simple hook to get current locale and setLocale.
 */
export function useLocale() {
  const locale = useLocaleStore((s) => s.locale);
  const setLocale = useLocaleStore((s) => s.setLocale);
  return { locale, setLocale };
}

// ── Translation provider (optional) ─────────────────────────────────────────

// For components that need pre-loaded translations, provide context.
// Most components should use useTranslation() directly.
