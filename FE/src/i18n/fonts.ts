/**
 * Fonts — CJK lazy loading
 * Only loads CJK fonts when user switches to ja/ko/zh locale.
 */

type FontFamily = 'ja' | 'ko' | 'zh';

const FONT_URLS: Record<FontFamily, string> = {
  ja: 'https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@300;400;500;700&display=swap',
  ko: 'https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&display=swap',
  zh: 'https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@300;400;500;700&display=swap',
};

let loadedFonts: Set<FontFamily> = new Set();

export async function loadLocaleFont(locale: string): Promise<void> {
  const family = locale as FontFamily;
  if (!['ja', 'ko', 'zh'].includes(family)) return;
  if (loadedFonts.has(family)) return;

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = FONT_URLS[family];
  document.head.appendChild(link);
  loadedFonts.add(family);
}

export function injectFontClasses(locale: string): void {
  const html = document.documentElement;
  ['lang-ja', 'lang-ko', 'lang-zh', 'lang-vi', 'lang-en'].forEach((c) => html.classList.remove(c));
  html.classList.add(`lang-${locale}`);
  html.lang = locale;
}
