/**
 * i18n Request Configuration — LOOP Solutions
 * Server-side locale detection for Next.js App Router.
 */

import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  // 1) Resolve locale from request (validated by middleware)
  const locale = await requestLocale;

  // Fallback to default if invalid
  const resolvedLocale =
    locale && routing.locales.includes(locale as (typeof routing.locales)[number])
      ? locale
      : routing.defaultLocale;

  // 2) Load messages for resolved locale
  let messages;
  try {
    messages = (await import(`./messages/${resolvedLocale}.json`)).default;
  } catch {
    messages = (await import(`./messages/${routing.defaultLocale}.json`)).default;
  }

  return {
    locale: resolvedLocale,
    messages,
    timeZone: "Asia/Ho_Chi_Minh",
    now: new Date(),
  };
});
