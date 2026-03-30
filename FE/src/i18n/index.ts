/**
 * FE i18n — Public API
 *
 * Usage:
 *   import { useTranslation, useLocale, injectFontClasses } from '@/i18n';
 *   import { SUPPORTED_LOCALES, isSupportedLocale, detectLocaleFromBrowser } from '@/i18n';
 */

// Core translation
export { useTranslation, useLocale } from './useTranslation';

// Font management
export {
  loadFont,
  preloadFont,
  applyLocaleFont,
  getLocaleFontClass,
  needsCjkFont,
  getFontUrl,
  injectFontClasses,
} from './fonts';

// Utilities
export {
  SUPPORTED_LOCALES,
  isSupportedLocale,
  detectLocaleFromBrowser,
  getLocaleFromPath,
  addLocalePrefix,
  removeLocalePrefix,
} from './i18n';

// Re-export Locale type
export type { Locale } from '../app/store/localeStore';
