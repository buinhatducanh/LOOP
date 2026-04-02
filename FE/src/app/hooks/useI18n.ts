/**
 * useI18n — thin hook around the locale store
 * Usage:
 *   const { t, locale, setLocale } = useI18n();
 *   <span>{t('landing.hero.headline1')}</span>
 *   <span>{t('services.pkgTrialBadge', { days: 5 })}</span>
 */
import { useLocaleStore } from '@/store/localeStore';

export function useI18n() {
  const { locale, setLocale, t } = useLocaleStore();
  return { t, locale, setLocale };
}
