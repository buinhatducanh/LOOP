/**
 * Locale data registry — BE uses this to serve translated static data arrays.
 *
 * Services: WebPackages data (industry names, taglines, features, badges).
 * Academy: Courses, instructors, FAQ, etc.
 * Blog: Blog posts with full content.
 *
 * Fallback chain: requested locale → EN → VI
 */

import { servicesPackagesJa } from "./services-ja";
import { servicesPackagesKo } from "./services-ko";
import { servicesPackagesZh } from "./services-zh";

export type Locale = "vi" | "en" | "ja" | "ko" | "zh";

// Stub types for VI/EN until static data files are restored
type ServicesPackage = typeof servicesPackagesJa[number];

export const SERVICES_PACKAGES: Record<Locale, ServicesPackage[]> = {
  vi: [],
  en: [],
  ja: servicesPackagesJa,
  ko: servicesPackagesKo,
  zh: servicesPackagesZh,
};

export function getServicesPackages(locale: string) {
  return SERVICES_PACKAGES[locale as Locale] ?? SERVICES_PACKAGES.en;
}
