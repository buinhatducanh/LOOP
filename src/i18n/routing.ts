/**
 * i18n Routing Configuration — LOOP Solutions
 * Phase 0: VI + EN
 * Phase 1: + JA + KO
 * Phase 2: + ZH (lazy)
 */

import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["vi", "en"],
  defaultLocale: "vi",
  localePrefix: "always",
});

export type Locale = (typeof routing.locales)[number];
