/**
 * i18n — Lightweight i18n for LOOP FE
 * Works with JSON message files saved in src/i18n/messages/
 */
import { useLocaleStore, type Locale } from '@/store/localeStore';

type MessageValue = string | Record<string, unknown>;
type Messages = Record<string, MessageValue>;

// Cache for loaded message files
const messageCache: Partial<Record<Locale, Messages>> = {};

// Load messages for a locale
async function loadMessages(locale: Locale): Promise<Messages> {
  if (messageCache[locale]) return messageCache[locale]!;

  try {
    const messages = await import(`../messages/${locale}.json`) as { default: Messages };
    messageCache[locale] = messages.default;
    return messages.default;
  } catch {
    // Fallback to Vietnamese
    if (locale !== 'vi') {
      return loadMessages('vi');
    }
    return {};
  }
}

// Get nested value from object by dot-path
function getNestedValue(obj: unknown, path: string): string | undefined {
  const keys = path.split('.');
  let val: unknown = obj;
  for (const key of keys) {
    if (val && typeof val === 'object' && key in val) {
      val = (val as Record<string, unknown>)[key];
    } else {
      return undefined;
    }
  }
  return typeof val === 'string' ? val : undefined;
}

// Preload messages for all locales
export async function preloadMessages(locales: Locale[] = ['vi', 'en', 'ja', 'ko', 'zh']) {
  await Promise.all(locales.map(loadMessages));
}

// i18n hook
export function useI18n() {
  const locale = useLocaleStore((s) => s.locale);

  function t(key: string, params?: Record<string, string | number>): string {
    const messages = messageCache[locale] ?? {};
    let value = getNestedValue(messages, key);

    if (value === undefined && locale !== 'vi') {
      value = getNestedValue(messageCache['vi'] ?? {}, key);
    }

    if (value === undefined) return key;

    if (params) {
      return value.replace(/\{(\w+)\}/g, (_, k) => String(params[k] ?? `{${k}}`));
    }

    return value;
  }

  function ns(namespace: string) {
    const messages = messageCache[locale] ?? {};
    const nsData = (messages[namespace] ?? {}) as Record<string, unknown>;
    return {
      t: (key: string, params?: Record<string, string | number>) => {
        let value = typeof nsData[key] === 'string' ? (nsData[key] as string) : key;
        if (params) {
          value = value.replace(/\{(\w+)\}/g, (_, k) => String(params[k] ?? `{${k}}`));
        }
        return value;
      },
    };
  }

  return { t, locale, ns };
}
