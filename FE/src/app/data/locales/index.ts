/**
 * Layer 2 i18n — Data array localization
 * Selects locale-appropriate data (courses, blog posts, web packages)
 * based on the current locale from the store.
 */
import type { Locale } from '@/store/localeStore';
import { blogVi } from './blog-vi';
import { blogEn } from './blog-en';
import { servicesVi } from './services-vi';
import { servicesEn } from './services-en';
import { academyVi } from './academy-vi';
import { academyEn } from './academy-en';

// ── Blog posts ────────────────────────────────────────────────────────────────
export const BLOG_POSTS: Record<Locale, typeof blogVi> = {
  vi: blogVi,
  en: blogEn,
  ja: blogEn, // fallback to EN
  ko: blogEn,
  zh: blogEn,
};

// ── Web packages (localized fields only: industry, tagline, description, features) ──
export const SERVICES_PACKAGES: Record<Locale, typeof servicesVi> = {
  vi: servicesVi,
  en: servicesEn,
  ja: servicesEn,
  ko: servicesEn,
  zh: servicesEn,
};

// ── Academy data ────────────────────────────────────────────────────────────────
export const ACADEMY_DATA: Record<Locale, typeof academyVi> = {
  vi: academyVi,
  en: academyEn,
  ja: academyEn,
  ko: academyEn,
  zh: academyEn,
};
