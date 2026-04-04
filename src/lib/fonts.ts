/**
 * Font Loading — LOOP Solutions
 *
 * Strategy: Tiered loading for optimal performance
 * - VI/EN: DM Sans (body) + Plus Jakarta Sans (headings)
 * - JA (Japanese):  Noto Sans JP
 * - KO (Korean):    Noto Sans KR
 * - ZH (Chinese):   Noto Sans SC
 *
 * next/font/google is used — fonts are auto-optimized by Next.js.
 * Only the active locale's font CSS class is applied to <body> per page render.
 */

import {
  DM_Sans,
  Plus_Jakarta_Sans,
  Noto_Sans_JP,
  Noto_Sans_KR,
  Noto_Sans_SC,
} from "next/font/google";

// Singleton instances — created once at module load
const bodyFont = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-dm-sans",
});

const headingFont = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-plus-jakarta",
});

const jpFont = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-noto-jp",
});

const krFont = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-noto-kr",
});

const scFont = Noto_Sans_SC({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-noto-sc",
});

/**
 * Returns the next/font CSS class for the active locale's font.
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
      // VI and EN use DM Sans
      return bodyFont.className;
  }
}

/** Returns the heading font CSS class for heading elements. */
export function getHeadingFontClass(): string {
  return headingFont.className;
}

/** CSS variable name for the body font (used in DS.heading / DS.body tokens). */
export const FONT_BODY = "DM Sans, var(--font-dm-sans), system-ui, sans-serif";
export const FONT_MONO = "'JetBrains Mono', monospace";
export const FONT_HEADING = "Plus Jakarta Sans, var(--font-plus-jakarta), system-ui, sans-serif";
