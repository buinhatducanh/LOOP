/**
 * FE i18n — CJK Font Lazy Loading
 *
 * Strategy: CJK fonts (Japanese, Korean, Chinese) are heavy (~3-8MB each).
 * We lazy-load them only when the user switches to JA/KO/ZH locale.
 * Non-CJK locales (VI, EN) use system fonts or lightweight web fonts.
 *
 * Tiered loading:
 * - VI, EN: no CJK font needed
 * - JA (Japanese): load Noto Sans JP when locale = ja
 * - KO (Korean): load Noto Sans KR when locale = ko
 * - ZH (Chinese): load Noto Sans SC when locale = zh
 *
 * Usage:
 *   const { font, isLoading, error } = useLocaleFont(locale);
 *   // Apply font via: document.documentElement.style.fontFamily = font;
 */

import type { Locale } from '../app/store/localeStore';

// ── Font configs ─────────────────────────────────────────────────────────────

const CJK_FONTS: Record<Exclude<Locale, 'vi' | 'en'>, {
  googleName: string;
  cssName: string;
  cssUrl: string;
  weight?: number;
}> = {
  ja: {
    googleName: 'Noto+Sans+JP',
    cssName: "'Noto Sans JP', sans-serif",
    cssUrl: 'https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@300;400;500;700&display=swap',
    weight: 400,
  },
  ko: {
    googleName: 'Noto+Sans+KR',
    cssName: "'Noto Sans KR', sans-serif",
    cssUrl: 'https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&display=swap',
    weight: 400,
  },
  zh: {
    googleName: 'Noto+Sans+SC',
    cssName: "'Noto Sans SC', sans-serif",
    cssUrl: 'https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@300;400;500;700&display=swap',
    weight: 400,
  },
};

// ── Font link management ──────────────────────────────────────────────────────

const loadedFontLinks = new Set<string>();

/**
 * Dynamically load a Google Font via <link> injection.
 * Idempotent — calling twice with same URL only injects once.
 */
export function loadFont(fontUrl: string): void {
  if (loadedFontLinks.has(fontUrl)) return;
  if (typeof document === 'undefined') return;

  const existing = document.querySelector(`link[href="${CSS.escape(fontUrl)}"]`);
  if (existing) return;

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = fontUrl;
  link.crossOrigin = 'anonymous';
  document.head.appendChild(link);
  loadedFontLinks.add(fontUrl);
}

/**
 * Preload a CJK font for faster display.
 * Use when user is about to switch to a CJK locale.
 */
export function preloadFont(locale: Locale): void {
  if (locale === 'vi' || locale === 'en') return;

  const config = CJK_FONTS[locale as Exclude<Locale, 'vi' | 'en'>];
  if (config) {
    loadFont(config.cssUrl);
  }
}

/**
 * Apply locale font to the document root.
 * Sets font-family CSS variable on :root or html element.
 */
export function applyLocaleFont(locale: Locale): void {
  if (typeof document === 'undefined') return;

  if (locale === 'vi' || locale === 'en') {
    // Remove CJK font override, use default
    document.documentElement.style.removeProperty('--loop-font-cjk');
    return;
  }

  const config = CJK_FONTS[locale as Exclude<Locale, 'vi' | 'en'>];
  if (config) {
    loadFont(config.cssUrl);
    document.documentElement.style.setProperty('--loop-font-cjk', config.cssName);
    // Set the font on body
    document.body.style.fontFamily = `var(--loop-font-cjk, sans-serif)`;
  }
}

/**
 * Get the font CSS class name for a locale.
 * Use this to conditionally apply font-family in Tailwind/components.
 *
 * @example
 * <div className={getLocaleFontClass("ja")}>
 *   日本語テキスト
 * </div>
 */
export function getLocaleFontClass(locale: Locale): string {
  if (locale === 'ja') return 'font-ja';
  if (locale === 'ko') return 'font-ko';
  if (locale === 'zh') return 'font-zh';
  return '';
}

/**
 * Check if a locale needs CJK font loading.
 */
export function needsCjkFont(locale: Locale): boolean {
  return locale === 'ja' || locale === 'ko' || locale === 'zh';
}

/**
 * Get the CSS URL for a locale's font.
 */
export function getFontUrl(locale: Locale): string | null {
  const config = CJK_FONTS[locale as Exclude<Locale, 'vi' | 'en'>];
  return config?.cssUrl ?? null;
}

// ── CSS injection for Tailwind v4 ─────────────────────────────────────────────

/**
 * Inject Tailwind font classes for CJK fonts.
 * Call this once in App.tsx or main entry point.
 *
 * The injected CSS adds:
 * - .font-ja { font-family: 'Noto Sans JP', sans-serif; }
 * - .font-ko { font-family: 'Noto Sans KR', sans-serif; }
 * - .font-zh { font-family: 'Noto Sans SC', sans-serif; }
 */
export function injectFontClasses(): void {
  if (typeof document === 'undefined') return;
  if (document.getElementById('loop-i18n-fonts')) return;

  const style = document.createElement('style');
  style.id = 'loop-i18n-fonts';
  style.textContent = `
/* LOOP i18n — CJK Font Classes */
${Object.values(CJK_FONTS).map(f => `.font-${f.googleName.split('+')[0].toLowerCase()} { font-family: ${f.cssName}; }`).join('\n')}

/* CJK font optimization — disable font-feature-settings for CJK */
.font-ja, .font-ko, .font-zh {
  font-feature-settings: normal;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
`;
  document.head.appendChild(style);
}
