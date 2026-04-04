/**
 * Font Loading — LOOP Solutions
 *
 * Strategy: Tiered loading for optimal performance
 * - VI/EN: Geist (modern, premium, Vercel-quality)
 * - JA (Japanese):  Noto Sans JP
 * - KO (Korean):    Noto Sans KR
 * - ZH (Chinese):    Noto Sans SC
 *
 * next/font/google is used — fonts are auto-optimized by Next.js.
 * Only the active locale's font CSS class is applied to <body> per page render.
 * VI/EN users pay ZERO font overhead.
 */

import {
  Geist,
  Noto_Sans_JP,
  Noto_Sans_KR,
  Noto_Sans_SC,
  Cinzel,
} from "next/font/google";

// Singleton instances — created once at module load
const geistFont = Geist({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-geist",
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

const cinzelFont = Cinzel({
  subsets: ["latin"],
  weight: ["400", "600", "700", "900"],
  variable: "--font-cinzel",
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
      // VI and EN use Geist
      return geistFont.className;
  }
}

/** Returns the Cinzel font CSS class for heading elements. */
export function getCinzelClass(): string {
  return cinzelFont.className;
}

/** CSS variable name for the body font (used in DS.heading / DS.body tokens). */
export const FONT_BODY = "Geist, var(--font-geist), system-ui, sans-serif";
export const FONT_MONO = "'JetBrains Mono', monospace";
export const FONT_HEADING = "var(--font-cinzel), serif";
