/**
 * Locale Store — Zustand
 * Manages current locale across the app.
 */
import { create } from 'zustand';

export const SUPPORTED_LOCALES = ['vi', 'en', 'ja', 'ko', 'zh'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const LOCALE_LABELS: Record<Locale, string> = {
  vi: 'Tiếng Việt',
  en: 'English',
  ja: '日本語',
  ko: '한국어',
  zh: '中文',
};

export const LOCALE_FLAGS: Record<Locale, string> = {
  vi: '🇻🇳',
  en: '🇬🇧',
  ja: '🇯🇵',
  ko: '🇰🇷',
  zh: '🇨🇳',
};

interface LocaleState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

export const useLocaleStore = create<LocaleState>((set) => ({
  locale: 'vi',
  setLocale: (locale) => {
    localStorage.setItem('loop_locale', locale);
    set({ locale });
  },
}));

// Init from localStorage
if (typeof window !== 'undefined') {
  const saved = localStorage.getItem('loop_locale') as Locale | null;
  if (saved && SUPPORTED_LOCALES.includes(saved)) {
    useLocaleStore.setState({ locale: saved });
  }
}
