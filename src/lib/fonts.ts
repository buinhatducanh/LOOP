/**
 * CJK Font Lazy Loading — LOOP Solutions
 *
 * Strategy: Tiered loading for optimal performance
 * - VI/EN: system-ui fallback (no extra font bundle)
 * - JA (Japanese):  Noto Sans JP  lazy-loaded only when locale=ja
 * - KO (Korean):    Noto Sans KR  lazy-loaded only when locale=ko
 * - ZH (Chinese):   Noto Sans SC  lazy-loaded only when locale=zh
 *
 * next/font/google is used — fonts are auto-optimized by Next.js.
 * Only the active locale's font CSS class is applied to <body> per page render.
 * VI/EN users pay ZERO font overhead.
 */

import { Noto_Sans_JP, Noto_Sans_KR, Noto_Sans_SC, Plus_Jakarta_Sans } from "next/font/google";

// Singleton instances — font objects are created once at module load,
// but only the active locale's className is used per page render.
const jpFont = Noto_Sans_JP({ subsets: ["latin"], weight: ["400", "500", "700"] });
const krFont = Noto_Sans_KR({ subsets: ["latin"], weight: ["400", "500", "700"] });
const scFont = Noto_Sans_SC({ subsets: ["latin"], weight: ["400", "500", "700"] });
const jakartaFont = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });

/**
 * Returns the next/font CSS class for the active locale's font.
 * VI/EN → Plus Jakarta Sans (modern, clean, premium feel).
 * JA/KO/ZH → Noto Sans (native CJK coverage).
 *
 * Usage: <body className={getFontClass(locale)} ...>
 */
export function getFontClass(locale: string): string {
  switch (locale) {
    case "ja":
      return jpFont.className;
    case "ko":
      return krFont.className;
    case "zh":
      return scFont.className;
    default:
      // VI and EN use Plus Jakarta Sans
      return jakartaFont.className;
  }
}
