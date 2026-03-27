/**
 * i18n Navigation — LOOP Solutions
 * Provides locale-aware routing helpers.
 */

import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

// Locale-aware navigation (uses locale from URL segment)
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);

/**
 * Type-safe locale array — use this instead of routing.locales in components.
 */
export type Locale = (typeof routing.locales)[number];
