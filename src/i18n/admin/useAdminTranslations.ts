"use client";

/**
 * useAdminTranslations — Admin i18n hook
 *
 * Provides translated strings for admin sidebar and pages.
 * Works OUTSIDE [locale] routing by reading from cookie.
 *
 * Usage:
 *   const { t, locale, setLocale } = useAdminTranslations();
 *   t("sidebar.nav.overview")   → "Tổng quan" | "Overview"
 *   t("common.save")            → "Lưu" | "Save"
 */

export { useAdminTranslations } from "./AdminI18nProvider";
